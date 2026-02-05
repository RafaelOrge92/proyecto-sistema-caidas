# Firmware ESP32 - Contrato HTTP REST

Este documento resume el contrato de comunicacion entre el firmware del ESP32 y el backend del sistema de deteccion de caidas. Es el mismo contrato que usa el backend: mismos endpoints, headers y formato JSON.

## Configuracion (constantes en firmware)

- `BASE_URL`: `https://api.sistema-caidas.local` (placeholder, aun no desplegado)
- `DEVICE_ID_OVERRIDE`: si esta vacio, el firmware usa el HWID (eFuse) y lo guarda en NVS (formato `ESP32-<HWID>`).
- `DEVICE_KEY`: opcional (si se usa, se envia en header `X-DEVICE-KEY`)

## Headers HTTP

- `Content-Type: application/json`
- `X-DEVICE-KEY: <DEVICE_KEY>` (opcional, futuro)

## Endpoint 1: Heartbeat

`POST {BASE_URL}/api/v1/devices/heartbeat`

Notas de entorno:
- En local sin TLS usa `http://localhost:8000` y el sketch `esp32/esp32_http.ino`.

### JSON minimo
```json
{
  "deviceId": "ESP32-001",
  "timestamp": "2026-02-04T10:00:00Z"
}
```

### JSON recomendado
```json
{
  "deviceId": "ESP32-001",
  "timestamp": "2026-02-04T10:00:00Z",
  "battery": 0.82,
  "rssi": -63,
  "fwVersion": "1.0.0"
}
```

Notas:
- `timestamp` puede ser `null` o aproximado si no hay RTC confiable.
- Frecuencia recomendada: cada 2-5 min (demo). Para ahorro, 10-15 min.

## Endpoint 2: Ingest de evento (cabecera)

`POST {BASE_URL}/api/v1/events/ingest`

### JSON base (FALL - cabecera)
```json
{
  "deviceId": "ESP32-001",
  "eventUid": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "FALL",
  "occurredAt": "2026-02-04T10:15:30Z"
}
```

Campos:
- `eventUid`: UUID v4 generado una sola vez por evento (idempotencia).
- `eventType`: `FALL | EMERGENCY_BUTTON | SIMULATED | TILT`.
- `occurredAt`: ISO string (si no hay RTC, usar estimado).
- `samples`: no va en la cabecera cuando se usa el endpoint de muestras (ver abajo).

### JSON base (EMERGENCY_BUTTON sin samples)
```json
{
  "deviceId": "ESP32-001",
  "eventUid": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "EMERGENCY_BUTTON",
  "occurredAt": "2026-02-04T10:15:30Z"
}
```

### JSON base (TILT sin samples)
```json
{
  "deviceId": "ESP32-001",
  "eventUid": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "TILT",
  "occurredAt": "2026-02-04T10:15:30Z"
}
```

## Endpoint 3: Samples de acelerometro (opcional)

`POST {BASE_URL}/api/v1/events/samples`

Se usa para enviar el bloque de muestras del acelerometro asociado a un evento `FALL`.
Si el backend no expone este endpoint, el firmware envia solo la cabecera del evento.

### JSON base (samples)
```json
{
  "eventUid": "550e8400-e29b-41d4-a716-446655440000",
  "deviceId": "ESP32-001",
  "samples": [
    { "seq": 0, "tMs": -600, "accX": 0.12, "accY": 0.05, "accZ": 9.81 },
    { "seq": 1, "tMs": -580, "accX": 0.12, "accY": 0.05, "accZ": 9.81 }
  ],
  "units": "g"
}
```

## Firmware actual (ESP32)

Archivo:
- `hardware/esp32/esp32_http.ino`

Comportamiento:
- Boton en `GPIO 25` con `INPUT_PULLUP`.
- Captura por interrupcion (FALLING) con debounce ~60ms para no perder pulsaciones mientras hay requests en vuelo.
- Envia `EMERGENCY_BUTTON` al pulsar el boton.
- Inclinometro KY-017 en `GPIO 26` (configurable). Es un interruptor mecanico, no mide angulos.
- Se envia evento `TILT` (solo `tilted:true`) por `/api/v1/events/ingest`. No se reporta el retorno a normal.
- Filtros inclinometro: debounce `150ms`, hold `2000ms`, cooldown `3000ms` (ajustables).
- Acelerometro MPU6050 por I2C (`SDA=21`, `SCL=22`) con rango ±8g y muestreo a 50Hz.
- Deteccion de caida por maquina de estados: free-fall -> impacto -> stillness (confirmacion).
- Valores actuales (configurables): free-fall `<0.55g` por `>=120ms`, impacto `>=1.70g`, stillness `>=1200ms`.
- Se envia cabecera `FALL` por `/api/v1/events/ingest` y muestras por `/api/v1/events/samples` cuando existe.
- UUID v4 generado por evento y reutilizado en los reintentos.
- NTP para UTC (si falla, `occurredAt: null`).
- Heartbeat siempre activo cada 2 min para actualizar `last_seen_at`.
- Cola persistente en NVS (max 10 eventos). Si esta llena, se descarta el mas antiguo.
- Reintentos con backoff: 1s, 3s, 10s y luego cada 60s.
- LED estado (`GPIO2`, active-low): sin WiFi parpadeo lento (500ms).
- LED estado (`GPIO2`, active-low): con cola pendiente parpadeo rapido (200ms).
- LED estado (`GPIO2`, active-low): OK (WiFi + sin cola) encendido fijo.
- WiFi recovery: reintento cada 10s; reinicio si 2 min sin WiFi.
- Watchdog: 15s para evitar bloqueo prolongado.
- Device ID: se genera desde el HWID (eFuse) y se persiste en NVS si `DEVICE_ID_OVERRIDE` esta vacio.

Reglas de `samples`:
- `seq`: 0..N-1
- `tMs`: tiempo relativo en ms (negativo antes del evento, positivo despues).
- Ventana recomendada: ~4s total a 50Hz => 200 muestras.

## Idempotencia (critico)

- Generar `eventUid` solo una vez por evento.
- Reintentar SIEMPRE con el mismo `eventUid`.
- Backend responde `duplicated: true` si ya existe.

## Reintentos (recomendado)

- 3 reintentos: 1s, 3s, 10s.
- Si falla, encolar y reintentar en el siguiente heartbeat.
- Si es posible, persistir cola en NVS.

## Respuestas esperadas

- Exito: `{ "ok": true, "eventId": "...", "duplicated": false }`
- Duplicado: `{ "ok": true, "eventId": "...", "duplicated": true }`
- Errores tipicos: `400`, `401`, `404`

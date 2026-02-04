# Firmware ESP32 - Contrato HTTP REST

Este documento resume el contrato de comunicacion entre el firmware del ESP32 y el backend del sistema de deteccion de caidas. Es el mismo contrato que usa el backend: mismos endpoints, headers y formato JSON.

## Configuracion (constantes en firmware)

- `BASE_URL`: `https://api.sistema-caidas.local` (placeholder, aun no desplegado)
- `DEVICE_ID`: `ESP32-001` (o MAC normalizada estable)
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

## Endpoint 2: Ingest de evento

`POST {BASE_URL}/api/v1/events/ingest`

### JSON base (FALL con samples)
```json
{
  "deviceId": "ESP32-001",
  "eventUid": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "FALL",
  "occurredAt": "2026-02-04T10:15:30Z",
  "samples": [
    { "seq": 0, "tMs": -600, "accX": 0.12, "accY": 0.05, "accZ": 9.81 },
    { "seq": 1, "tMs": -580, "accX": 0.12, "accY": 0.05, "accZ": 9.81 }
  ]
}
```

Campos:
- `eventUid`: UUID v4 generado una sola vez por evento (idempotencia).
- `eventType`: `FALL | EMERGENCY_BUTTON | SIMULATED`.
- `occurredAt`: ISO string (si no hay RTC, usar estimado).
- `samples`: opcional (pero recomendado para grafica).

### JSON base (EMERGENCY_BUTTON sin samples)
```json
{
  "deviceId": "ESP32-001",
  "eventUid": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "EMERGENCY_BUTTON",
  "occurredAt": "2026-02-04T10:15:30Z"
}
```

## Firmware actual (ESP32)

Archivo:
- `hardware/esp32/esp32_http.ino`

Comportamiento:
- Boton en `GPIO 25` con `INPUT_PULLUP`.
- Debounce `40ms` y cooldown `800ms`.
- Envia `EMERGENCY_BUTTON` al pulsar el boton.
- UUID v4 generado por evento y reutilizado en los reintentos.
- NTP para UTC (si falla, `occurredAt: null`).
- Heartbeat siempre activo cada 2 min para actualizar `last_seen_at`.

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

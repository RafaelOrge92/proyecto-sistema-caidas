# Firmware ESP32 - Contrato HTTP actual

Este documento resume el contrato entre el firmware (`hardware/esp32/esp32_http.ino`)
y el backend Node (`backend/src`).

## Base URL y prefijo

- Prefijo actual: `/api` (sin `/v1`).
- Ejemplo local: `http://<IP_PC>:3000`.

## Endpoints usados por el firmware (backend Node)

- `POST /api/devices/heartbeat`
- `PUT /api/devices/heartbeat`
- `POST /api/events/ingest`
- `POST /api/events/samples`

Nota:
- El firmware actual usa `POST /api/devices/heartbeat`.
- El backend acepta `POST` y `PUT` para heartbeat.

## Autenticacion de dispositivo (obligatoria)

Para `heartbeat`, `ingest` y `samples` se validan estos headers:

- `X-Device-Id`
- `X-Device-Key`
- `Content-Type: application/json`

Reglas importantes:

- `X-Device-Key` se envia en texto plano desde el ESP32.
- En base de datos se guarda `device_key_hash` (bcrypt u otro hash soportado).
- Si `X-Device-Id` no existe o la key no coincide: `401`.
- Si el dispositivo existe pero no tiene key configurada: `403`.

## Configuracion en firmware

Archivo: `hardware/esp32/esp32_http.ino`

Constantes clave:

- `WIFI_SSID`
- `WIFI_PASS`
- `BASE_URL`
- `DEVICE_ID_OVERRIDE`
- `DEVICE_KEY`

Notas:

- Si `DEVICE_ID_OVERRIDE` esta vacio, se usa el ID derivado de eFuse y se guarda en NVS.
- Para pruebas controladas, se recomienda fijar `DEVICE_ID_OVERRIDE` al `device_id` exacto de DB.
- No pongas en `DEVICE_KEY` el hash bcrypt; va la clave plana.

## Mapa de hardware (GPIO y buses)

Configuracion actual tomada de `hardware/esp32/esp32_http.ino`:

- Boton emergencia: `GPIO 25` (`BUTTON_PIN`)
  - Modo: `INPUT_PULLUP`
  - Interrupcion: `FALLING`
  - Debounce de ISR: `ISR_DEBOUNCE_MS = 60`

- Inclinometro KY-017: `GPIO 26` (`TILT_PIN`)
  - Modo: `INPUT_PULLUP`
  - Logica activa: `TILT_ACTIVE_LOW = true`
  - Endpoint: `POST /api/events/ingest` con `eventType = "TILT"`

- MPU6050 por I2C:
  - `SDA = GPIO 21` (`IMU_SDA`)
  - `SCL = GPIO 22` (`IMU_SCL`)
  - Endpoint cabecera: `POST /api/events/ingest`
  - Endpoint samples: `POST /api/events/samples`

- LED de estado: `GPIO 2` (`LED_PIN`)
  - Logica activa: `LED_ACTIVE_LOW = true`

## Parametros operativos relevantes

- Heartbeat: `HEARTBEAT_MS = 120000` (2 minutos)
- Reintento WiFi: `WIFI_RETRY_MS = 10000` (10 segundos)
- Reinicio por caida de WiFi: `WIFI_RESTART_MS = 120000` (2 minutos)
- Watchdog: `WDT_TIMEOUT_S = 15`

Tilt:

- `TILT_DEBOUNCE_MS = 150`
- `TILT_HOLD_MS = 2000`
- `TILT_COOLDOWN_MS = 3000`
- Solo se reporta el estado inclinado (`tilted:true`); el retorno a normal se ignora.

Fall (IMU, valores clave):

- Free-fall duro: `FALL_FREEFALL_G_MAX = 0.47`
- Impacto duro: `FALL_IMPACT_G_MIN = 1.32`
- Cooldown post-caida: `FALL_COOLDOWN_MS = 8000`

## Payloads esperados

### 1) Heartbeat

`POST /api/devices/heartbeat`

```json
{
  "deviceId": "ESP32-FC3A57088304",
  "timestamp": "2026-02-11T10:30:00Z",
  "battery": null,
  "rssi": -60,
  "fwVersion": "1.0.0"
}
```

`timestamp` puede ir en `null`.

### 2) Ingest de evento

`POST /api/events/ingest`

```json
{
  "deviceId": "ESP32-FC3A57088304",
  "eventUid": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "EMERGENCY_BUTTON",
  "occurredAt": "2026-02-11T10:30:00Z"
}
```

`occurredAt` puede ir en `null`.

Valores de `eventType` usados hoy:

- `FALL`
- `EMERGENCY_BUTTON`
- `TILT`
- `SIMULATED`

### 3) Samples de evento

`POST /api/events/samples`

```json
{
  "eventUid": "550e8400-e29b-41d4-a716-446655440000",
  "deviceId": "ESP32-FC3A57088304",
  "samples": [
    { "seq": 0, "tMs": -600, "accX": 0.12, "accY": 0.05, "accZ": 0.98 },
    { "seq": 1, "tMs": -580, "accX": 0.13, "accY": 0.04, "accZ": 0.97 }
  ],
  "units": "g"
}
```

## Comportamiento de logs relevante

- `code=201` en ingest/samples indica insercion aceptada.
- `[TILT] normal (ignorado)` es comportamiento esperado:
  al volver de inclinado a normal, no se envia evento de retorno.

## SQL minimo para dejar un ESP32 operativo

### Crear/actualizar hash de key de dispositivo

```sql
UPDATE public.devices
SET device_key_hash = crypt('fc3a5708-test-2026', gen_salt('bf', 10))
WHERE device_id = 'ESP32-FC3A57088304';
```

### Verificar que la key coincide

```sql
SELECT crypt('fc3a5708-test-2026', device_key_hash) = device_key_hash AS key_ok
FROM public.devices
WHERE device_id = 'ESP32-FC3A57088304';
```

### Permitir dispositivos sin paciente al inicio

```sql
ALTER TABLE public.devices
ALTER COLUMN patient_id DROP NOT NULL;
```

## Mock local de hardware

Si usas `hardware/server/server.py`, revisa su README:

- `hardware/server/README.md`

Ese servidor es para pruebas locales y no replica toda la seguridad del backend real.

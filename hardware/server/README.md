# Hardware Local Server (Mock)

Servidor local para pruebas de firmware ESP32.

Importante:

- Este mock sirve para validar flujo HTTP y payloads.
- No replica toda la logica del backend real.
- No aplica autenticacion `X-Device-Id` / `X-Device-Key` como el backend Node.

## Requisitos

- Python 3.10+
- Dependencias del archivo `requirements.txt`

Instalacion:

```bash
pip install -r requirements.txt
```

## Ejecucion

```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

Base URL local:

- `http://localhost:8000`

## Endpoints del mock

- `GET /health`
- `POST /api/devices/heartbeat`
- `POST /api/events/ingest`
- `POST /api/events/samples`
- `POST /api/devices/tilt`

## Diferencias con backend real

Backend real (`backend/src`) usa:

- `POST/PUT /api/devices/heartbeat` con auth de dispositivo.
- `POST /api/events/ingest` con auth de dispositivo.
- `POST /api/events/samples` con auth de dispositivo.

Si algo funciona en mock pero falla en backend real, revisa:

- `X-Device-Id`
- `X-Device-Key`
- `device_id` existente en DB
- `device_key_hash` configurado en DB

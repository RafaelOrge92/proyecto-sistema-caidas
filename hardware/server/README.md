# Hardware Local Server (Mock)

Este directorio esta pensado para levantar un servidor local de pruebas para el ESP32.

## Dependencias

Este servidor usa:
- `fastapi`
- `uvicorn`
- `pydantic`

## Python

- Recomendado: Python 3.10+

Instalar dependencias:
```bash
pip install -r requirements.txt
```

Levantar servidor:
```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

## Endpoints del mock

Base local:
- `http://localhost:8000`

Rutas:
- `GET /health`
- `POST /api/devices/heartbeat`
- `POST /api/events/ingest`
- `POST /api/events/samples`
- `POST /api/devices/tilt`

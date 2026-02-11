# Backend (Node + Express + TypeScript)

API del sistema de deteccion de caidas.

## Stack

- Node.js
- Express
- TypeScript
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`)
- Hash de contrasenas (`bcryptjs`)
- Google OAuth (`google-auth-library`)

## Estructura

- `src/server.ts`: arranque de app y registro de rutas.
- `src/routes/*.ts`: endpoints (`auth`, `users`, `devices`, `events`).
- `src/middleware/auth.ts`: auth JWT y control de rol.
- `src/middleware/deviceAuth.ts`: auth de dispositivos por headers.
- `src/config/db.ts`: pool de PostgreSQL.
- `src/config/env.ts`: validacion de variables criticas.
- `Base de Datos/Scripts/create_db.sql`: esquema y migraciones base.

## Requisitos

- Node.js 18+
- npm
- Base de datos PostgreSQL accesible

## Instalacion y ejecucion

Desde `backend/`:

```bash
npm install
npm run dev
```

Build y arranque compilado:

```bash
npm run build
npm run start
```

## Variables de entorno

Variables usadas por el backend:

- `PORT`
- `NODE_ENV`
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET` (obligatoria)
- `JWT_EXPIRE`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Notas:

- Si `JWT_SECRET` falta, el backend falla al arrancar.
- `JWT_SECRET` no puede ser `dev-secret-change-me`.

## Base de datos

Script principal:

- `Base de Datos/Scripts/create_db.sql`

Incluye:

- tipos `account_role`, `access_type`, `event_type`, `event_status`
- tablas `accounts`, `patients`, `devices`, `device_access`, `events`, `event_samples`
- vista `v_event_acceleration`
- triggers de `updated_at`

Migracion incluida en el script:

- `devices.patient_id` nullable (permite alta inicial de dispositivos sin paciente).

## Autenticacion

### JWT de usuarios

- Header: `Authorization: Bearer <token>`.
- Se emite en `POST /api/auth/login` y `POST /api/auth/google-login`.
- Endpoints de administracion usan `requireAdmin`.

### Auth de dispositivo (hardware)

Headers requeridos en endpoints de ingesta:

- `X-Device-Id`
- `X-Device-Key`

Validacion:

- busca `device_id` en `public.devices`
- compara `X-Device-Key` contra `device_key_hash`
- si no existe dispositivo o key invalida: `401`
- si dispositivo sin `device_key_hash`: `403`

Importante:

- el firmware envia la key en texto plano
- la DB guarda hash (`device_key_hash`)

## Endpoints

Base path: `/api`

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/login`
- `POST /api/auth/google-login`
- `POST /api/auth/logout`

### Users (admin)

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/deactivate`
- `POST /api/users/assign`

### Devices

- `GET /api/devices` (admin)
- `GET /api/devices/podium` (admin)
- `GET /api/devices/:id` (admin)
- `GET /api/devices/user/:userId` (admin o propio usuario)
- `POST /api/devices` (admin)
- `POST /api/devices/heartbeat` (auth dispositivo)
- `PUT /api/devices/heartbeat` (auth dispositivo)

### Events

- `GET /api/events` (admin)
- `GET /api/events/:id` (admin o con acceso al dispositivo)
- `GET /api/events/device/:deviceId` (admin o con acceso)
- `PUT /api/events/update` (admin)
- `POST /api/events` (sin auth de usuario/dispositivo en esta version)
- `POST /api/events/ingest` (auth dispositivo)
- `POST /api/events/samples` (auth dispositivo)

## Integracion con ESP32

Flujo esperado:

1. `POST /api/devices/heartbeat`
2. `POST /api/events/ingest`
3. `POST /api/events/samples` (opcional para eventos con muestras)

Si aparece `Dispositivo no autorizado`:

1. comprobar `X-Device-Id` enviado
2. comprobar `device_id` en DB
3. comprobar `device_key_hash` configurado
4. comprobar que la key enviada es la clave plana correcta

## SQL util para device key

Crear/actualizar hash:

```sql
UPDATE public.devices
SET device_key_hash = crypt('TU_KEY_EN_TEXTO_PLANO', gen_salt('bf', 10))
WHERE device_id = 'ESP32-FC3A57088304';
```

Verificar coincidencia:

```sql
SELECT crypt('TU_KEY_EN_TEXTO_PLANO', device_key_hash) = device_key_hash AS key_ok
FROM public.devices
WHERE device_id = 'ESP32-FC3A57088304';
```

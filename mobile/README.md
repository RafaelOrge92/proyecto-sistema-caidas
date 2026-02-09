<<<<<<< HEAD
# Mobile (Android)

Expo + TypeScript app that mirrors the web UI for devices and fall events.

## Run

1. Ensure the backend is running.
2. In `mobile`, copy `.env.example` to `.env` and set `API_BASE_URL`.
3. Install deps: `npm install`
4. Start Android: `npm run android`
5. Login with an existing backend user (email/password)

Notes

1. Android emulator uses `http://10.0.2.2:3000/api` to reach the host machine.
2. Physical devices must use your host LAN IP, for example `http://192.168.1.10:3000/api`.
3. iOS requires HTTPS in production. For local development, use Expo Go or provide a local HTTPS tunnel.
=======
# Mobile (Expo + React Native)

Aplicacion movil del proyecto de deteccion de caidas.  
Esta app replica las funcionalidades principales del frontend web para:

- autenticacion de usuarios
- listado y detalle de dispositivos
- listado y detalle de eventos
- alertas y gestion basica de usuarios (segun rol)

## Requisitos

- Node.js 18+
- npm
- Backend corriendo y accesible por red
- Android Studio (emulador) o dispositivo fisico con Expo Go

## Configuracion

1. Entra a la carpeta `mobile`.
2. Copia el ejemplo de entorno:

```bash
cp .env.example .env
```

En PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Define `API_BASE_URL` en `.env`.

Ejemplos:

- Emulador Android: `http://10.0.2.2:3000/api`
- Dispositivo fisico: `http://<IP_DE_TU_PC>:3000/api`
- iOS Simulator: `http://localhost:3000/api`

La app toma la URL desde `API_BASE_URL` en `app.config.ts` y `src/config/env.ts`.

## Instalacion y ejecucion

```bash
npm install
npm run start
```

Comandos utiles:

- `npm run android`: abre en Android
- `npm run ios`: abre en iOS
- `npm run web`: abre version web de Expo

## Flujo de uso rapido

1. Levanta backend en `http://localhost:3000`.
2. Levanta la app mobile.
3. Inicia sesion con un usuario existente del backend.
4. Navega por tabs: usuarios (si eres admin), dispositivos y eventos.

## Estructura principal

- `src/api`: cliente HTTP, endpoints y mapeos
- `src/auth`: contexto de autenticacion y persistencia de sesion
- `src/navigation`: navegacion stack + tabs
- `src/screens`: pantallas funcionales
- `src/components`: componentes reutilizables de UI
- `src/theme`: tokens de diseno y estilos base

## Endpoints que consume la app

- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/logout`
- `GET /api/devices`
- `GET /api/devices/:id`
- `GET /api/events`
- `GET /api/events/:id`
- `GET /api/events/device/:deviceId`
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/deactivate`
- `GET /api/health`

## Problemas comunes

- No carga datos:
  revisa que `API_BASE_URL` apunte a una URL accesible desde el movil/emulador.
- En dispositivo fisico no conecta a `localhost`:
  usa la IP LAN de tu PC.
- Cambiaste `.env` y no se refleja:
  reinicia Expo con cache limpia:

```bash
npx expo start -c
```

## Notas

- La sesion se guarda con `expo-secure-store`.
- El token se envia como `Authorization: Bearer <token>` en peticiones autenticadas.
>>>>>>> origin/develop

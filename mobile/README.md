# Mobile (Expo + React Native)

Aplicacion movil del sistema de deteccion de caidas.

## Requisitos

- Node.js 18+
- npm
- Backend accesible por red
- Android Studio (emulador) o dispositivo fisico con Expo Go

## Configuracion

1. Entra a `mobile`.
2. Crea `.env` (si no existe).
3. Define la URL base del backend:

```env
EXPO_PUBLIC_API_BASE_URL=http://<IP_O_HOST>:3000/api
API_BASE_URL=http://<IP_O_HOST>:3000/api
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<google-web-client-id>
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<google-android-client-id>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<google-ios-client-id>
```

Ejemplos de `API_BASE_URL`:

- Emulador Android: `http://10.0.2.2:3000/api`
- Dispositivo fisico: `http://<IP_LAN_DE_TU_PC>:3000/api`

### Variables de entorno

- `EXPO_PUBLIC_API_BASE_URL`: base de API usada en runtime Expo.
- `API_BASE_URL`: fallback interno para cliente API.
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`: cliente OAuth para web.
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`: cliente OAuth Android.
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`: cliente OAuth iOS.

Notas:

- Si Google devuelve `Invalid request 400`, normalmente hay mismatch entre Client ID y plataforma.
- Si la app no carga datos, casi siempre es URL de backend inaccesible desde movil/emulador.

## Instalacion y ejecucion

```bash
npm install
npm run start
```

Comandos utiles:

- `npm run android`
- `npm run ios`
- `npm run web`

Si cambias `.env`, reinicia Expo con cache limpia:

```bash
npx expo start -c
```

## Flujo funcional

- Login email/password: `POST /api/auth/login`.
- Login Google: `POST /api/auth/google-login` con `id_token`.
- Registro desde app: `POST /api/users` (role `MEMBER`) y login posterior.
- Logout: `POST /api/auth/logout` y limpieza de sesion local.

## Endpoints consumidos por la app

Auth:

- `POST /api/auth/login`
- `POST /api/auth/google-login`
- `POST /api/auth/logout`

Devices:

- `GET /api/devices`
- `GET /api/devices/:id`

Events:

- `GET /api/events`
- `GET /api/events/:id`
- `GET /api/events/device/:deviceId`

Users:

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/deactivate`

Health:

- `GET /api/health`

## Roles y permisos esperados

- `ADMIN`: gestion completa de usuarios, dispositivos y eventos.
- `MEMBER`: acceso acotado a sus recursos asignados.

Si un `MEMBER` ve datos globales, el problema suele estar en backend (filtro por rol/acceso), no en el cliente.

## Notas funcionales

- La sesion se guarda en `expo-secure-store`.
- Las peticiones autenticadas envian `Authorization: Bearer <token>`.
- Login con Google usa `id_token` y endpoint `/api/auth/google-login`.
- El flujo "registro" de la app usa `POST /api/users`; su disponibilidad depende de la politica del backend (por ejemplo, si exige rol `ADMIN`).

## Problemas comunes

- No conecta desde movil fisico:
  usar IP LAN del PC, no `localhost`.
- Cambios de `.env` no aplican:
  reiniciar con `npx expo start -c`.
- API responde `401`:
  token vencido/no guardado o backend sin `JWT_SECRET` valido.
- Google login falla:
  revisar Client IDs por plataforma y configuracion OAuth en Google Cloud.

## Checklist rapido de pruebas

1. Login normal y login Google.
2. Persistencia de sesion tras reiniciar app.
3. Listado y detalle de dispositivos.
4. Listado y detalle de eventos.
5. Restricciones de rol (`ADMIN` vs `MEMBER`).
6. Logout y acceso bloqueado despues de cerrar sesion.

## Estructura principal

- `src/api`: cliente HTTP, endpoints y mapeos
- `src/auth`: contexto y persistencia de sesion
- `src/navigation`: stack y tabs
- `src/screens`: pantallas
- `src/components`: componentes reutilizables
- `src/theme`: tokens visuales

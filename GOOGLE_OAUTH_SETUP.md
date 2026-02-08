# Configuración de Google OAuth - Fall Detection System

Este documento te guía a través de los pasos necesarios para configurar Google OAuth en tu aplicación de detección de caídas.

## 📋 Requisitos Previos

- Una cuenta de Google
- Acceso a [Google Cloud Console](https://console.cloud.google.com/)
- Node.js instalado en tu máquina

## 🔑 Paso 1: Crear un Proyecto en Google Cloud Console

1. Accede a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en el selector de proyectos en la parte superior
3. Haz clic en **"NEW PROJECT"** (Nuevo Proyecto)
4. Ingresa un nombre para tu proyecto (ej: "Fall Detection System")
5. Haz clic en **"CREATE"** (Crear)

## 🔐 Paso 2: Habilitar Google Identity API

1. En la consola, busca **"Google Identity Services API"** en la barra de búsqueda
2. Haz clic en la API cuando aparezca en los resultados
3. Haz clic en el botón **"ENABLE"** (Habilitar)

## 🎫 Paso 3: Crear Credenciales OAuth 2.0

1. Ve a **"APIs & Services"** → **"Credentials"** (Credenciales)
2. Haz clic en **"+ CREATE CREDENTIALS"** (+ Crear Credenciales)
3. Selecciona **"OAuth client ID"** (ID de cliente OAuth)
4. Es posible que se te pida configurar una "OAuth consent screen" (Pantalla de consentimiento OAuth) primero:
   - Haz clic en **"Configure Consent Screen"** (Configurar Pantalla de Consentimiento)
   - Selecciona **"External"** (Externo)
   - Completa la información requerida (nombre de la aplicación, email de soporte, etc.)
   - Haz clic en **"Save and Continue"** (Guardar y Continuar)
   - En "Scopes" puede dejar con los valores por defecto
   - Agrega tu email como usuario de prueba si es necesario
   - Haz clic en **"Save and Continue"** nuevamente

5. De vuelta en Credenciales, haz clic nuevamente en **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
6. Selecciona **"Web application"** (Aplicación web)
7. Dale un nombre a tu cliente (ej: "Fall Detection Frontend")
8. En **"Authorized JavaScript origins"** (Orígenes JavaScript autorizados), agrega:
   - `http://localhost:5173` (para desarrollo local)
   - Tu dominio de producción (ej: `https://falldetection.com`)
9. En **"Authorized redirect URIs"** (URIs de redirección autorizados), agrega:
   - `http://localhost:3000/api/auth/google-callback` (si usas callback en el servidor)
   - O simplemente los orígenes JavaScript son suficientes para el flujo de frontend
10. Haz clic en **"CREATE"** (Crear)

## 📝 Paso 4: Copiar las Credenciales

Deberías ver una ventana con tu **Client ID** y **Client Secret**. 

- **Client ID**: Se ve como `xxxxx.apps.googleusercontent.com`
- **Client Secret**: Es una cadena de caracteres confidencial

## ⚙️ Paso 5: Configurar Variables de Entorno

### Frontend (.env.local)

Copia el archivo `.env.example` a `.env.local`:

```bash
cp fall-detection-frontend/.env.example fall-detection-frontend/.env.local
```

Edita `fall-detection-frontend/.env.local` y agrega:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

Reemplaza `YOUR_GOOGLE_CLIENT_ID` con el Client ID que obtuviste en Google Cloud Console.

### Backend (.env)

Edita `backend/.env` y agrega:

```env
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

Reemplaza los valores con tus credenciales de Google Cloud Console.

## 🗄️ Paso 6: Actualizar la Base de Datos

Ejecuta la migración SQL para agregar los campos necesarios a la tabla `accounts`:

```sql
-- Ejecuta este script en tu base de datos PostgreSQL
-- Ubicación: backend/Base de Datos/postgres_query/add_google_oauth.sql

ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

CREATE INDEX IF NOT EXISTS accounts_google_id_idx 
ON public.accounts(google_id);
```

O usando la CLI de tu proveedor (ej: Supabase):

```bash
psql -U postgres -h your-host -d your-database -f backend/Base\ de\ Datos/postgres_query/add_google_oauth.sql
```

## 🧪 Paso 7: Prueba Local

### Iniciar el Backend

```bash
cd backend
npm run dev
```

El servidor debería estar escuchando en `http://localhost:3000`

### Iniciar el Frontend

```bash
cd fall-detection-frontend
npm run dev
```

La aplicación debería estar disponible en `http://localhost:5173`

### Probar el Login con Google

1. Abre `http://localhost:5173/login` en tu navegador
2. Deberías ver un botón **"Sign in with Google"**
3. Haz clic en el botón de Google
4. Se te redirigirá a Google para autenticarte
5. Después de autenticarte, serás redirigido al dashboard

## 🚀 Deploying a Producción

### Google Cloud Console

1. Ve a **Credentials** (Credenciales)
2. Edita el cliente OAuth que creaste
3. En **"Authorized JavaScript origins"**, agrega tu dominio de producción:
   - `https://tudominio.com`
4. En **"Authorized redirect URIs"**, si tienes un callback en el backend, agrega:
   - `https://tudominio.com/api/auth/google-callback`
5. Haz clic en **"Save"** (Guardar)

### Variables de Entorno

Actualiza las variables de entorno en tu servidor de producción:

**Frontend** (.env.production):
```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
VITE_API_URL=https://tudominio.com/api
VITE_BACKEND_URL=https://tudominio.com
```

**Backend** (.env):
```env
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
FRONTEND_URL=https://tudominio.com
```

## 🔒 Seguridad

⚠️ **IMPORTANTE**: 

- Nunca compartas tu `GOOGLE_CLIENT_SECRET` en repositorios públicos
- Usa `.gitignore` para excluir archivos `.env`
- En producción, usa variables de entorno desde tu proveedor de hosting (Vercel, Heroku, digital Ocean, etc.)
- Cambia `JWT_SECRET` a un valor seguro y único en producción
- Usa HTTPS en producción, nunca HTTP

## 📚 Flujo de Autenticación

```
[Usuario]
    ↓
[Hace clic en "Sign in with Google"]
    ↓
[Google OAuth Dialog]
    ↓
[Usuario se autentica]
    ↓
[Google devuelve ID Token]
    ↓
[Frontend envía token al Backend]
    ↓
[Backend verifica token con Google]
    ↓
[Backend busca/crea usuario en BD]
    ↓
[Backend genera JWT propio]
    ↓
[Frontend almacena JWT]
    ↓
[Usuario accede a la aplicación]
```

## 🐛 Troubleshooting

### Error: "Invalid Client ID"

- Verifica que el `GOOGLE_CLIENT_ID` sea correcto en tu `.env.local`
- Usa el formato completo: `xxxxx.apps.googleusercontent.com`

### Error: "origin mismatch"

- Verifica que el localhost o dominio de tu aplicación esté registrado en Google Cloud Console
- Para desarrollo local, asegúrate de que `http://localhost:5173` esté en "Authorized JavaScript origins"

### Error: "Token inválido" en el backend

- Verifica que `GOOGLE_CLIENT_ID` en el backend sea el mismo que en el frontend
- El token puede haber expirado (se envía al backend inmediatamente, así que esto es raro)

### El botón de Google no aparece

- Revisa la consola del navegador (F12) para errores
- Verifica que `@react-oauth/google` esté instalado: `npm list @react-oauth/google`
- Comprueba que `VITE_GOOGLE_CLIENT_ID` esté en tu `.env.local`

## 📖 Referencias

- [Google Identity Services Documentation](https://developers.google.com/identity/protocols/oauth2)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [Google Auth Library for Node.js](https://github.com/googleapis/google-auth-library-nodejs)

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Google Cloud Console
- [ ] Google Identity API habilitado
- [ ] Credenciales OAuth 2.0 creadas
- [ ] Client ID obtenido
- [ ] Client Secret obtenido
- [ ] Variables de entorno configuradas (.env.local y .env)
- [ ] Migración de BD ejecutada
- [ ] Backend reiniciado
- [ ] Frontend reiniciado
- [ ] Login con Google probado localmente
- [ ] Dominios autorizados en producción
- [ ] Secretos seguros en producción

¡Listo! Tu sistema ahora soporta login con Google. 🎉

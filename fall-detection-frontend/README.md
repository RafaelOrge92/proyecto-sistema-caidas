# Frontend Web (React + Vite)

Panel web del sistema de deteccion de caidas.

## Stack

- React + TypeScript
- Vite
- TailwindCSS
- Axios
- `jspdf` + `jspdf-autotable` para exportar reportes

## Requisitos

- Node.js 18+
- npm
- Backend levantado (por defecto se usa `http://localhost:3000`)

## Instalacion y ejecucion

Desde `fall-detection-frontend/`:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Variables de entorno

- `VITE_GOOGLE_CLIENT_ID` (opcional, para Google OAuth en login; si no se define se usa un placeholder)
- `VITE_API_URL` (opcional, base de la API; por defecto `http://localhost:3000/api`)

Nota:

- Si no se define `VITE_API_URL`, el frontend usa `http://localhost:3000/api`.

## Pantallas principales

- Admin
  - Usuarios: `/admin/users`
  - Pacientes: `/admin/patients`
  - Dispositivos: `/admin/devices`
  - Eventos: `/admin/events` (incluye exportacion a PDF del listado filtrado)
- Usuario (MEMBER/USUARIO/CUIDADOR)
  - Mi proteccion: `/my-protection` (incluye exportacion a PDF de actividad)
  - Eventos: `/member/events` (incluye exportacion a PDF respetando filtros de busqueda/estado/paciente)

## Chatbot

El widget del chatbot vive en `src/components/ChatbotWidget.tsx`.

- Requiere backend con Redis configurado (`/api/chat/*`).
- Gestiona sesiones y permite recargar/crear nuevas sesiones.

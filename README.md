<p align="center">
  <img src="assets/readme-hero.svg" alt="Sistema de deteccion de caidas" width="100%" />
</p>

<p align="center">
  <img src="assets/readme-pulse.svg" alt="Indicador animado" />
</p>

<h1 align="center">Sistema de Deteccion de Caidas</h1>

<p align="center">
  Plataforma full stack para monitoreo de eventos de caida, alertas y gestion de dispositivos.
  Incluye panel web, API, app movil y firmware IoT.
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#stack-tecnológico">Stack</a> ·
  <a href="#arquitectura">Arquitectura</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#autenticación">Auth</a> ·
  <a href="#faq">FAQ</a>
</p>

---

## 📋 Tabla de Contenidos

- [Features](#features)
- [Stack Tecnológico](#stack-tecnológico)
- [Módulos](#módulos)
- [Arquitectura](#arquitectura)
- [Prerrequisitos](#prerrequisitos)
- [Quick Start](#quick-start)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Base de Datos](#base-de-datos)
- [Autenticación](#autenticación)
- [Screenshots](#screenshots)
- [FAQ](#faq)
- [Contribuir](#contribuir)
- [Contacto](#contacto)

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-0F172A?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5.x-111827?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-1E293B?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-0F172A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7.x-0B1220?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.x-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-15%2B-111827?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7.x-0F172A?style=for-the-badge&logo=redis&logoColor=DC382D" alt="Redis" />
  <img src="https://img.shields.io/badge/Expo-54-0B1220?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/React%20Native-0.81-111827?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/ESP32-IoT-0F172A?style=for-the-badge&logo=espressif&logoColor=white" alt="ESP32" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-0B1220?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
</p>

---

## Features

<img src="assets/readme-features.svg" alt="Features carousel" width="100%" />

<img src="assets/readme-dots.svg" alt="Indicator" width="80px" />

✨ **Detección de Caídas en Tiempo Real**
- Sensores MPU6050 (acelerómetro + giroscopio) integrados en ESP32.
- Algoritmos de análisis de movimiento para identificar movimientos anómalos.
- Botón de emergencia para alertas manuales.

📊 **Dashboard Web Avanzado**
- Panel de administración con diseño glassmorphism (indigo/cyan).
- Gráficos en tiempo real (Chart.js).
- Exportación de reportes a PDF (jsPDF + jsPDF-autotable).
- Gestión de usuarios, dispositivos y pacientes.

📱 **App Móvil Multiplataforma**
- Soporte iOS y Android (Expo + React Native).
- Notificaciones push y alertas en tiempo real.
- Historial de eventos y detalles de dispositivos.
- Autenticación con JWT y Google OAuth.

💬 **Chatbot Inteligente**
- Integración con Groq o Hugging Face LLM.
- Historial persistente en Redis.
- Contexto personalizado por rol (ADMIN vs MEMBER).
- Rate limiting (30 msgs/min por usuario).

🔐 **Autenticación Robusta**
- JWT para usuarios finales.
- Google OAuth 2.0 integrado.
- Device authentication con X-Device-Id y X-Device-Key (bcrypt).
- Control de roles (ADMIN, MEMBER, CUIDADOR).

🌐 **Hardware IoT**
- Firmware ESP32 en C++ (Arduino IDE).
- Comunicación HTTP + autenticación de dispositivo.
- Sensores: MPU6050, inclinómetro KY-017, botón de emergencia.

---

## Stack Tecnológico

<img src="assets/readme-stack.svg" alt="Tech stack badges" width="100%" />

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Backend** | Node.js, Express, TypeScript | 18+, 5.x, 5.x |
| **Frontend Web** | React, Vite, TailwindCSS | 19, 7.x, 4.x |
| **Mobile** | Expo, React Native | 54, 0.81 |
| **Base de Datos** | PostgreSQL | 15+ |
| **Cache** | Redis | 7.x |
| **Hardware** | ESP32, Arduino SDK | - |
| **LLM** | Groq, Hugging Face | - |
| **Auth** | JWT, Google OAuth | - |

---

## Módulos

```
proyecto-sistema-caidas/
├── backend/                          API principal Node.js + Express
│   ├── src/
│   │   ├── routes/                   Endpoints (auth, users, devices, events, chat)
│   │   ├── middleware/               JWT + device auth
│   │   ├── config/                   DB, Redis, env
│   │   └── utils/                    Webhooks Discord, LLM, password hashing
│   └── Base de Datos/                Scripts SQL y modelo relacional
│
├── fall-detection-frontend/          Panel web React + Vite
│   ├── src/
│   │   ├── pages/                    Admin, Dashboard, Events, Patients, Users
│   │   ├── components/               Modales, gráficos, widgets
│   │   ├── services/                 Clientes HTTP (adminService, chatService)
│   │   ├── context/                  AuthContext, ThemeContext
│   │   └── assets/                   Imágenes, íconos
│   └── vite.config.js, tailwind.config.js
│
├── mobile/                           App móvil Expo + React Native
│   ├── src/
│   │   ├── screens/                  Home, Login, Events, Devices, Profile
│   │   ├── components/               Botones, inputs, layouts reutilizables
│   │   ├── api/                      Cliente HTTP, endpoints, mappers
│   │   ├── auth/                     AuthContext, manejo de sesión
│   │   ├── navigation/               Stack y Tab navigators
│   │   └── theme/                    Tokens de color y tipografía
│   ├── app.config.ts, tsconfig.json
│   └── .env.example
│
├── hardware/                         Firmware y mock local
│   ├── esp32/
│   │   └── esp32_http.ino            Código del microcontrolador
│   ├── server/                       Mock API en FastAPI (pruebas locales)
│   │   ├── server.py
│   │   └── requirements.txt
│   └── docs/                         Documentación hardware
│
├── assets/                           SVG animados para README
│   ├── readme-hero.svg
│   ├── readme-pulse.svg
│   ├── readme-features.svg
│   ├── readme-stack.svg
│   ├── readme-architecture.svg
│   └── readme-dots.svg
│
└── package.json, .gitignore          Configuración raíz
```

## Arquitectura

<img src="assets/readme-architecture.svg" alt="System architecture diagram" width="100%" />

**Flujo de datos:**
```
ESP32 (IoT) --[device-auth]--> Backend API (Node/Express)
                                    ↓
                        ┌───────────┼───────────┐
                        ↓           ↓           ↓
                    PostgreSQL  Redis      Clientes
                     (datos)   (chat)    (Web/Mobile)
```

---

## Prerrequisitos

### Backend
- **Node.js**: 18 o superior (`node --version`)
- **npm**: 9 o superior (`npm --version`)
- **PostgreSQL**: 15+ con creación de base de datos
- **Redis**: 7+ (opcional, requerido para chatbot)

### Frontend Web
- **Node.js**: 18+
- **npm**: 9+
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### Mobile
- **Node.js**: 18+
- **npm**: 9+
- **Expo CLI**: `npm install -g expo-cli`
- **Android Studio** o **Xcode** (emuladores)
- O dispositivo físico con **Expo Go**

### Hardware
- **ESP32-DevKit** con WiFi integrado
- **Sensores**:
  - MPU6050 (I2C: GPIO 21/22)
  - KY-017 inclinómetro (GPIO 26)
  - Botón emergencia (GPIO 25)
  - LED de estado (GPIO 2)
- **Arduino IDE** + ESP32 board support

---

## Quick Start

### 1️⃣ Backend

```bash
cd backend
npm install
cp .env.example .env          # Copiar plantilla
# Editar .env con credenciales locales
npm run dev                   # Escucha en :3000
```

### 2️⃣ Frontend Web

```bash
cd fall-detection-frontend
npm install
npm run dev                   # Escucha en :5173
```

### 3️⃣ Mobile

```bash
cd mobile
npm install
# Editar .env con URLs del backend
npm run start
# Presiona 'a' para Android o 'i' para iOS
```

### 4️⃣ Hardware (Opcional)

```bash
# En Arduino IDE:
# 1. Abre: hardware/esp32/esp32_http.ino
# 2. Configura WiFi SSID/PASS y BASE_URL
# 3. Carga en ESP32
```

---

## Estructura del Proyecto

### Backend

**Rutas principales** (`src/routes/`):
- `auth.ts`: Login, Google OAuth, logout
- `users.ts`: CRUD de usuarios (admin)
- `devices.ts`: CRUD de dispositivos, heartbeat
- `events.ts`: CRUD de eventos, ingest, samples
- `chat.ts`: Sesiones y mensajes del chatbot
- `patients.ts`: Asociación usuarios-pacientes

**Middleware** (`src/middleware/`):
- `auth.ts`: Validación JWT, control de roles
- `deviceAuth.ts`: Validación de headers (X-Device-Id, X-Device-Key)

**Configuración** (`src/config/`):
- `db.ts`: Pool PostgreSQL
- `env.ts`: Variables de entorno críticas
- `redis.ts`: Conexión Redis para chatbot

### Frontend Web

**Páginas** (`src/pages/`):
- `Admin.tsx`: Paneles de gestión
- `Dashboard.tsx`: Vista principal
- `EventsPage.tsx`: Listado y gráficos de eventos
- `PatientsPage.tsx`: Gestión de pacientes
- `UsersPage.tsx`: Gestión de usuarios

**Componentes** (`src/components/`):
- Modales: `DeviceModal.tsx`, `UserModal.tsx`, `GenericModal.tsx`
- Widgets: `ChatbotWidget.tsx`, `LiveCharts.tsx`
- UI: `Navbar.tsx`, `Layout.tsx`, `ProtectedRoute.tsx`

### Mobile

**Screens** (`src/screens/`):
- Home, Login, Register, Dashboard
- EventsScreen, DevicesScreen, ProfileScreen

**Contexto** (`src/auth/`):
- `AuthContext.tsx`: Gestión de sesión JWT
- Integración con `expo-secure-store`

---

## Base de Datos

### Setup Inicial

```bash
# 1. Conectarse a PostgreSQL
psql -U postgres

# 2. Ejecutar script principal
\i backend/Base\ de\ Datos/Scripts/create_db.sql

# 3. Verificar tablas creadas
\dt public.*
```

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `accounts` | Usuarios (ADMIN, MEMBER, CUIDADOR) |
| `patients` | Pacientes a monitorear |
| `devices` | Dispositivos ESP32 registrados |
| `device_access` | Relación dispositivos-usuarios |
| `events` | Eventos de caída detectados |
| `event_samples` | Muestras acelerómetro por evento |

### Scripts Útiles

**Crear/actualizar hash de device key:**
```sql
UPDATE public.devices
SET device_key_hash = crypt('tu-clave-plana', gen_salt('bf', 10))
WHERE device_id = 'ESP32-XXXXX';
```

**Verificar coincidencia de key:**
```sql
SELECT crypt('tu-clave-plana', device_key_hash) = device_key_hash AS key_ok
FROM public.devices
WHERE device_id = 'ESP32-XXXXX';
```

---

## Autenticación

### JWT (Usuarios)

**Login email/contraseña:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "email": "user@example.com", "role": "ADMIN" }
}
```

**Headers autenticados:**
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Google OAuth

```bash
POST /api/auth/google-login
Content-Type: application/json

{
  "googleToken": "google-id-token-from-frontend"
}
```

### Device Authentication

**Headers requeridos en `/api/events/ingest`, `/api/devices/heartbeat`:**
```bash
X-Device-Id: ESP32-FC3A57088304
X-Device-Key: tu-clave-plana
Content-Type: application/json
```

La clave se valida contra `device_key_hash` con bcrypt.

---

## Screenshots

### Web Dashboard

> 📸 *Placeholder: Agregar captura del panel admin con gráficos*

### Mobile App

> 📸 *Placeholder: Agregar capturas de login, dashboard y eventos*

### Hardware Setup

> 📸 *Placeholder: Agregar foto del ESP32 con sensores*

---

## FAQ

### ❓ Backend no conecta con PostgreSQL

**Solución:**
1. Verifica las env vars: `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`
2. Asegúrate que PostgreSQL está corriendo: `psql -U postgres -c "SELECT 1"`
3. Verifica firewall/port: `netstat -an | grep 5432`

### ❓ Mobile no se conecta al backend

**Solución:**
1. Backend debe estar en red local accesible desde el móvil
2. En emulador Android: usa `http://10.0.2.2:3000` en vez de `localhost`
3. En dispositivo físico: usa IP LAN del PC: `http://192.168.x.x:3000`
4. Verifica `.env`: `EXPO_PUBLIC_API_BASE_URL`

### ❓ JWT token expirado

**Solución:**
- Re-login o implementar token refresh
- Verifica `JWT_SECRET` en backend (no puede ser `dev-secret-change-me`)
- Check `JWT_EXPIRE` en `.env` backend

### ❓ ESP32 devuelve 401 en heartbeat

**Solución:**
1. Verifica `X-Device-Id` en headers
2. Verifica que `device_id` existe en DB: `SELECT device_id FROM public.devices`
3. Verifica `device_key_hash` está configurado
4. `X-Device-Key` debe ser clave plana (no hash)

### ❓ Chatbot no responde (503)

**Solución:**
- Redis no está disponible
- Verifica `REDIS_URL` en `.env` backend
- Verifica `CHAT_PROVIDER` (groq o huggingface)
- Agrega `GROQ_API_KEY` o `HF_API_KEY`

### ❓ Discord webhook no envia notificaciones

**Solución:**
1. Verifica `DISCORD_WEBHOOK_URL` en `.env`
2. Verifica que la URL es válida (sin typos)
3. Opcional: usa `DISCORD_ROLE_ID` para menciones a rol

---

## Contribuir

### Flujo de Trabajo

1. **Crear rama feature**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/nombre-descriptivo
   ```

2. **Commits claros**
   ```bash
   git commit -m "feat: agregar nueva pantalla"
   git commit -m "fix: resolver conflicto en auth"
   git commit -m "docs: actualizar README"
   ```

3. **Push y PR**
   ```bash
   git push origin feature/nombre-descriptivo
   # Crear Pull Request en GitHub contra `develop`
   ```

### Estándares

- **TypeScript**: tipos explícitos, sin `any` cuando sea posible
- **React**: componentes funcionales + hooks, naming en PascalCase
- **Estilos**: TailwindCSS, respetar tema dark/light
- **Base de datos**: migraciones en `backend/Base de Datos/Scripts/`
- **Commits**: messages en inglés o español consistentes

---

## Contacto

**Equipo de Desarrollo:**
- **Lead Backend**: [@RafaelOrge92](https://github.com/RafaelOrge92)
- **Issues & Bugs**: [GitHub Issues](https://github.com/RafaelOrge92/proyecto-sistema-caidas/issues)

**Recursos**
- 📖 [Database Schema](backend/Base%20de%20Datos/modelo_relacional/modelo_sistema_caidas.drawio)
- 📖 [Hardware Docs](hardware/docs/README.md)
- 📖 [Backend API](backend/README.md)
- 📖 [Frontend](fall-detection-frontend/README.md)
- 📖 [Mobile](mobile/README.md)

---

<p align="center">
  <sub>Sistema de Detección de Caídas © 2026 | Full Stack Open Source</sub>
</p>
-

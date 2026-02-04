# 🚨 Sistema de Detección de Caídas - Guía de Inicio

## Instrucciones para ejecutar el proyecto

### 1. Backend (Express + Node.js)

Abre una terminal en la carpeta `backend/`:

```bash
cd backend
npm run dev
```

El backend se ejecutará en: **http://localhost:3000**

### 2. Frontend (React + Vite)

Abre otra terminal en la carpeta `fall-detection-frontend/`:

```bash
cd fall-detection-frontend
npm run dev
```

El frontend se ejecutará en: **http://localhost:5173**

---

## 📝 Credenciales de Login

### Usuario Administrador
- **Email:** `superadmin@demo.local`
- **Contraseña:** `1234`
- **Rol:** ADMIN
- **Acceso:** Control total del sistema, gestión de usuarios y dispositivos

### Usuario No-Administrador (Ejemplo 1)
- **Email:** `maria@demo.local`
- **Contraseña:** `1234`
- **Rol:** MEMBER
- **Acceso:** Ver y gestionar dispositivos asignados

### Usuario No-Administrador (Ejemplo 2)
- **Email:** `pablo@demo.local`
- **Contraseña:** `1234`
- **Rol:** MEMBER
- **Acceso:** Ver y gestionar dispositivos asignados

### Usuario No-Administrador (Ejemplo 3)
- **Email:** `lucia@demo.local`
- **Contraseña:** `1234`
- **Rol:** MEMBER
- **Acceso:** Ver y gestionar dispositivos asignados

---

## 🔧 Estructura del Backend

El backend incluye los siguientes endpoints:

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Usuarios
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `POST /api/users` - Crear nuevo usuario
- `PUT /api/users/:id` - Actualizar usuario
- `PATCH /api/users/:id/deactivate` - Desactivar usuario

### Dispositivos
- `GET /api/devices` - Obtener todos los dispositivos
- `GET /api/devices/:id` - Obtener dispositivo por ID
- `POST /api/devices` - Crear nuevo dispositivo
- `PUT /api/devices/:id` - Actualizar dispositivo
- `PATCH /api/devices/:id/assign` - Asignar dispositivo a usuario

### Eventos
- `GET /api/events` - Obtener todos los eventos
- `GET /api/events/:id` - Obtener evento por ID
- `GET /api/events/device/:deviceId` - Obtener eventos de un dispositivo
- `POST /api/events` - Crear nuevo evento
- `PATCH /api/events/:id` - Actualizar estado del evento

---

## 🗂️ Datos de Ejemplo

### Dispositivos
- **ESP32-001:** Salón (Casa Carmen) - Asignado a Carmen García
- **ESP32-002:** Dormitorio (Casa Antonio) - Asignado a Antonio Pérez

### Eventos de Prueba
- 4 eventos de caída simulados con diferentes estados
- Estados: OPEN, CONFIRMED_FALL, FALSE_ALARM, RESOLVED

---

## 📱 Acceso al Aplicativo

Una vez que ambos servidores estén ejecutándose, accede a:

```
http://localhost:5173
```

Usa cualquiera de las credenciales anteriores para iniciar sesión.

---

## 🔒 Notas de Seguridad

⚠️ **IMPORTANTE:** Este es un sistema de demostración. En producción:
- Implementar autenticación JWT real
- Usar bcrypt para hash de contraseñas
- Conectar a PostgreSQL como se especifica en `backend/Base de Datos/`
- Implementar HTTPS
- Usar variables de entorno para configuraciones sensibles
- Implementar validación robusta en backend

---

## ✅ Próximos Pasos

Para una implementación completa:
1. Conectar a PostgreSQL usando los scripts en `backend/Base de Datos/postgres_query/`
2. Implementar autenticación JWT
3. Agregar validación de datos en ambos lados
4. Implementar manejo de errores robusto
5. Agregar tests unitarios e integración

# Ejemplos de Requests a la API

## 1. Autenticación

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@demo.local",
    "password": "1234"
  }'
```

**Response:**
```json
{
  "token": "MTo...",
  "user": {
    "id": "1",
    "email": "superadmin@demo.local",
    "role": "ADMIN",
    "fullName": "Super Admin"
  }
}
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer MTo..."
```

---

## 2. Usuarios

### Listar usuarios
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer MTo..."
```

### Obtener usuario por ID
```bash
curl -X GET http://localhost:3000/api/users/1 \
  -H "Authorization: Bearer MTo..."
```

### Crear usuario
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MTo..." \
  -d '{
    "email": "nuevo@demo.local",
    "fullName": "Nuevo Usuario",
    "phone": "+34 600 000 005",
    "role": "MEMBER",
    "password": "1234"
  }'
```

### Actualizar usuario
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MTo..." \
  -d '{
    "fullName": "Super Admin Actualizado",
    "phone": "+34 600 000 999"
  }'
```

### Desactivar usuario
```bash
curl -X PATCH http://localhost:3000/api/users/1/deactivate \
  -H "Authorization: Bearer MTo..."
```

---

## 3. Dispositivos

### Listar dispositivos
```bash
curl -X GET http://localhost:3000/api/devices \
  -H "Authorization: Bearer MTo..."
```

**Response:**
```json
[
  {
    "id": "ESP32-001",
    "alias": "Salón (Casa Carmen)",
    "patientName": "Carmen García",
    "patientId": "P001",
    "isActive": true,
    "lastSeen": "2026-02-04T10:30:00Z"
  }
]
```

### Obtener dispositivo
```bash
curl -X GET http://localhost:3000/api/devices/ESP32-001 \
  -H "Authorization: Bearer MTo..."
```

### Crear dispositivo
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MTo..." \
  -d '{
    "id": "ESP32-003",
    "alias": "Cocina",
    "patientName": "Juan Gómez",
    "patientId": "P003"
  }'
```

### Actualizar dispositivo
```bash
curl -X PUT http://localhost:3000/api/devices/ESP32-001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MTo..." \
  -d '{
    "alias": "Salón (Casa Carmen) - Actualizado",
    "isActive": true
  }'
```

### Asignar dispositivo a usuario
```bash
curl -X PATCH http://localhost:3000/api/devices/ESP32-001/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MTo..." \
  -d '{
    "userId": "1",
    "patientName": "Carmen García",
    "patientId": "P001"
  }'
```

---

## 4. Eventos

### Listar eventos
```bash
curl -X GET http://localhost:3000/api/events \
  -H "Authorization: Bearer MTo..."
```

**Response:**
```json
[
  {
    "id": "1",
    "deviceId": "ESP32-001",
    "deviceAlias": "Salón (Casa Carmen)",
    "patientName": "Carmen García",
    "eventType": "FALL",
    "status": "OPEN",
    "occurredAt": "2026-02-04T10:15:00Z",
    "createdAt": "2026-02-04T10:15:00Z",
    "reviewedBy": null,
    "reviewedAt": null,
    "reviewComment": null
  }
]
```

### Obtener evento por ID
```bash
curl -X GET http://localhost:3000/api/events/1 \
  -H "Authorization: Bearer MTo..."
```

### Obtener eventos de un dispositivo
```bash
curl -X GET http://localhost:3000/api/events/device/ESP32-001 \
  -H "Authorization: Bearer MTo..."
```

### Crear evento
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MTo..." \
  -d '{
    "deviceId": "ESP32-001",
    "deviceAlias": "Salón (Casa Carmen)",
    "patientName": "Carmen García",
    "eventType": "FALL",
    "status": "OPEN"
  }'
```

**Event Types:** FALL, EMERGENCY_BUTTON, SIMULATED
**Status:** OPEN, CONFIRMED_FALL, FALSE_ALARM, RESOLVED

### Actualizar evento
```bash
curl -X PATCH http://localhost:3000/api/events/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MTo..." \
  -d '{
    "status": "CONFIRMED_FALL",
    "reviewedBy": "maria@demo.local",
    "reviewComment": "Se llamó al 112"
  }'
```

---

## 5. Health Check

### Verificar estado del servidor
```bash
curl -X GET http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok"
}
```

---

## Con JavaScript/TypeScript (Axios)

### Ejemplo de login con Axios
```typescript
import axios from 'axios';

const loginUser = async (email: string, password: string) => {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email,
      password
    });
    
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('role', user.role);
    
    return user;
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Llamar función
await loginUser('superadmin@demo.local', '1234');
```

### Ejemplo de obtener usuarios con token
```typescript
const getUsers = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await axios.get('http://localhost:3000/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
};

// Llamar función
const users = await getUsers();
```

---

## Con Python

### Ejemplo de login
```python
import requests

url = "http://localhost:3000/api/auth/login"
data = {
    "email": "superadmin@demo.local",
    "password": "1234"
}

response = requests.post(url, json=data)
print(response.json())
```

### Ejemplo de obtener eventos
```python
import requests

token = "MTo..."  # Token del login
headers = {
    "Authorization": f"Bearer {token}"
}

response = requests.get("http://localhost:3000/api/events", headers=headers)
events = response.json()

for event in events:
    print(f"Event: {event['eventType']} - Status: {event['status']}")
```

---

## Notas Importantes

1. **Token:** Todos los endpoints excepto `/auth/login` requieren un token válido
2. **CORS:** El backend acepta requests desde `http://localhost:5173` (frontend)
3. **Content-Type:** Siempre usa `application/json` para requests POST/PUT/PATCH
4. **Authorization Header:** Formato: `Bearer <token>`

---

## Testing con Insomnia/Postman

1. Crear colección: "FallDetect API"
2. Crear variable de entorno: `token` (vacío al inicio)
3. En Login request:
   - Tests tab: `pm.environment.set("token", pm.response.json().token)`
   - Esto guardará el token automáticamente para los siguientes requests

4. En otros requests:
   - Authorization header: `Bearer {{token}}`
   - Automáticamente usará el token guardado

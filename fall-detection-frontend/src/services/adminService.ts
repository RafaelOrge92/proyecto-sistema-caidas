// src/services/adminService.ts
import axios from 'axios';
import { User, Device, FallEvent } from '../types';

const API_URL = 'http://localhost:3000/api'; 

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const AdminService = {
  // --- MÉTODOS DE PABLO (Gestión) ---
  getUsers: async () => api.get<User[]>('/users'),
  createUser: async (user: Omit<User, 'id'> & { password?: string }) => api.post('/users', user),
  updateUser: async (id: string, user: Partial<User>) => api.put(`/users/${id}`, user),
  softDeleteUser: async (id: string) => api.patch(`/users/${id}/deactivate`),
  getDevices: async () => api.get<Device[]>('/devices'),
  createDevice: async (device: Partial<Device>) => api.post('/devices', device),
  updateDevice: async (id: string, device: Partial<Device>) => api.put(`/devices/${id}`, device),
  assignDevice: async (deviceId: string, userId: string) => api.patch(`/devices/${deviceId}/assign`, { userId }),

  // --- MÉTODOS DE JIMMY (Dashboard y Simulación) ---
  getEvents: async () => {
    // Simulación para pruebas [cite: 98]
    const mockData: FallEvent[] = [
      {
        id: '1',
        deviceId: 'ESP32-001',
        accX: 0.1, accY: 0.2, accZ: 9.8,
        fallDetected: false,
        timestamp: new Date().toISOString(),
        status: 'PENDIENTE'
      },
      {
        id: '2',
        deviceId: 'ESP32-001',
        accX: -12.5, accY: 5.0, accZ: -2.0,
        fallDetected: true, // Esto disparará la alerta roja [cite: 60]
        timestamp: new Date().toISOString(),
        status: 'PENDIENTE'
      }
    ];
    return { data: mockData };
  },

  confirmFalseAlarm: async (eventId: string) => {
    // Esto es un extra del proyecto [cite: 96]
    console.log(`Confirmando falsa alarma para el evento: ${eventId}`);
    return api.patch(`/events/${eventId}/false-alarm`);
  }
};
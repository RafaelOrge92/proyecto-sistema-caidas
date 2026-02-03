// src/services/adminService.ts
import axios from 'axios';
import { User, Device } from '../types';

const API_URL = 'http://localhost:3000/api'; // Ajusta a tu backend

// Configuración base con Token (asumiendo que guardas el token en localStorage al hacer Login)
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const AdminService = {
  // --- USUARIOS ---
  getUsers: async () => {
    return api.get<User[]>('/users'); // Asume que devuelve un array
  },
  createUser: async (user: Omit<User, 'id'> & { password?: string }) => {
    return api.post('/users', user);
  },
  softDeleteUser: async (id: string) => {
    // Soft delete: Cambia isActive a false en vez de borrar el registro
    return api.patch(`/users/${id}/deactivate`);
  },

  // --- DISPOSITIVOS ---
  getDevices: async () => {
    return api.get<Device[]>('/devices');
  },
  createDevice: async (device: Partial<Device>) => {
    return api.post('/devices', device);
  },
  updateDevice: async (id: string, device: Partial<Device>) => {
    return api.put(`/devices/${id}`, device);
  },
  assignDevice: async (deviceId: string, userId: string) => {
    return api.patch(`/devices/${deviceId}/assign`, { userId });
  },
  updateUser: async (id: string, user: Partial<User>) => {
    return api.put(`/users/${id}`, user);
  }
};
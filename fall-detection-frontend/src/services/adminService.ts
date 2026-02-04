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
  // --- USUARIOS ---
  getUsers: async () => {
    return api.get<User[]>('/users');
  },
  createUser: async (user: Omit<User, 'id'> & { password?: string }) => {
    return api.post('/users', user);
  },
  softDeleteUser: async (id: string) => {
    return api.patch(`/users/${id}/deactivate`);
  },
  updateUser: async (id: string, user: Partial<User>) => {
    return api.put(`/users/${id}`, user);
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

  // --- EVENTOS ---
  getEvents: async () => {
    return api.get<FallEvent[]>('/events');
  },
  
  createEvent: async (event: any) => {
    return api.post('/events', event);
  },

  updateEvent: async (id: string, data: any) => {
    return api.patch(`/events/${id}`, data);
  },

  confirmFalseAlarm: async (id: string) => {
    return api.patch(`/events/${id}`, { status: 'FALSE_ALARM' });
  },

  confirmFall: async (id: string) => {
    return api.patch(`/events/${id}`, { status: 'CONFIRMED_FALL' });
  }
};

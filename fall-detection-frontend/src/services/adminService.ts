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
    const response = await api.get<any[]>('/users');
    const data = response.data.map(user => ({
      ...user,
      isActive: true // Backend doesn't support soft delete state yet
    })) as User[];
    return { data };
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
    const response = await api.get<any[]>('/devices');
    // Map snake_case DB columns to camelCase frontend types
    const data = response.data.map((d: any) => ({
      id: d.device_id,
      alias: d.alias,
      patientId: d.patient_id,
      isActive: d.is_active,
      lastSeen: d.last_seen_at?.toString(),
      // These are not returned by simple SELECT * from devices
      assignedUserId: null, 
      patientName: undefined 
    })) as Device[];
    return { data };
  },
  createDevice: async (device: Partial<Device>) => {
    // Map frontend camelCase to backend expected snake_case/body params
    // Backend expects: id, alias, patientId, active, lastSeenAt
    const payload = {
      id: device.id,
      alias: device.alias,
      patientId: device.patientId,
      active: device.isActive,
      lastSeenAt: device.lastSeen
    };
    return api.post('/devices', payload);
  },
  updateDevice: async (id: string, device: Partial<Device>) => {
    // Backend keys likely matched DB but there is no explicit PUT route in sample, 
    // assuming it might be added or we try to map anyway
    return api.put(`/devices/${id}`, device);
  },
  assignDevice: async (deviceId: string, userId: string) => {
    // This route might not exist in the basic implementation provided
    return api.patch(`/devices/${deviceId}/assign`, { userId });
  },

  // --- EVENTOS ---
  getEvents: async () => {
    const response = await api.get<any[]>('/events');
    const data = response.data.map((e: any) => ({
      id: e.event_id,
      deviceId: e.device_id,
      eventType: e.event_type,
      status: e.status,
      occurredAt: e.occurred_at,
      reviewedBy: e.reviewed_by,
      reviewedAt: e.reviewed_at,
      reviewComment: e.review_comment,
      createdAt: e.created_at
    })) as FallEvent[];
    return { data };
  },
  
  createEvent: async (event: any) => {
    // Backend expects specific body keys
    const payload = {
       deviceId: event.deviceId,
       eventType: event.eventType,
       status: event.status,
       eventUid: event.id || crypto.randomUUID?.() || 'uid-' + Date.now(), 
       ocurredAt: event.occurredAt || new Date().toISOString(), // Note spelling 'ocurredAt' in backend
       reviewedBy: event.reviewedBy,
       reviewedAt: event.reviewedAt,
       review_comment: event.reviewComment
    };
    return api.post('/events', payload);
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

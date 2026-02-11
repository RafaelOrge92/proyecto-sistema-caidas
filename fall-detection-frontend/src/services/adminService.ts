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
  
  // ⚠️ ADVERTENCIA: El endpoint PATCH /users/:id/deactivate NO existe en el backend
  // TODO: Implementar en backend antes de usar
  // softDeleteUser: async (id: string) => {
  //   return api.patch(`/users/${id}/deactivate`);
  // },
  
  updateUser: async (id: string, user: Partial<User>) => {
    // El backend espera el id en el body también
    return api.put(`/users/${id}`, { ...user, id });
  },

  getUserById: async (id: string) => {
    const response = await api.get<any>(`/users/${id}`);
    return { data: response.data };
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
      assignedUserId: d.assigned_user_id || null,
      assignedUserName: d.assigned_user_name || null,
      patientName: d.patient_full_name || undefined
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

  assignDeviceToUser: async (deviceId: string, userId: string, accessType: string = 'MEMBER') => {
    return api.post('/users/assign', {
      accountId: userId,
      deviceId,
      accessType
    });
  },
  
  getDeviceById: async (id: string) => {
    const response = await api.get<any>(`/devices/${id}`);
    const d = response.data[0]; // Backend retorna array
    const data = {
      id: d.device_id,
      alias: d.alias,
      patientId: d.patient_id,
      isActive: d.is_active,
      lastSeen: d.last_seen_at?.toString(),
      assignedUserId: null,
      patientName: undefined
    } as Device;
    return { data };
  },

  getDevicesByUser: async (userId: string) => {
    const response = await api.get<any[]>(`/devices/user/${userId}`);
    const data = response.data.map((d: any) => ({
      id: d.device_id,
      alias: d.alias,
      patientId: d.patient_id,
      isActive: d.is_active,
      lastSeen: d.last_seen_at?.toString(),
      assignedUserId: null,
      patientName: undefined
    })) as Device[];
    return { data };
  },

  getDevicePodium: async () => {
    const response = await api.get<any[]>('/devices/podium');
    return { data: response.data };
  },
  
  // ⚠️ ADVERTENCIA: El endpoint PUT /devices/:id NO existe en el backend
  // TODO: Implementar en backend antes de usar
  // updateDevice: async (id: string, device: Partial<Device>) => {
  //   return api.put(`/devices/${id}`, device);
  // },
  
  // ⚠️ ADVERTENCIA: El endpoint PATCH /devices/:deviceId/assign NO existe en el backend
  // Usar POST /users/asign en su lugar (ver DevicePage.tsx)
  // TODO: Implementar en backend antes de usar
  // assignDevice: async (deviceId: string, userId: string) => {
  //   return api.patch(`/devices/${deviceId}/assign`, { userId });
  // },

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
  
  getEventById: async (id: string) => {
    const response = await api.get<any>(`/events/${id}`);
    const e = response.data[0]; // Backend retorna array
    const data = {
      id: e.event_id,
      deviceId: e.device_id,
      eventType: e.event_type,
      status: e.status,
      occurredAt: e.occurred_at,
      reviewedBy: e.reviewed_by,
      reviewedAt: e.reviewed_at,
      reviewComment: e.review_comment,
      createdAt: e.created_at
    } as FallEvent;
    return { data };
  },

  getEventsByDevice: async (deviceId: string) => {
    const response = await api.get<any[]>(`/events/device/${deviceId}`);
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
    // Backend usa PUT /events/update con {id, status} en el body
    return api.put('/events/update', { id, ...data });
  },

  confirmFalseAlarm: async (id: string) => {
    return api.put('/events/update', { id, status: 'FALSE_ALARM' });
  },

  confirmFall: async (id: string) => {
    return api.put('/events/update', { id, status: 'CONFIRMED_FALL' });
  }
};

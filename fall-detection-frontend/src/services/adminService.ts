// src/services/adminService.ts
import axios from 'axios';
import { User, Device, Patient, FallEvent, AssignedPatient, PatientAssignedUser, EventSample, PaginationMeta } from '../types';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const mapEvent = (e: any): FallEvent => ({
  id: e.event_id || e.id || e.event_uid,
  deviceId: e.device_id,
  deviceAlias: e.device_alias || undefined,
  patientName: e.patient_full_name || e.patient_name || undefined,
  eventType: e.event_type,
  status: e.status,
  occurredAt: e.occurred_at,
  reviewedBy: e.reviewed_by_name || e.reviewed_by,
  reviewedAt: e.reviewed_at,
  reviewComment: e.review_comment,
  createdAt: e.created_at
});

const mapEventSample = (sample: any): EventSample => ({
  seq: Number(sample.seq ?? 0),
  tMs: Number(sample.t_ms ?? sample.tMs ?? 0),
  accX: Number(sample.acc_x ?? sample.accX ?? 0),
  accY: Number(sample.acc_y ?? sample.accY ?? 0),
  accZ: Number(sample.acc_z ?? sample.accZ ?? 0)
});

const getDefaultPagination = (total: number): PaginationMeta => ({
  page: 1,
  pageSize: total > 0 ? total : 20,
  total,
  totalPages: total > 0 ? 1 : 0,
  hasNextPage: false,
  hasPrevPage: false
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

  getAssignedPatientsByUser: async (userId: string) => {
    const response = await api.get<any[]>(`/users/${userId}/patients`);
    const data = response.data.map((row: any) => ({
      patientId: row.patientId,
      patientName: row.patientName,
      accessTypes: Array.isArray(row.accessTypes) ? row.accessTypes : [],
      devices: Array.isArray(row.devices)
        ? row.devices.map((device: any) => ({
            id: device.id,
            alias: device.alias || undefined
          }))
        : []
    })) as AssignedPatient[];
    return { data };
  },

  getAssignedUsersByPatient: async (patientId: string) => {
    const response = await api.get<any[]>(`/patients/${patientId}/users`);
    const data = response.data.map((row: any) => ({
      accountId: row.accountId,
      fullName: row.fullName,
      email: row.email,
      role: row.role,
      accessTypes: Array.isArray(row.accessTypes) ? row.accessTypes : [],
      devicesAssigned: Number(row.devicesAssigned || 0)
    })) as PatientAssignedUser[];
    return { data };
  },

  assignUserToPatient: async (patientId: string, accountId: string, accessType: 'OWNER' | 'MEMBER' = 'MEMBER') => {
    return api.post(`/patients/${patientId}/users`, {
      accountId,
      accessType
    });
  },

  removeUserFromPatient: async (patientId: string, accountId: string) => {
    return api.delete(`/patients/${patientId}/users/${accountId}`);
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
  getAvailableDevices: async () => {
    const response = await api.get<any[]>('/devices/available');
    const data = response.data.map((d: any) => ({
      id: d.device_id,
      alias: d.alias,
      patientId: d.patient_id,
      isActive: d.is_active,
      lastSeen: d.last_seen_at?.toString(),
      assignedUserId: null,
      assignedUserName: null,
      patientName: d.patient_full_name || undefined
    })) as Device[];
    return { data };
  },
  assignDeviceToMe: async (deviceId: string) => {
    return api.post(`/devices/${deviceId}/assign-me`);
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

  // --- PACIENTES ---
  getPatients: async () => {
    const response = await api.get<any[]>('/patients');
    const data = response.data.map((p: any) => ({
      patientId: p.patientId,
      patientName: p.patientName,
      firstName: p.firstName,
      lastName: p.lastName,
      nif: p.nif,
      dateOfBirth: p.dateOfBirth,
      city: p.city,
      addressLine1: p.addressLine1
    })) as Patient[];
    return { data };
  },
  getAvailablePatients: async () => {
    const response = await api.get<any[]>('/patients/available');
    const data = response.data.map((p: any) => ({
      patientId: p.patientId,
      patientName: p.patientName,
      firstName: p.firstName,
      lastName: p.lastName,
      nif: p.nif,
      dateOfBirth: p.dateOfBirth,
      city: p.city,
      addressLine1: p.addressLine1,
      deviceCount: Number(p.deviceCount || 0)
    })) as Patient[];
    return { data };
  },
  assignPatientToMe: async (patientId: string) => {
    return api.post(`/patients/${patientId}/assign-me`);
  },

  createPatient: async (patient: Omit<Patient, 'patientId' | 'patientName'> & { dateOfBirth?: string; addressLine2?: string; province?: string; postalCode?: string; country?: string; notes?: string }) => {
    const payload = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      nif: patient.nif,
      dateOfBirth: patient.dateOfBirth || null,
      addressLine1: patient.addressLine1,
      addressLine2: patient.addressLine2 || null,
      city: patient.city,
      province: patient.province || null,
      postalCode: patient.postalCode || null,
      country: patient.country || 'España',
      notes: patient.notes || null
    };
    return api.post('/patients', payload);
  },

  updateDevice: async (deviceId: string, device: Partial<any>) => {
    const payload = {
      alias: device.alias,
      patientId: device.patientId,
      isActive: device.isActive
    };
    return api.put(`/devices/${deviceId}`, payload);
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
  getEvents: async (params?: { page?: number; pageSize?: number }) => {
    const response = await api.get<any>('/events', { params });

    if (Array.isArray(response.data)) {
      const data = response.data.map(mapEvent) as FallEvent[];
      return { data, pagination: getDefaultPagination(data.length) };
    }

    const rows = Array.isArray(response.data?.data) ? response.data.data : [];
    const data = rows.map(mapEvent) as FallEvent[];
    const paginationRaw = response.data?.pagination || {};
    const fallbackPageSize = params?.pageSize ?? (data.length > 0 ? data.length : 20);
    const pagination: PaginationMeta = {
      page: Number(paginationRaw.page ?? 1),
      pageSize: Number(paginationRaw.pageSize ?? fallbackPageSize),
      total: Number(paginationRaw.total ?? data.length),
      totalPages: Number(paginationRaw.totalPages ?? (data.length > 0 ? 1 : 0)),
      hasNextPage: Boolean(paginationRaw.hasNextPage),
      hasPrevPage: Boolean(paginationRaw.hasPrevPage)
    };

    return { data, pagination };
  },
  
  getEventById: async (id: string) => {
    const response = await api.get<any>(`/events/${id}`);
    const e = response.data[0]; // Backend retorna array
    const data = mapEvent(e) as FallEvent;
    return { data };
  },

  getEventSamples: async (id: string) => {
    const response = await api.get<any[]>(`/events/${id}/samples`);
    const data = response.data.map(mapEventSample) as EventSample[];
    return { data };
  },

  getEventsByDevice: async (deviceId: string) => {
    const response = await api.get<any[]>(`/events/device/${deviceId}`);
    const data = response.data.map(mapEvent) as FallEvent[];
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

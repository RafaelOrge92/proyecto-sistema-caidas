import { apiRequest } from './client';
import { mapDeviceRow, mapEventRow, mapUserRow } from './mappers';
import {
  ApiDeviceRow,
  ApiEventRow,
  ApiUserRow,
  AppUser,
  CreateUserInput,
  Device,
  FallEvent,
  LoginResponse,
  UpdateUserInput
} from './types';

const unwrap = <T>(data: T | T[]): T | null => {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
};

const sortByDateDesc = (value?: string) => (value ? new Date(value).getTime() : 0);

export const getDevices = async (signal?: AbortSignal): Promise<Device[]> => {
  const rows = await apiRequest<ApiDeviceRow[]>('/devices', { signal });
  return rows.map(mapDeviceRow);
};

export const getDevice = async (id: string, signal?: AbortSignal): Promise<Device | null> => {
  const data = await apiRequest<ApiDeviceRow[] | ApiDeviceRow>(`/devices/${id}`, { signal });
  const row = unwrap(data);
  return row ? mapDeviceRow(row) : null;
};

export const getEvents = async (signal?: AbortSignal): Promise<FallEvent[]> => {
  const rows = await apiRequest<ApiEventRow[]>('/events', { signal });
  return rows.map(mapEventRow).sort((a, b) => sortByDateDesc(b.occurredAt) - sortByDateDesc(a.occurredAt));
};

export const getEvent = async (id: string, signal?: AbortSignal): Promise<FallEvent | null> => {
  const data = await apiRequest<ApiEventRow[] | ApiEventRow>(`/events/${id}`, { signal });
  const row = unwrap(data);
  return row ? mapEventRow(row) : null;
};

export const getEventsByDevice = async (deviceId: string, signal?: AbortSignal): Promise<FallEvent[]> => {
  const rows = await apiRequest<ApiEventRow[]>(`/events/device/${deviceId}`, { signal });
  return rows.map(mapEventRow).sort((a, b) => sortByDateDesc(b.occurredAt) - sortByDateDesc(a.occurredAt));
};

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
};

export const loginWithGoogle = async (credential: string): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>('/auth/google', {
    method: 'POST',
    body: { credential }
  });
};

export const logout = async (): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>('/auth/logout', { method: 'POST' });
};

export const getUsers = async (signal?: AbortSignal): Promise<AppUser[]> => {
  const rows = await apiRequest<ApiUserRow[]>('/users', { signal });
  return rows.map(mapUserRow);
};

export const getUser = async (id: string, signal?: AbortSignal): Promise<AppUser | null> => {
  const data = await apiRequest<ApiUserRow[] | ApiUserRow>(`/users/${id}`, { signal });
  const row = unwrap(data);
  return row ? mapUserRow(row) : null;
};

export const createUser = async (payload: CreateUserInput): Promise<AppUser> => {
  const row = await apiRequest<ApiUserRow>('/users', {
    method: 'POST',
    body: payload
  });
  return mapUserRow(row);
};

export const updateUser = async (id: string, payload: UpdateUserInput): Promise<AppUser> => {
  const row = await apiRequest<ApiUserRow>(`/users/${id}`, {
    method: 'PUT',
    body: payload
  });
  return mapUserRow(row);
};

export const deactivateUser = async (id: string): Promise<AppUser> => {
  const row = await apiRequest<ApiUserRow>(`/users/${id}/deactivate`, {
    method: 'PATCH'
  });
  return mapUserRow(row);
};

export const getHealth = async (signal?: AbortSignal): Promise<{ status: string }> => {
  return apiRequest<{ status: string }>('/health', { signal });
};

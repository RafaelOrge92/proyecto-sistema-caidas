// src/types/index.ts

export type UserRole = 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
}

export interface Patient {
  patientId: string;
  patientName: string;
  firstName?: string;
  lastName?: string;
  nif?: string;
  dateOfBirth?: string;
  city?: string;
  addressLine1?: string;
  deviceCount?: number;
}

export interface Device {
  id: string;
  deviceId?: string;
  alias?: string;
  patientName?: string;
  patientId?: string;
  isActive?: boolean;
  lastSeen?: string;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
}

export interface EventSample {
  seq: number;
  tMs: number;
  accX: number;
  accY: number;
  accZ: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FallEvent {
  id: string;
  deviceId: string;
  deviceAlias?: string;
  patientName?: string;
  timestamp?: string;
  occurredAt?: string;
  createdAt?: string;
  eventType?: 'FALL' | 'EMERGENCY_BUTTON' | 'SIMULATED';
  status?: 'OPEN' | 'CONFIRMED_FALL' | 'FALSE_ALARM' | 'RESOLVED' | 'PENDIENTE';
  fallDetected?: boolean;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
  accelerometerData?: {
    x: number;
    y: number;
    z: number;
  };
  samples?: EventSample[];
}

export interface AssignedPatient {
  patientId: string;
  patientName: string;
  accessTypes: string[];
  devices: Array<{
    id: string;
    alias?: string;
  }>;
}

export interface PatientAssignedUser {
  accountId: string;
  fullName: string;
  email: string;
  role: string;
  accessTypes: string[];
  devicesAssigned: number;
}

export interface ChatSession {
  sessionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  provider?: string;
  model?: string;
}

export interface ChatUiRoute {
  label: string;
  path: string;
}

export interface ChatUiContext {
  currentPath: string;
  availableRoutes: ChatUiRoute[];
}

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
}

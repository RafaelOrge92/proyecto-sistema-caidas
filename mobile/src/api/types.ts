export type UserRole = 'ADMIN' | 'MEMBER';

export type Device = {
  id: string;
  alias?: string;
  patientId?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientFullName?: string;
  isActive?: boolean;
  lastSeenAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type FallEvent = {
  id: string;
  eventUid?: string;
  deviceId: string;
  eventType?: 'FALL' | 'EMERGENCY_BUTTON' | 'SIMULATED';
  status?: 'OPEN' | 'CONFIRMED_FALL' | 'FALSE_ALARM' | 'RESOLVED';
  occurredAt?: string;
  createdAt?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
  };
};

export type AppUser = {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  note?: string;
};

export type CreateUserInput = {
  email: string;
  fullName: string;
  phone?: string | null;
  role?: UserRole;
  password?: string;
};

export type UpdateUserInput = {
  email?: string;
  fullName?: string;
  phone?: string | null;
  role?: UserRole;
};

export type ApiDeviceRow = {
  device_id?: string;
  patient_id?: string;
  patient_first_name?: string;
  patient_last_name?: string;
  patient_full_name?: string;
  alias?: string;
  is_active?: boolean;
  last_seen_at?: string;
  created_at?: string;
  updated_at?: string;
  id?: string;
  patientId?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientFullName?: string;
  isActive?: boolean;
  lastSeenAt?: string;
};

export type ApiEventRow = {
  event_id?: string;
  event_uid?: string;
  device_id?: string;
  event_type?: string;
  status?: string;
  occurred_at?: string;
  created_at?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_comment?: string | null;
  id?: string;
  deviceId?: string;
  eventType?: string;
  occurredAt?: string;
  createdAt?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
};

export type ApiUserRow = {
  id?: string;
  email?: string;
  role?: UserRole | string;
  full_name?: string;
  fullName?: string;
  phone?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  is_active?: boolean;
  isActive?: boolean;
  note?: string;
};

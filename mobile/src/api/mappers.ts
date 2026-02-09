import { ApiDeviceRow, ApiEventRow, ApiUserRow, AppUser, Device, FallEvent } from './types';

const composeFullName = (firstName?: string, lastName?: string) => {
  const full = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ').trim();
  return full || undefined;
};

export const mapDeviceRow = (row: ApiDeviceRow): Device => ({
  id: row.device_id || row.id || '',
  alias: row.alias || undefined,
  patientId: row.patient_id || row.patientId || undefined,
  patientFirstName: row.patient_first_name || row.patientFirstName || undefined,
  patientLastName: row.patient_last_name || row.patientLastName || undefined,
  patientFullName:
    row.patient_full_name ||
    row.patientFullName ||
    composeFullName(row.patient_first_name || row.patientFirstName, row.patient_last_name || row.patientLastName),
  isActive: row.is_active ?? row.isActive,
  lastSeenAt: row.last_seen_at || row.lastSeenAt || undefined,
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined
});

export const mapEventRow = (row: ApiEventRow): FallEvent => ({
  id: row.event_id || row.id || '',
  eventUid: row.event_uid || undefined,
  deviceId: row.device_id || row.deviceId || '',
  eventType: (row.event_type || row.eventType) as FallEvent['eventType'],
  status: (row.status as FallEvent['status']) || undefined,
  occurredAt: row.occurred_at || row.occurredAt || undefined,
  createdAt: row.created_at || row.createdAt || undefined,
  reviewedBy: row.reviewed_by ?? row.reviewedBy ?? null,
  reviewedAt: row.reviewed_at || row.reviewedAt || undefined,
  reviewComment: row.review_comment || row.reviewComment || undefined
});

export const mapUserRow = (row: ApiUserRow): AppUser => ({
  id: row.id || '',
  email: row.email || '',
  role: (row.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'),
  fullName: row.full_name || row.fullName || '',
  phone: row.phone ?? undefined,
  createdAt: row.created_at || row.createdAt || undefined,
  updatedAt: row.updated_at || row.updatedAt || undefined,
  isActive: row.is_active ?? row.isActive,
  note: row.note
});

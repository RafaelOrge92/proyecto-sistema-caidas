// src/types/index.ts

export type UserRole = 'ADMIN' | 'CUIDADOR' | 'USUARIO';

export interface User {
  id: string;        // UUID o número
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean; // Para el Soft Delete
}

export interface Device {
  id: string;         // ID interno de la BD
  deviceId: string;   // El ID físico del ESP32 (ej: ESP32-001) [cite: 56]
  alias: string;      // Nombre amigable
  assignedUserId: string | null; // ID del usuario asociado
}

export interface FallEvent {
  id: string;
  deviceId: string;
  timestamp: string;
  fallDetected: boolean;
  status: 'PENDIENTE' | 'CONFIRMADA' | 'FALSA_ALARMA';
  accelerometerData?: {
    x: number;
    y: number;
    z: number;
  };
}
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
  id: string;            // ID único del evento en la BD [cite: 6]
  deviceId: string;      // "ESP32-001" o similar [cite: 56]
  accX: number;          // Aceleración eje X [cite: 57]
  accY: number;          // Aceleración eje Y [cite: 58]
  accZ: number;          // Aceleración eje Z [cite: 59]
  fallDetected: boolean; // true si el sensor detectó la caída [cite: 60]
  timestamp: string;     // Fecha y hora del evento [cite: 86]
  status: 'PENDIENTE' | 'CONFIRMADA' | 'FALSA_ALARMA'; // Para la funcionalidad de "Extras" [cite: 96]
}
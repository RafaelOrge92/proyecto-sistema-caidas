export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'CUIDADOR' | 'USUARIO';
}

export interface FallEvent {
  deviceId: string;
  timestamp: string;
  accX: number;
  accY: number;
  accZ: number;
  fallDetected: boolean;
}
import { NextFunction, Request, Response } from 'express';
import { db } from '../config/db';
import { verifyPassword } from '../utils/password';

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const extractDeviceId = (req: Request): string | null => {
  return (
    asNonEmptyString(req.header('x-device-id')) ??
    asNonEmptyString(req.body?.deviceId) ??
    asNonEmptyString(req.body?.device_id) ??
    asNonEmptyString(req.body?.id)
  );
};

const extractDeviceKey = (req: Request): string | null => {
  return (
    asNonEmptyString(req.header('x-device-key')) ??
    asNonEmptyString(req.body?.deviceKey) ??
    asNonEmptyString(req.body?.device_key)
  );
};

export const authenticateDevice = async (req: Request, res: Response, next: NextFunction) => {
  const deviceId = extractDeviceId(req);
  const deviceKey = extractDeviceKey(req);

  if (!deviceId || !deviceKey) {
    return res.status(401).json({ error: 'X-Device-Id y X-Device-Key son requeridos' });
  }

  const bodyDeviceId =
    asNonEmptyString(req.body?.deviceId) ??
    asNonEmptyString(req.body?.device_id) ??
    asNonEmptyString(req.body?.id);

  if (bodyDeviceId && bodyDeviceId !== deviceId) {
    return res.status(400).json({ error: 'deviceId del body no coincide con X-Device-Id' });
  }

  try {
    const devices = await db.query(
      'SELECT device_id, device_key_hash FROM public.devices WHERE device_id = $1 LIMIT 1',
      [deviceId]
    );

    if (devices.length === 0) {
      return res.status(401).json({ error: 'Dispositivo no autorizado' });
    }

    const device = devices[0];
    const storedKey = asNonEmptyString(device.device_key_hash);
    if (!storedKey) {
      return res.status(403).json({ error: 'Dispositivo sin clave configurada' });
    }

    const validKey = await verifyPassword(deviceKey, storedKey);
    if (!validKey) {
      return res.status(401).json({ error: 'Dispositivo no autorizado' });
    }

    (req as any).deviceIdAuth = deviceId;
    return next();
  } catch (error) {
    console.error('Device auth error:', error);
    return res.status(500).json({ error: 'Error validando dispositivo' });
  }
};

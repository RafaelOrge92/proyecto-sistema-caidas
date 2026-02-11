import express, { response, Router, Request, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();


//get all devices

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  const result = await db.query(`
    SELECT
      d.*,
      p.first_name AS patient_first_name,
      p.last_name AS patient_last_name,
      CONCAT(p.first_name, ' ', p.last_name) AS patient_full_name
    FROM public.devices d
    LEFT JOIN public.patients p ON p.patient_id = d.patient_id
  `)
  res.json(result)
})

router.get('/podium', authenticateToken, requireAdmin, async (req, res) => {
  const result = await db.query('SELECT COUNT(event_id), device_id FROM public.events GROUP BY device_id ')
  res.json(result)
})

// Get device by id
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = req.params.id as string;
  const result = await db.query(`
    SELECT
      d.*,
      p.first_name AS patient_first_name,
      p.last_name AS patient_last_name,
      CONCAT(p.first_name, ' ', p.last_name) AS patient_full_name
    FROM public.devices d
    LEFT JOIN public.patients p ON p.patient_id = d.patient_id
    WHERE d.device_id = $1
  `,
    [id]
  )
  res.json(result)
});

router.get('/user/:userId', authenticateToken, async (req, res) => {
  // Permitir que ADMIN vea cualquier usuario, o que el usuario vea sus propios dispositivos
  const userId = req.params.userId as string;
  if (req.user?.role !== 'ADMIN' && req.user?.sub !== userId) {
    return res.status(403).json({ error: 'No tienes permiso para ver los dispositivos de otro usuario' });
  }

  const result = await db.query(`SELECT * FROM public.devices WHERE device_id IN (SELECT device_id FROM public.device_access WHERE account_id = $1)`,
    [userId]
   )
  res.json(result)
})

// Create device
router.post('/', authenticateToken, requireAdmin, async (req, res) => {

  const { id, alias, patientId, active, lastSeenAt } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID del dispositivo es requerido' });
  } 
 
  try {
    const result = await db.query(`INSERT into public.devices (device_id, patient_id, alias, is_active, last_seen_at)
      values ($1, $2, $3, $4, $5)`,
    [id, patientId || null, alias || null, active || true, lastSeenAt || null]
    )
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating device:', error);
    // Si el error es por patient_id NOT NULL, sugerir que se debe hacer nullable
    if (error?.message?.includes('patient_id')) {
      return res.status(400).json({ error: 'patient_id debe ser nullable en la base de datos. Ejecuta: ALTER TABLE public.devices ALTER COLUMN patient_id DROP NOT NULL;' });
    }
    res.status(500).json({ error: 'Error al crear dispositivo' });
  }
});

const handleHeartbeat = async (req: Request, res: Response) => {
  const timestamp = req.body?.timestamp ?? req.body?.lastSeenAt ?? req.body?.last_seen_at ?? null
  const deviceId = req.body?.deviceId ?? req.body?.id ?? req.body?.device_id

  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId es requerido' })
  }

  console.log('Recibido')
  try{
   const result = await db.query(
    `UPDATE public.devices SET last_seen_at = COALESCE($1::timestamptz, now()) WHERE device_id = $2`,
    [timestamp, deviceId]
   )
   res.json(result)
  } catch (error){
    console.error('Cannot access device')
    res.status(500).json({error: 'No se puede acceder al dispositivo'})
  }
}

router.put('/heartbeat', handleHeartbeat)
router.post('/heartbeat', handleHeartbeat)

export const devicesRoutes = router;

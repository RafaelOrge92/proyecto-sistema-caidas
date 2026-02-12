import express, { Router, Request, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { authenticateDevice } from '../middleware/deviceAuth';

const router = Router();

interface Sample {
  seq: number,
  tMs: number,
  accX: number,
  accY: number,
  accZ: number
}

const isMissingColumnError = (error: any, column: string) =>
  error?.code === '42703' && String(error?.message || '').includes(column);

const EVENTS_SELECT = `
  SELECT
    e.*,
    d.alias AS device_alias,
    p.patient_id AS patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_full_name,
    a.full_name AS reviewed_by_name
  FROM public.events e
  LEFT JOIN public.devices d ON d.device_id = e.device_id
  LEFT JOIN public.patients p ON p.patient_id = d.patient_id
  LEFT JOIN public.accounts a ON a.account_id = e.reviewed_by
`

/**
 * Verifica si un usuario tiene acceso a un dispositivo
 */
const userHasDeviceAccess = async (userId: string, deviceId: string): Promise<boolean> => {
  const result = await db.query(
    'SELECT COUNT(*) as count FROM public.device_access WHERE account_id = $1 AND device_id = $2',
    [userId, deviceId]
  );
  return result[0]?.count > 0;
};


// Get all events
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  const result = await db.query(`${EVENTS_SELECT}
    ORDER BY e.occurred_at DESC NULLS LAST, e.created_at DESC NULLS LAST`)
  res.json(result)
});

// Get events by device
router.get('/device/:deviceId', authenticateToken, async (req, res) => {
  // Permitir si es ADMIN o si el usuario tiene acceso al dispositivo
  const deviceId = req.params.deviceId as string;
  if (req.user?.role !== 'ADMIN') {
    const hasAccess = await userHasDeviceAccess(req.user?.sub || '', deviceId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes permiso para ver los eventos de este dispositivo' });
    }
  }

  const result = await db.query(
    `${EVENTS_SELECT}
     WHERE e.device_id = $1
     ORDER BY e.occurred_at DESC NULLS LAST, e.created_at DESC NULLS LAST`,
    [deviceId]
  )
  res.json(result);
});


// Get event by id
router.get('/:id', authenticateToken, async (req, res) => {
  const id = req.params.id as string;
  try {
    const result = await db.query(
      `${EVENTS_SELECT}
       WHERE e.event_id::text = $1 OR e.event_uid::text = $1`,
      [id]
    )
    
    // Verificar acceso si no es ADMIN
    if (result.length > 0 && req.user?.role !== 'ADMIN') {
      const event = result[0];
      const hasAccess = await userHasDeviceAccess(req.user?.sub || '', event.device_id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'No tienes permiso para ver este evento' });
      }
    }
    
    return res.json(result)
  } catch (error: any) {
    if (error?.code === '42703' && String(error?.message || '').includes('event_id')) {
      const fallback = await db.query(
        `${EVENTS_SELECT}
         WHERE e.id::text = $1 OR e.event_uid::text = $1`,
        [id]
      )
      
      // Verificar acceso si no es ADMIN
      if (fallback.length > 0 && req.user?.role !== 'ADMIN') {
        const event = fallback[0];
        const hasAccess = await userHasDeviceAccess(req.user?.sub || '', event.device_id);
        if (!hasAccess) {
          return res.status(403).json({ error: 'No tienes permiso para ver este evento' });
        }
      }
      
      return res.json(fallback)
    }
    console.error('Error fetching event by id:', error)
    return res.status(500).json({ error: 'Error al obtener el evento' })
  }
});

router.put('/update', authenticateToken, requireAdmin, async (req, res) => {
  const id = req.body?.id as string | undefined
  const status = req.body?.status as string | undefined
  const reviewedBy = (req.body?.reviewedBy ?? req.body?.reviewed_by ?? req.user?.sub ?? null) as string | null
  const reviewedAt = (req.body?.reviewedAt ?? req.body?.reviewed_at ?? new Date().toISOString()) as string | null
  const rawReviewComment = req.body?.review_comment ?? req.body?.reviewComment ?? null
  const reviewComment =
    typeof rawReviewComment === 'string'
      ? (rawReviewComment.trim().slice(0, 255) || null)
      : rawReviewComment

  if (!id || !status) {
    return res.status(400).json({ error: 'id y status son requeridos' })
  }

  try {
    const result = await db.query(
      `UPDATE public.events
       SET status = $1,
           reviewed_by = COALESCE($2::uuid, reviewed_by),
           reviewed_at = COALESCE($3::timestamptz, reviewed_at, now()),
           review_comment = $4
       WHERE event_id::text = $5 OR event_uid::text = $5
       RETURNING *`,
      [status, reviewedBy, reviewedAt, reviewComment, id]
    )
    res.json(result)
  } catch (error: any) {
    if (error?.code === '22P02') {
      return res.status(400).json({ error: 'status o reviewedBy inválido' })
    }
    if (isMissingColumnError(error, 'event_id')) {
      const fallback = await db.query(
        `UPDATE public.events
         SET status = $1,
             reviewed_by = COALESCE($2::uuid, reviewed_by),
             reviewed_at = COALESCE($3::timestamptz, reviewed_at, now()),
             review_comment = $4
         WHERE id::text = $5 OR event_uid::text = $5
         RETURNING *`,
        [status, reviewedBy, reviewedAt, reviewComment, id]
      )
      return res.json(fallback)
    }
    console.error('Error updating event:', error)
    res.status(500).json({error: 'Error al actualizar el evento'})
  }
  
  
})

router.post('/ingest', authenticateDevice, async (req, res) => {
  const authenticatedDeviceId = (req as any).deviceIdAuth as string | undefined
  const payloadDeviceId = req.body?.deviceId ?? req.body?.device_id
  const deviceId = authenticatedDeviceId ?? payloadDeviceId
  const eventUid = req.body?.eventUid ?? req.body?.event_uid
  const eventType = req.body?.eventType ?? req.body?.event_type
  const eventOccurredAt = req.body?.occurredAt ?? req.body?.ocurredAt ?? req.body?.occurred_at ?? null

  if (!deviceId || !eventUid || !eventType) {
    return res.status(400).json({ error: 'deviceId, eventUid y eventType son requeridos' })
  }

  if (payloadDeviceId && authenticatedDeviceId && payloadDeviceId !== authenticatedDeviceId) {
    return res.status(400).json({ error: 'deviceId del body no coincide con dispositivo autenticado' })
  }

  const result = await db.query(`INSERT INTO public.events (event_uid, device_id, event_type, occurred_at) 
    values($1, $2, $3, COALESCE($4::timestamptz, now()))`,
  [eventUid, deviceId, eventType, eventOccurredAt])
  res.status(201).json(result)
})

router.post('/samples', authenticateDevice, async (req, res) => {
  const authenticatedDeviceId = (req as any).deviceIdAuth as string | undefined
  const eventUid = req.body?.eventUid ?? req.body?.event_uid
  const samples = Array.isArray(req.body?.samples)
    ? (req.body.samples as Sample[])
    : (Array.isArray(req.body) ? (req.body as Sample[]) : [])

  if (!eventUid) {
    return res.status(400).json({ error: 'eventUid es requerido' })
  }

  if (!Array.isArray(samples) || samples.length === 0) {
    return res.status(201).json([])
  }

  try {
    let eventId: string | null = null
    try {
      const event = await db.query(
        `SELECT event_id::text as event_id, device_id FROM public.events WHERE event_uid::text = $1 LIMIT 1`,
        [eventUid]
      )
      eventId = event[0]?.event_id ?? null
      if (authenticatedDeviceId && event[0]?.device_id && event[0].device_id !== authenticatedDeviceId) {
        return res.status(403).json({ error: 'Evento no pertenece al dispositivo autenticado' })
      }
    } catch (error: any) {
      if (isMissingColumnError(error, 'event_id')) {
        const fallback = await db.query(
          `SELECT id::text as event_id, device_id FROM public.events WHERE event_uid::text = $1 LIMIT 1`,
          [eventUid]
        )
        eventId = fallback[0]?.event_id ?? null
        if (authenticatedDeviceId && fallback[0]?.device_id && fallback[0].device_id !== authenticatedDeviceId) {
          return res.status(403).json({ error: 'Evento no pertenece al dispositivo autenticado' })
        }
      } else {
        throw error
      }
    }

    if (!eventId) {
      return res.status(404).json({ error: 'Evento no encontrado para eventUid' })
    }

    try {
      for (const sam of samples) {
        const seq = (sam as any)?.seq
        const tMs = (sam as any)?.tMs ?? (sam as any)?.t_ms
        const accX = (sam as any)?.accX ?? (sam as any)?.acc_x
        const accY = (sam as any)?.accY ?? (sam as any)?.acc_y
        const accZ = (sam as any)?.accZ ?? (sam as any)?.acc_z
        await db.query(
          `INSERT INTO public.event_samples (event_id, seq, t_ms, acc_x, acc_y, acc_z)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [eventId, seq, tMs, accX, accY, accZ]
        )
      }
    } catch (error: any) {
      if (!isMissingColumnError(error, 'event_id')) {
        throw error
      }

      for (const sam of samples) {
        const seq = (sam as any)?.seq
        const tMs = (sam as any)?.tMs ?? (sam as any)?.t_ms
        const accX = (sam as any)?.accX ?? (sam as any)?.acc_x
        const accY = (sam as any)?.accY ?? (sam as any)?.acc_y
        const accZ = (sam as any)?.accZ ?? (sam as any)?.acc_z
        await db.query(
          `INSERT INTO public.event_samples (event_uid, seq, t_ms, acc_x, acc_y, acc_z)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [eventUid, seq, tMs, accX, accY, accZ]
        )
      }
    }

    return res.status(201).json([])
  } catch (error) {
    console.error('Error saving event samples:', error)
    return res.status(500).json({ error: 'Error al guardar samples del evento' })
  }
})

// Create event
router.post('/', async (req, res) => {
  const deviceId = req.body?.deviceId ?? req.body?.device_id
  const eventType = req.body?.eventType ?? req.body?.event_type
  const status = req.body?.status ?? 'OPEN'
  const eventUid = req.body?.eventUid ?? req.body?.event_uid
  const eventOccurredAt = req.body?.occurredAt ?? req.body?.ocurredAt ?? req.body?.occurred_at ?? null
  const reviewedBy = req.body?.reviewedBy ?? req.body?.reviewed_by ?? null
  const reviewedAt = req.body?.reviewedAt ?? req.body?.reviewed_at ?? null
  const reviewComment = req.body?.review_comment ?? req.body?.reviewComment ?? null

  if (!deviceId || !eventType || !eventUid) {
    return res.status(400).json({ error: 'deviceId, eventType y eventUid son requeridos' })
  }

  const result = await db.query(`INSERT INTO public.events (event_uid, device_id, event_type, status, occurred_at, reviewed_by, reviewed_at, review_comment)
    values ($1, $2, $3, $4, COALESCE($5::timestamptz, now()), $6, $7, $8)`,
  [eventUid, deviceId, eventType, status, eventOccurredAt, reviewedBy, reviewedAt, reviewComment])
  res.status(201).json(result)
});

export const eventsRoutes = router;

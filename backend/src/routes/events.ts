import express, { Router } from 'express';
import { db } from '../config/db';

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


// Get all events
router.get('/', async (req, res) => {
  const result = await db.query('SELECT * FROM public.events')
  res.json(result)
});

// Get events by device
router.get('/device/:deviceId', async (req, res) => {
  const result = await db.query(`SELECT * FROM public.events WHERE device_id = $1`, [req.params.deviceId])
  res.json(result);
});


// Get event by id
router.get('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const result = await db.query(
      'SELECT * FROM public.events WHERE event_id::text = $1 OR event_uid::text = $1',
      [id]
    )
    return res.json(result)
  } catch (error: any) {
    if (error?.code === '42703' && String(error?.message || '').includes('event_id')) {
      const fallback = await db.query(
        'SELECT * FROM public.events WHERE id::text = $1 OR event_uid::text = $1',
        [id]
      )
      return res.json(fallback)
    }
    console.error('Error fetching event by id:', error)
    return res.status(500).json({ error: 'Error al obtener el evento' })
  }
});

router.put('/update', async (req, res) => {
  const {id, status} = req.body
  if (!id || !status) {
    return res.status(400).json({error: 'id y status son requeridos'})
  }

  try{
    const result = await db.query(
      `UPDATE public.events SET status = $1 WHERE event_id::text = $2 OR event_uid::text = $2 RETURNING *`,
      [status, id]
    )
    res.json(result)
  } catch (error: any) {
    if (isMissingColumnError(error, 'event_id')) {
      const fallback = await db.query(
        `UPDATE public.events SET status = $1 WHERE id::text = $2 OR event_uid::text = $2 RETURNING *`,
        [status, id]
      )
      return res.json(fallback)
    }
    console.error('Error updating event:', error)
    res.status(500).json({error: 'Error al actualizar el evento'})
  }
  
  
})

router.post('/ingest', async (req, res) => {
  const { deviceId, eventUid, eventType, occurredAt, ocurredAt } = req.body
  const eventOccurredAt = occurredAt ?? ocurredAt ?? null
  const result = await db.query(`INSERT INTO public.events (event_uid, device_id, event_type, occurred_at) 
    values($1, $2, $3, COALESCE($4::timestamptz, now()))`,
  [eventUid, deviceId, eventType, eventOccurredAt])
  res.status(201).json(result)
})

router.post('/samples', async (req, res) => {
  const { eventUid } = req.body || {}
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
        `SELECT event_id::text as event_id FROM public.events WHERE event_uid::text = $1 LIMIT 1`,
        [eventUid]
      )
      eventId = event[0]?.event_id ?? null
    } catch (error: any) {
      if (isMissingColumnError(error, 'event_id')) {
        const fallback = await db.query(
          `SELECT id::text as event_id FROM public.events WHERE event_uid::text = $1 LIMIT 1`,
          [eventUid]
        )
        eventId = fallback[0]?.event_id ?? null
      } else {
        throw error
      }
    }

    if (!eventId) {
      return res.status(404).json({ error: 'Evento no encontrado para eventUid' })
    }

    try {
      for (const sam of samples) {
        await db.query(
          `INSERT INTO public.event_samples (event_id, seq, t_ms, acc_x, acc_y, acc_z)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [eventId, sam.seq, sam.tMs, sam.accX, sam.accY, sam.accZ]
        )
      }
    } catch (error: any) {
      if (!isMissingColumnError(error, 'event_id')) {
        throw error
      }

      for (const sam of samples) {
        await db.query(
          `INSERT INTO public.event_samples (event_uid, seq, t_ms, acc_x, acc_y, acc_z)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [eventUid, sam.seq, sam.tMs, sam.accX, sam.accY, sam.accZ]
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
  const { deviceId, eventType, status, eventUid, ocurredAt, reviewedBy, reviewedAt, review_comment } = req.body;
  const result = await db.query(`INSERT INTO public.events (event_uid, device_id, event_type, status, occurred_at, reviewed_by, reviewed_at, review_comment)
    values ($1, $2, $3, $4, $5, $6, $7, $8)`,
  [eventUid, deviceId, eventType, status, ocurredAt, reviewedBy, reviewedAt, review_comment])
  res.status(201).json(result)
});

export const eventsRoutes = router;

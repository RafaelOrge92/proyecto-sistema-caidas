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


// Get all events
router.get('/', async (req, res) => {
  const result = await db.query('SELECT * FROM public.events')
  res.json(result)
});

// Get events by device
router.get('/device/:deviceId', async (req, res) => {
  const result = await db.query(`SELECT * FROM public.events WHERE device_id = $1`, [req.params.deviceId])
  res.json(result)
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
  try{
    const result = await db.query(`UPDATE public.events SET status = '$1 WHERE event_id = $2'`,[status,id])
    res.json(result)
  } catch (error) {
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
  const {eventUid} = req.body
  const samples = req.body as Sample[]
  samples.forEach(async(sam) => {
    const result = await db.query(`INSERT INTO public.event_samples (event_uid, seq, t_ms, acc_x, acc_y, acc_z) values($1, $2, $3, $4,$5, $6)`,
      [eventUid, sam.seq, sam.tMs, sam.accX, sam.accY, sam.accZ]
    )
    res.status(201).json(result)
  })
})

// Create event
router.post('/', async (req, res) => {
  const { deviceId, eventType, status, eventUid, ocurredAt, reviewedBy, reviewedAt, review_comment } = req.body;
  const result = await db.query(`INSERT INTO public.events (event_uid, device_id, event_type, status, occurred_at, reviewed_by, review_comment)
    values ($1, $2, $3, $4, $5, $6, $7, $8)`,
  [eventUid, deviceId, eventType, status, ocurredAt, reviewedBy, reviewedAt, review_comment])
  res.status(201).json(result)
});

export const eventsRoutes = router;

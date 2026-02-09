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
  const result = await db.query(`SELECT * FROM public.events WHERE device_id = ${req.params.deviceId}`)
  res.json(result)
});


// Get event by id
router.get('/:id', async (req, res) => {
  const result = await db.query(`SELECT * FROM public.events WHERE event_id = ${req.params.id}`)
  res.json(result)
});

router.put('/update', async (req, res) => {
  const {id, status} = req.body
  try{
    const result = await db.query(`UPDATE public.events SET status = '${status} WHERE event_id = ${id}'`)
    res.json(result)
  } catch (error) {
    console.error('Error updating event:', error)
    res.status(500).json({error: 'Error al actualizar el evento'})
  }
  
  
})

router.post('/ingest', async (req, res) => {
  const {deviceId, eventUid, eventType, ocurredAt} = req.body
  const result = await db.query(`INSERT INTO public.events (event_uid, device_id, event_type, ocurred_at) 
    values(${eventUid}, ${deviceId}, ${eventType}, ${ocurredAt})`)
  res.status(201).json(result)
})

router.post('/samples', async (req, res) => {
  const {eventUid} = req.body
  const samples = req.body as Sample[]
  samples.forEach(async(sam) => {
    const result = await db.query(`INSERT INTO public.event_samples (event_id, seq, t_ms, acc_x, acc_y, acc_z) values(${eventUid}, ${sam.seq}, ${sam.tMs}, ${sam.accX},${sam.accY}, ${sam.accZ})`)
    res.status(201).json(result)
  })
})

// Create event
router.post('/', async (req, res) => {
  const { deviceId, eventType, status, eventUid, ocurredAt, reviewedBy, reviewedAt, review_comment } = req.body;
  const result = await db.query(`INSERT INTO public.events (event_uid, device_id, event_type, status, ocurred_at, reviewed_by, review_comment)
    values (${eventUid}, ${deviceId}, ${eventType}, ${status}, ${ocurredAt} ${reviewedBy}, ${reviewedAt}, ${review_comment})`)
  res.status(201).json(result)
});

export const eventsRoutes = router;

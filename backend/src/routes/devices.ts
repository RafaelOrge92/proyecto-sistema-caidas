import express, { response, Router } from 'express';
import { db } from '../config/db';

const router = Router();


//get all devices

router.get('/', async (req, res) => {
  const result = await db.query('SELECT *, (SELECT first_name as patient_first_name, patient_last_name, CONCAT(first_name, " ", last_name) as patient_full_name FROM public.patients WHERE patient_id = public.patients.patient_id) FROM public.devices')
  res.json(result)
})

// Get device by id
router.get('/:id', async (req, res) => {
  const result = await db.query(`SELECT *, (SELECT first_name as patient_first_name, patient_last_name, CONCAT(first_name, " ", last_name) as patient_full_name FROM public.patients WHERE patient_id = public.patients.patient_id) FROM public.devices WHERE device_id = $1`,
    [req.params.id]
  )
  res.json(result)
});

router.get('/user/:userId', async (req, res) => {
  const result = await db.query(`SELECT * FROM public.devices WHERE device_id IN (SELECT device_id FROM public.device_access WHERE account_id = $1)`,
    [req.params.userId]
   )
  res.json(result)
})

// Create device
router.post('/', async (req, res) => {
  const { id, alias, patientId, active, lastSeenAt } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID del dispositivo es requerido' });
  } 
 
  const result = await db.query(`INSERT into public.devices (device_id, patient_id, alias, is_active, last_seen_at)
    values ($1, $2, $3, $4, $5)`,
  [id, patientId, alias, active, lastSeenAt]
  )
  res.status(201).json(result)
});

router.put('/heartbeat', async (req, res) => {
  const {timestamp, deviceId} = req.body
  console.log('Recibido')
  try{
   const result = await db.query(`UPDATE public.devices SET last_seen_at = $1 WHERE device_id = $2`,[timestamp,deviceId])
   res.json(result)
  } catch (error){
    console.error('Cannot access device')
    res.status(500).json({error: 'No se puede acceder al dispositivo'})
  }
})

router.get('/podium', async (req, res) => {
  const result = db.query('SELECT COUNT(event_id), device_id FROM public.events GROUP BY device_id ')
  res.json(result)
})

export const devicesRoutes = router;

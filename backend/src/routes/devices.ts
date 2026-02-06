import express, { response, Router } from 'express';
import { db } from '../config/db';

const router = Router();

// Mock devices data
const devices = [
  {
    id: 'ESP32-001',
    alias: 'Salón (Casa Carmen)',
    patientName: 'Carmen García',
    patientId: 'P001',
    isActive: true,
    lastSeen: new Date(Date.now() - 2 * 60000).toISOString()
  },
  {
    id: 'ESP32-002',
    alias: 'Dormitorio (Casa Antonio)',
    patientName: 'Antonio Pérez',
    patientId: 'P002',
    isActive: true,
    lastSeen: new Date(Date.now() - 25 * 60000).toISOString()
  }
];

//get all devices

router.get('/', async (req, res) => {
  const result = await db.query('SELECT * FROM public.devices')
  res.json(result)
})

// Get device by id
router.get('/:id', async (req, res) => {
  const result = await db.query(`SELECT * FROM public.devices WHERE device_id = ${req.params.id}`)
  res.json(result)
});

router.get('/user/:userId', async (req, res) => {
  const result = await db.query(`SELECT * FROM public.devices WHERE device_id IN (SELECT device_id FROM public.device_access WHERE account_id = ${req.params.userId})` )
})

// Create device
router.post('/', async (req, res) => {
  const { id, alias, patientId, active, lastSeenAt } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID del dispositivo es requerido' });
  } 
 
  const result = await db.query(`INSERT into public.devices (device_id, patient_id, alias, is_active, last_seen_at)
    values (${id}, ${patientId}, ${alias}, ${active}, ${lastSeenAt})`)
  res.status(201).json(result)
});

router.put('/heartbeat', async (req, res) => {
  const {timestamp, deviceId} = req.body
  console.log('Recibido')
  try{
   const result = await db.query(`UPDATE public.devices SET last_seen_at = ${timestamp} WHERE device_id = ${deviceId}`)
   res.json(result)
  } catch (error){
    console.error('Cannot access device')
    res.status(500).json({error: 'No se puede acceder al dispositivo'})
  }
})


export const devicesRoutes = router;

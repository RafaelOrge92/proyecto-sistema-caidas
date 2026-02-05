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
  const result = await db().query('SELECT * FROM public.devices')
  res.json(result)
})

// Get device by id
router.get('/:id', async (req, res) => {
  const result = await db().query(`SELECT * FROM public.devices WHERE device_id = ${req.params.id}`)
  res.json(result)
});


// Create device
router.post('/', (req, res) => {
  const { id, alias, patientName, patientId } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID del dispositivo es requerido' });
  }

  const newDevice = {
    id,
    alias: alias || '',
    patientName: patientName || '',
    patientId: patientId || '',
    isActive: true,
    lastSeen: new Date().toISOString()
  };

  devices.push(newDevice);
  res.status(201).json(newDevice);
});

// Update device
router.put('/:id', (req, res) => {
  const device = devices.find(d => d.id === req.params.id);
  if (!device) {
    return res.status(404).json({ error: 'Dispositivo no encontrado' });
  }

  Object.assign(device, req.body);
  res.json(device);
});

// Assign device to user
router.patch('/:id/assign', (req, res) => {
  const device = devices.find(d => d.id === req.params.id);
  if (!device) {
    return res.status(404).json({ error: 'Dispositivo no encontrado' });
  }

  const { userId, patientName, patientId } = req.body;
  
  if (patientName) device.patientName = patientName;
  if (patientId) device.patientId = patientId;

  res.json(device);
});

export const devicesRoutes = router;

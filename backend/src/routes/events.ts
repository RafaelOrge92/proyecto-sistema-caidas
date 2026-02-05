import express, { Router } from 'express';
import { db } from '../config/db';

const router = Router();

// Mock events data - GLOBAL (persiste entre requests)
let events = [
  {
    id: '1',
    deviceId: 'ESP32-001',
    deviceAlias: 'Salón (Casa Carmen)',
    patientName: 'Carmen García',
    eventType: 'FALL',
    status: 'OPEN',
    occurredAt: new Date(Date.now() - 45 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    reviewComment: null
  },
  {
    id: '2',
    deviceId: 'ESP32-001',
    deviceAlias: 'Salón (Casa Carmen)',
    patientName: 'Carmen García',
    eventType: 'EMERGENCY_BUTTON',
    status: 'CONFIRMED_FALL',
    occurredAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    reviewedBy: 'pablo@demo.local',
    reviewedAt: new Date(Date.now() - 1.917 * 60 * 60000).toISOString(),
    reviewComment: 'Se llamó al 112 y se atendió.'
  },
  {
    id: '3',
    deviceId: 'ESP32-002',
    deviceAlias: 'Dormitorio (Casa Antonio)',
    patientName: 'Antonio Pérez',
    eventType: 'SIMULATED',
    status: 'FALSE_ALARM',
    occurredAt: new Date(Date.now() - 27 * 60 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 27 * 60 * 60000).toISOString(),
    reviewedBy: 'lucia@demo.local',
    reviewedAt: new Date(Date.now() - 26.917 * 60 * 60000).toISOString(),
    reviewComment: 'Era una prueba.'
  },
  {
    id: '4',
    deviceId: 'ESP32-002',
    deviceAlias: 'Dormitorio (Casa Antonio)',
    patientName: 'Antonio Pérez',
    eventType: 'FALL',
    status: 'RESOLVED',
    occurredAt: new Date(Date.now() - 30 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    reviewedBy: 'maria@demo.local',
    reviewedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    reviewComment: 'Se revisó, todo bien.'
  }
];

// Exportar para que otras rutas puedan acceder
export const getEvents = () => events;
export const setEvents = (newEvents: any[]) => {
  events = newEvents;
};

// Get all events
router.get('/', async (req, res) => {
  const result = db().query('SELECT * FROM public.events')
  res.json(result)
});

// Get events by device
router.get('/device/:deviceId', async (req, res) => {
  const result = db().query(`SELECT * FROM public.events WHERE device_id = ${req.params.deviceId}`)
  res.json(result)
});


// Get event by id
router.get('/:id', (req, res) => {
  const result = db().query(`SELECT * FROM public.events WHERE event_id = ${req.params.id}`)
  res.json(result)
});

// Create event
router.post('/', (req, res) => {
  const { deviceId, eventType, status, eventUid, ocurredAt, reviewedBy, reviewedAt, review_comment } = req.body;
  const result = db().query(`INSERT INTO public.events (event_uid, device_id, event_type, status, ocurred_at, reviewed_by, review_comment)
    values (${eventUid}, ${deviceId}, ${eventType}, ${status}, ${ocurredAt} ${reviewedBy}, ${reviewedAt}, ${review_comment})`)
  res.status(201).json(result)
});

export const eventsRoutes = router;

import express, { Router } from 'express';

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
    
});

// Get all events
router.get('/', (req, res) => {
  res.json(events);
});

// Get events by device
router.get('/device/:deviceId', (req, res) => {
  const deviceEvents = events.filter(e => e.deviceId === req.params.deviceId);
  res.json(deviceEvents);
});

// Get event by id
router.get('/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }
  res.json(event);
});

// Create event
router.post('/', (req, res) => {
  const { deviceId, deviceAlias, patientName, eventType, status } = req.body;

  const newEvent = {
    id: Math.random().toString(36).substr(2, 9),
    deviceId: deviceId || '',
    deviceAlias: deviceAlias || '',
    patientName: patientName || '',
    eventType: eventType || 'FALL',
    status: status || 'OPEN',
    occurredAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    reviewComment: null
  };

  events.push(newEvent);
  console.log(`📢 Nuevo evento creado: ${newEvent.id} - ${newEvent.eventType} en ${newEvent.deviceAlias}`);
  res.status(201).json(newEvent);
});

// Update event status
router.patch('/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }

  const { status, reviewedBy, reviewComment } = req.body;
  
  if (status) {
    console.log(`🔄 Evento ${event.id} actualizado: ${event.status} → ${status}`);
    event.status = status;
  }
  if (reviewedBy) {
    event.reviewedBy = reviewedBy;
    event.reviewedAt = new Date().toISOString();
  }
  if (reviewComment) {
    event.reviewComment = reviewComment;
  }

  res.json(event);
});

export const eventsRoutes = router;

import express, { Router } from 'express';

const router = Router();

// Mock users data
const users = [
  {
    id: '1',
    email: 'superadmin@demo.local',
    role: 'ADMIN',
    fullName: 'Super Admin',
    phone: '+34 600 000 001',
    isActive: true
  },
  {
    id: '2',
    email: 'maria@demo.local',
    role: 'MEMBER',
    fullName: 'María López',
    phone: '+34 600 000 002',
    isActive: true
  },
  {
    id: '3',
    email: 'pablo@demo.local',
    role: 'MEMBER',
    fullName: 'Pablo López',
    phone: '+34 600 000 003',
    isActive: true
  },
  {
    id: '4',
    email: 'lucia@demo.local',
    role: 'MEMBER',
    fullName: 'Lucía Pérez',
    phone: '+34 600 000 004',
    isActive: true
  }
];

// Get all users
router.get('/', (req, res) => {
  res.json(users);
});

// Get user by id
router.get('/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json(user);
});

// Create user
router.post('/', (req, res) => {
  const { email, fullName, phone, role, password } = req.body;

  if (!email || !fullName) {
    return res.status(400).json({ error: 'Email y nombre completo son requeridos' });
  }

  const newUser = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    fullName,
    phone: phone || '',
    role: role || 'MEMBER',
    isActive: true
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// Update user
router.put('/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  Object.assign(user, req.body);
  res.json(user);
});

// Deactivate user (soft delete)
router.patch('/:id/deactivate', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  user.isActive = false;
  res.json(user);
});

export const usersRoutes = router;

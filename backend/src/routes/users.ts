import express, { Router } from 'express';
import { db } from '../config/db';
import { hashPassword } from '../utils/password';

const router = Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const database = db;
    const users = await database.query(
      'SELECT account_id as id, email, role, full_name as "fullName", phone, created_at as "createdAt", updated_at as "updatedAt" FROM public.accounts ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Get user by id
router.get('/:id', async (req, res) => {
  try {
    const database = db;
    const users = await database.query(
      'SELECT account_id as id, email, role, full_name as "fullName", phone, created_at as "createdAt", updated_at as "updatedAt" FROM public.accounts WHERE account_id = $1',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Create user
router.post('/', async (req, res) => {
  const { email, fullName, phone, role, password } = req.body;

  if (!email || !fullName) {
    return res.status(400).json({ error: 'Email y nombre completo son requeridos' });
  }

  try {
    const database = db;
    const passwordHash = await hashPassword(password || '1234');

    const result = await database.query(
      'INSERT INTO public.accounts (email, password_hash, role, full_name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING account_id as id, email, role, full_name as "fullName", phone, created_at as "createdAt"',
      [email, passwordHash, role || 'MEMBER', fullName, phone || null]
    );

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  const { email, password ,fullName, phone, role, id } = req.body;

  try {
    const database = db;
    const passwordHash =
      typeof password === 'string' && password.length > 0
        ? await hashPassword(password)
        : null;

    // Check if user exists
    const existingUsers = await database.query(
      'SELECT account_id FROM public.accounts WHERE account_id = $1',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Update user
    const result = await database.query(
      'UPDATE public.accounts SET email = COALESCE($1, email), password_hash = COALESCE($2, password_hash) ,full_name = COALESCE($3, full_name), phone = COALESCE($4, phone), role = COALESCE($5, role), updated_at = now() WHERE account_id = $6 RETURNING account_id as id, email, role, full_name as "fullName", phone, updated_at as "updatedAt"',
      [email, passwordHash, fullName, phone, role, id]
    );

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.post('/assign', async (req, res) => {
  const {accountId, deviceId, accessType} = req.body
  const result = await db.query(`INSERT INTO public.device_access (account_id, device_id, access_type) values ($1, $2, $3)`,[accountId, deviceId, accessType])
  res.status(201).json(result)
})


// Deactivate user (soft delete)
// Note: The accounts table doesn't have an is_active column, so this will add a comment
// If you want true soft delete, you'd need to add an is_active column to the schema
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const database = db;

    // Check if user exists
    const existingUsers = await database.query(
      'SELECT account_id as id, email, role, full_name as "fullName", phone FROM public.accounts WHERE account_id = $1',
      [req.params.id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Since there's no is_active column, we'll return the user with a note
    // In a real scenario, you'd need to add an is_active column or delete the record
    const user = existingUsers[0];

    // For now, we'll just return the user (you could add a column later)
    res.json({ ...user, isActive: false, note: 'Deactivation requires is_active column in database schema' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
});

export const usersRoutes = router;

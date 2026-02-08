import express, { Router } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { db } from '../config/db';

const router = Router();

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Query database for user by email
    const database = db;
    const users = await database.query(
      'SELECT account_id, email, password_hash, role, full_name FROM public.accounts WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const user = users[0];

    // Comparación directa de contraseña
    if (password !== user.password_hash) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const jwtSecret = (process.env.JWT_SECRET || 'dev-secret-change-me') as jwt.Secret;
    const jwtExpire: SignOptions['expiresIn'] = (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'];

    const token = jwt.sign(
      {
        sub: user.account_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name
      },
      jwtSecret,
      { expiresIn: jwtExpire }
    );

    res.json({
      token,
      user: {
        id: user.account_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout exitoso' });
});

export const authRoutes = router;

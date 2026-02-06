import express, { Router } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { db } from '../config/db';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '256181323796-i873dtd0jeccpppfq0fvbutpm7sr5aa3.apps.googleusercontent.com');

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

// Google Login
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || '256181323796-i873dtd0jeccpppfq0fvbutpm7sr5aa3.apps.googleusercontent.com',
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Token de Google inválido' });
    }

    const email = payload.email;
    const name = payload.name || '';

    // Buscar usuario en la base de datos
    let users = await db.query(
      'SELECT account_id, email, role, full_name FROM public.accounts WHERE email = $1',
      [email]
    );

    let user;

    if (users.length === 0) {
      // Crear usuario si no existe
      const result = await db.query(
        'INSERT INTO public.accounts (email, password_hash, role, full_name) VALUES ($1, $2, $3, $4) RETURNING account_id, email, role, full_name',
        [email, 'google-auth-no-password', 'MEMBER', name]
      );
      user = result[0];
    } else {
      user = users[0];
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
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Error durante la autenticación con Google' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout exitoso' });
});

export const authRoutes = router;


import express, { Router } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../config/db';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');

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

// Google Login
router.post('/google-login', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token de Google requerido' });
  }

  try {
    // Verificar el token de Google
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Token de Google inválido' });
    }

    const { email, name } = payload;

    // Buscar o crear usuario en la base de datos
    const database = db;
    let users = await database.query(
      'SELECT account_id, email, role, full_name FROM public.accounts WHERE email = $1',
      [email]
    );

    let user;
    if (users.length === 0) {
      // Crear nuevo usuario si no existe
      const newUser = await database.query(
        `INSERT INTO public.accounts (email, full_name, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING account_id, email, role, full_name`,
        [email, name, 'google-auth', 'MEMBER']
      );
      user = newUser[0];
    } else {
      user = users[0];
    }

    const jwtSecret = (process.env.JWT_SECRET || 'dev-secret-change-me') as jwt.Secret;
    const jwtExpire: SignOptions['expiresIn'] = (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'];

    const jwtToken = jwt.sign(
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
      token: jwtToken,
      user: {
        id: user.account_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ error: 'Error al verificar el token de Google' });
  }
});

export const authRoutes = router;

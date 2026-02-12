import express, { Router } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../config/db';
import { getJwtSecret } from '../config/env';
import { hashPassword, isBcryptHash, verifyPassword } from '../utils/password';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');
const JWT_SECRET = getJwtSecret() as jwt.Secret;

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contrasena son requeridos' });
  }

  try {
    const database = db;
    const users = await database.query(
      'SELECT account_id, email, password_hash, role, full_name FROM public.accounts WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Email o contrasena incorrectos' });
    }

    const user = users[0];
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email o contrasena incorrectos' });
    }

    // Progressive migration: upgrade legacy plain-text passwords to bcrypt on successful login.
    if (!isBcryptHash(user.password_hash)) {
      try {
        const migratedHash = await hashPassword(password);
        await database.query(
          'UPDATE public.accounts SET password_hash = $1, updated_at = now() WHERE account_id = $2',
          [migratedHash, user.account_id]
        );
      } catch (migrationError) {
        // Keep login successful even if migration update fails.
        console.error('Password migration warning:', migrationError);
      }
    }

    const jwtExpire: SignOptions['expiresIn'] = (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'];

    const token = jwt.sign(
      {
        sub: user.account_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name
      },
      JWT_SECRET,
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
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Token de Google invalido' });
    }

    const { email, name } = payload;

    const database = db;
    const users = await database.query(
      'SELECT account_id, email, role, full_name FROM public.accounts WHERE email = $1',
      [email]
    );

    let user;
    if (users.length === 0) {
      const generatedPassword = `google-${randomBytes(24).toString('hex')}`;
      const generatedPasswordHash = await hashPassword(generatedPassword);

      const newUser = await database.query(
        `INSERT INTO public.accounts (email, full_name, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING account_id, email, role, full_name`,
        [email, name, generatedPasswordHash, 'MEMBER']
      );
      user = newUser[0];
    } else {
      user = users[0];
    }

    const jwtExpire: SignOptions['expiresIn'] = (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'];

    const jwtToken = jwt.sign(
      {
        sub: user.account_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name
      },
      JWT_SECRET,
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

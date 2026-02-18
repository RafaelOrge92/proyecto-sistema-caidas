import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import 'dotenv/config'
import { authRoutes } from './routes/auth';
import { usersRoutes } from './routes/users';
import { devicesRoutes } from './routes/devices';
import { eventsRoutes } from './routes/events';
import { patientsRoutes } from './routes/patients';
import { chatRoutes } from './routes/chat';
import { db } from './config/db';
import { getJwtSecret } from './config/env';

const app: Express = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = getJwtSecret();
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middlewares
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true
}));

// Middleware para autenticación
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
    } catch {
      (req as any).user = null;
    }
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  const info = await db.query(
  `select
    current_user as usr,
    current_database() as db,
    inet_server_addr() as server_ip,
    inet_server_port() as server_port`
)

const c = await db.query('select count(*)::int as n from public.events')
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

import express, { Express } from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth';
import { usersRoutes } from './routes/users';
import { devicesRoutes } from './routes/devices';
import { eventsRoutes } from './routes/events';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Puerto de Vite
  credentials: true
}));

// Middleware para autenticación
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    (req as any).user = { token };
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/events', eventsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const auth_1 = require("./routes/auth");
const users_1 = require("./routes/users");
const devices_1 = require("./routes/devices");
const events_1 = require("./routes/events");
const patients_1 = require("./routes/patients");
const chat_1 = require("./routes/chat");
const grafana_1 = require("./routes/grafana");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = (0, env_1.getJwtSecret)();
const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const isMobileDevOrigin = (origin) => {
    if (origin.startsWith('exp://'))
        return true;
    return /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
};
// Middlewares
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || isMobileDevOrigin(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true
}));
// Middleware para autenticación
app.use((req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.user = decoded;
        }
        catch {
            req.user = null;
        }
    }
    next();
});
// Routes
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/users', users_1.usersRoutes);
app.use('/api/devices', devices_1.devicesRoutes);
app.use('/api/events', events_1.eventsRoutes);
app.use('/api/patients', patients_1.patientsRoutes);
app.use('/api/chat', chat_1.chatRoutes);
app.use('/api/grafana', grafana_1.grafanaRoutes);
// Health check
app.get('/api/health', async (req, res) => {
    const info = await db_1.db.query(`select
    current_user as usr,
    current_database() as db,
    inet_server_addr() as server_ip,
    inet_server_port() as server_port`);
    const c = await db_1.db.query('select count(*)::int as n from public.events');
    res.json({ status: 'ok' });
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map
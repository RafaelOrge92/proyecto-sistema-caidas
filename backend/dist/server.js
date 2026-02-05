"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = require("./routes/auth");
const users_1 = require("./routes/users");
const devices_1 = require("./routes/devices");
const events_1 = require("./routes/events");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middlewares
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173', // Puerto de Vite
    credentials: true
}));
// Middleware para autenticación
app.use((req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
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
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map
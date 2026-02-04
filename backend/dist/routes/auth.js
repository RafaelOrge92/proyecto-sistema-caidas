"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
// Mock users database - En producción usar PostgreSQL
const users = [
    {
        id: '1',
        email: 'superadmin@demo.local',
        password: '1234', // En producción usar bcrypt
        role: 'ADMIN',
        fullName: 'Super Admin'
    },
    {
        id: '2',
        email: 'maria@demo.local',
        password: '1234',
        role: 'MEMBER',
        fullName: 'María López'
    },
    {
        id: '3',
        email: 'pablo@demo.local',
        password: '1234',
        role: 'MEMBER',
        fullName: 'Pablo López'
    },
    {
        id: '4',
        email: 'lucia@demo.local',
        password: '1234',
        role: 'MEMBER',
        fullName: 'Lucía Pérez'
    }
];
// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    // Generar token (en producción usar JWT)
    const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64');
    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName
        }
    });
});
// Logout
router.post('/logout', (req, res) => {
    res.json({ message: 'Logout exitoso' });
});
exports.authRoutes = router;
//# sourceMappingURL=auth.js.map
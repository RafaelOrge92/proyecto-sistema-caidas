"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const router = (0, express_1.Router)();
// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Query database for user by email
        const database = (0, db_1.db)();
        const users = await database.query('SELECT account_id, email, password_hash, role, full_name FROM public.accounts WHERE email = $1', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }
        const user = users[0];
        // Comparación directa de contraseña
        if (password !== user.password_hash) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }
        const jwtSecret = (process.env.JWT_SECRET || 'dev-secret-change-me');
        const jwtExpire = (process.env.JWT_EXPIRE || '7d');
        const token = jsonwebtoken_1.default.sign({
            sub: user.account_id,
            email: user.email,
            role: user.role,
            fullName: user.full_name
        }, jwtSecret, { expiresIn: jwtExpire });
        res.json({
            token,
            user: {
                id: user.account_id,
                email: user.email,
                role: user.role,
                fullName: user.full_name
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Logout
router.post('/logout', (req, res) => {
    res.json({ message: 'Logout exitoso' });
});
exports.authRoutes = router;
//# sourceMappingURL=auth.js.map
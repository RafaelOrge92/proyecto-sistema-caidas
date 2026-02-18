"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const google_auth_library_1 = require("google-auth-library");
const db_1 = require("../config/db");
const env_1 = require("../config/env");
const password_1 = require("../utils/password");
const router = (0, express_1.Router)();
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');
const JWT_SECRET = (0, env_1.getJwtSecret)();
// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contrasena son requeridos' });
    }
    try {
        const database = db_1.db;
        const users = await database.query('SELECT account_id, email, password_hash, role, full_name FROM public.accounts WHERE email = $1', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Email o contrasena incorrectos' });
        }
        const user = users[0];
        const isValidPassword = await (0, password_1.verifyPassword)(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Email o contrasena incorrectos' });
        }
        // Progressive migration: upgrade legacy plain-text passwords to bcrypt on successful login.
        if (!(0, password_1.isBcryptHash)(user.password_hash)) {
            try {
                const migratedHash = await (0, password_1.hashPassword)(password);
                await database.query('UPDATE public.accounts SET password_hash = $1, updated_at = now() WHERE account_id = $2', [migratedHash, user.account_id]);
            }
            catch (migrationError) {
                // Keep login successful even if migration update fails.
                console.error('Password migration warning:', migrationError);
            }
        }
        const jwtExpire = (process.env.JWT_EXPIRE || '7d');
        const token = jsonwebtoken_1.default.sign({
            sub: user.account_id,
            email: user.email,
            role: user.role,
            fullName: user.full_name
        }, JWT_SECRET, { expiresIn: jwtExpire });
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
        const database = db_1.db;
        const users = await database.query('SELECT account_id, email, role, full_name FROM public.accounts WHERE email = $1', [email]);
        let user;
        if (users.length === 0) {
            const generatedPassword = `google-${(0, crypto_1.randomBytes)(24).toString('hex')}`;
            const generatedPasswordHash = await (0, password_1.hashPassword)(generatedPassword);
            const newUser = await database.query(`INSERT INTO public.accounts (email, full_name, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING account_id, email, role, full_name`, [email, name, generatedPasswordHash, 'MEMBER']);
            user = newUser[0];
        }
        else {
            user = users[0];
        }
        const jwtExpire = (process.env.JWT_EXPIRE || '7d');
        const jwtToken = jsonwebtoken_1.default.sign({
            sub: user.account_id,
            email: user.email,
            role: user.role,
            fullName: user.full_name
        }, JWT_SECRET, { expiresIn: jwtExpire });
        res.json({
            token: jwtToken,
            user: {
                id: user.account_id,
                email: user.email,
                role: user.role,
                fullName: user.full_name
            }
        });
    }
    catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ error: 'Error al verificar el token de Google' });
    }
});
exports.authRoutes = router;
//# sourceMappingURL=auth.js.map
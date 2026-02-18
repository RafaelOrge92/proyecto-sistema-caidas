"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devicesRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const deviceAuth_1 = require("../middleware/deviceAuth");
const router = (0, express_1.Router)();
//get all devices
router.get('/', auth_1.authenticateToken, async (req, res) => {
    if (!req.user?.sub) {
        return res.status(401).json({ error: 'Token requerido' });
    }
    // ADMIN: lista completa con metadatos de asignacion.
    if (req.user.role === 'ADMIN') {
        const result = await db_1.db.query(`
      SELECT
        d.device_id,
        d.patient_id,
        d.alias,
        d.is_active,
        d.last_seen_at,
        d.created_at,
        d.updated_at,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_full_name,
        MIN(a.account_id::text) AS assigned_user_id,
        MIN(a.full_name) AS assigned_user_name,
        MIN(a.email) AS assigned_user_email
      FROM public.devices d
      LEFT JOIN public.patients p ON p.patient_id = d.patient_id
      LEFT JOIN public.device_access da ON d.device_id = da.device_id AND da.access_type = 'MEMBER'
      LEFT JOIN public.accounts a ON da.account_id = a.account_id
      GROUP BY
        d.device_id,
        d.patient_id,
        d.alias,
        d.is_active,
        d.last_seen_at,
        d.created_at,
        d.updated_at,
        p.first_name,
        p.last_name
      ORDER BY d.created_at DESC
    `);
        return res.json(result);
    }
    // MEMBER/otros: solo dispositivos accesibles por device_access.
    const result = await db_1.db.query(`
      SELECT
        d.device_id,
        d.patient_id,
        d.alias,
        d.is_active,
        d.last_seen_at,
        d.created_at,
        d.updated_at,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_full_name
      FROM public.devices d
      INNER JOIN public.device_access da ON da.device_id = d.device_id
      LEFT JOIN public.patients p ON p.patient_id = d.patient_id
      WHERE da.account_id = $1
      GROUP BY
        d.device_id,
        d.patient_id,
        d.alias,
        d.is_active,
        d.last_seen_at,
        d.created_at,
        d.updated_at,
        p.first_name,
        p.last_name
      ORDER BY d.created_at DESC
    `, [req.user.sub]);
    return res.json(result);
});
// Get available devices (not assigned to any user)
router.get('/available', auth_1.authenticateToken, async (req, res) => {
    try {
        const result = await db_1.db.query(`
      SELECT
        d.*,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_full_name
      FROM public.devices d
      LEFT JOIN public.patients p ON p.patient_id = d.patient_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.device_access da WHERE da.device_id = d.device_id
      )
      ORDER BY d.created_at DESC
    `);
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching available devices:', error);
        res.status(500).json({ error: 'Error al obtener dispositivos disponibles' });
    }
});
// Assign device to the current user
router.post('/:deviceId/assign-me', auth_1.authenticateToken, async (req, res) => {
    const deviceId = req.params.deviceId;
    const accountId = req.user?.sub;
    if (!accountId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    if (!deviceId) {
        return res.status(400).json({ error: 'deviceId es requerido' });
    }
    try {
        const deviceExists = await db_1.db.query('SELECT device_id FROM public.devices WHERE device_id = $1', [deviceId]);
        if (deviceExists.length === 0) {
            return res.status(404).json({ error: 'Dispositivo no encontrado' });
        }
        const alreadyAssigned = await db_1.db.query('SELECT 1 FROM public.device_access WHERE device_id = $1 LIMIT 1', [deviceId]);
        if (alreadyAssigned.length > 0) {
            return res.status(409).json({ error: 'El dispositivo ya esta asignado' });
        }
        const result = await db_1.db.query(`INSERT INTO public.device_access (account_id, device_id, access_type)
       VALUES ($1, $2, 'MEMBER')
       RETURNING account_id, device_id, access_type`, [accountId, deviceId]);
        return res.status(201).json(result[0]);
    }
    catch (error) {
        console.error('Error assigning device to user:', error);
        return res.status(500).json({ error: 'Error al asignar dispositivo' });
    }
});
router.get('/podium', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    const result = await db_1.db.query('SELECT COUNT(event_id), device_id FROM public.events GROUP BY device_id ');
    res.json(result);
});
// Get device by id
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    if (!req.user?.sub) {
        return res.status(401).json({ error: 'Token requerido' });
    }
    const id = req.params.id;
    // ADMIN puede consultar cualquier dispositivo.
    if (req.user.role === 'ADMIN') {
        const result = await db_1.db.query(`
      SELECT
        d.*,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_full_name
      FROM public.devices d
      LEFT JOIN public.patients p ON p.patient_id = d.patient_id
      WHERE d.device_id = $1
    `, [id]);
        return res.json(result);
    }
    // MEMBER/otros: solo si tiene acceso al dispositivo.
    const result = await db_1.db.query(`
      SELECT
        d.*,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_full_name
      FROM public.devices d
      INNER JOIN public.device_access da ON da.device_id = d.device_id
      LEFT JOIN public.patients p ON p.patient_id = d.patient_id
      WHERE d.device_id = $1 AND da.account_id = $2
      LIMIT 1
    `, [id, req.user.sub]);
    if (result.length === 0) {
        return res.status(403).json({ error: 'No tienes permiso para ver este dispositivo' });
    }
    return res.json(result);
});
router.get('/user/:userId', auth_1.authenticateToken, async (req, res) => {
    // Permitir que ADMIN vea cualquier usuario, o que el usuario vea sus propios dispositivos
    const userId = req.params.userId;
    if (req.user?.role !== 'ADMIN' && req.user?.sub !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para ver los dispositivos de otro usuario' });
    }
    const result = await db_1.db.query(`SELECT * FROM public.devices WHERE device_id IN (SELECT device_id FROM public.device_access WHERE account_id = $1)`, [userId]);
    res.json(result);
});
// Create device
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    const { id, alias, patientId, active, lastSeenAt } = req.body;
    if (!id) {
        return res.status(400).json({ error: 'ID del dispositivo es requerido' });
    }
    try {
        const result = await db_1.db.query(`INSERT into public.devices (device_id, patient_id, alias, is_active, last_seen_at)
      values ($1, $2, $3, $4, $5)`, [id, patientId || null, alias || null, active ?? true, lastSeenAt || null]);
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Error creating device:', error);
        // Error de duplicate key constraint (El dispositivo ya existe)
        if (error?.code === '23505' && error?.constraint === 'devices_pkey') {
            return res.status(409).json({ error: `El dispositivo con ID '${id}' ya existe.` });
        }
        // Si el error es por patient_id NOT NULL
        if (error?.message?.includes('patient_id')) {
            return res.status(400).json({ error: 'patient_id debe ser nullable en la base de datos. Ejecuta: ALTER TABLE public.devices ALTER COLUMN patient_id DROP NOT NULL;' });
        }
        res.status(500).json({ error: 'Error al crear dispositivo' });
    }
});
const handleHeartbeat = async (req, res) => {
    const timestamp = req.body?.timestamp ?? req.body?.lastSeenAt ?? req.body?.last_seen_at ?? null;
    const authenticatedDeviceId = req.deviceIdAuth;
    const payloadDeviceId = req.body?.deviceId ?? req.body?.id ?? req.body?.device_id;
    const deviceId = authenticatedDeviceId ?? payloadDeviceId;
    if (!deviceId) {
        return res.status(400).json({ error: 'deviceId es requerido' });
    }
    if (payloadDeviceId && authenticatedDeviceId && payloadDeviceId !== authenticatedDeviceId) {
        return res.status(400).json({ error: 'deviceId del body no coincide con dispositivo autenticado' });
    }
    try {
        const result = await db_1.db.query(`UPDATE public.devices SET last_seen_at = COALESCE($1::timestamptz, now()) WHERE device_id = $2`, [timestamp, deviceId]);
        res.json(result);
    }
    catch (error) {
        console.error('Cannot access device');
        res.status(500).json({ error: 'No se puede acceder al dispositivo' });
    }
};
// Update device (alias, patientId, etc.)
router.put('/:deviceId', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    const deviceId = req.params.deviceId;
    const { alias, patientId, isActive } = req.body;
    if (!deviceId) {
        return res.status(400).json({ error: 'deviceId es requerido' });
    }
    try {
        // Verificar que el dispositivo existe
        const existingDevice = await db_1.db.query(`SELECT device_id FROM public.devices WHERE device_id = $1 LIMIT 1`, [deviceId]);
        if (existingDevice.length === 0) {
            return res.status(404).json({ error: 'Dispositivo no encontrado' });
        }
        // Verificar que el paciente existe si se proporciona uno
        if (patientId) {
            const patientExists = await db_1.db.query(`SELECT patient_id FROM public.patients WHERE patient_id = $1 LIMIT 1`, [patientId]);
            if (patientExists.length === 0) {
                return res.status(404).json({ error: 'Paciente no encontrado' });
            }
        }
        // Actualizar el dispositivo
        const result = await db_1.db.query(`UPDATE public.devices 
       SET alias = COALESCE($1, alias),
           patient_id = CASE WHEN $2::uuid IS NOT NULL THEN $2::uuid ELSE patient_id END,
           is_active = COALESCE($3, is_active),
           updated_at = now()
       WHERE device_id = $4
       RETURNING 
         device_id,
         patient_id,
         alias,
         is_active,
         last_seen_at,
         created_at,
         updated_at`, [alias || null, patientId || null, isActive !== undefined ? isActive : null, deviceId]);
        if (result.length === 0) {
            return res.status(500).json({ error: 'No se pudo actualizar el dispositivo' });
        }
        res.json(result[0]);
    }
    catch (error) {
        console.error('Error updating device:', error);
        res.status(500).json({ error: 'Error al actualizar dispositivo' });
    }
});
router.put('/heartbeat', deviceAuth_1.authenticateDevice, handleHeartbeat);
router.post('/heartbeat', deviceAuth_1.authenticateDevice, handleHeartbeat);
exports.devicesRoutes = router;
//# sourceMappingURL=devices.js.map
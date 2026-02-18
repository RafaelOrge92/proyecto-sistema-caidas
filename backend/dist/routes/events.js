"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const deviceAuth_1 = require("../middleware/deviceAuth");
const discordWebhook_1 = require("../utils/discordWebhook");
const router = (0, express_1.Router)();
const isMissingColumnError = (error, column) => error?.code === '42703' && String(error?.message || '').includes(column);
const EVENTS_SELECT_FIELDS = `
  SELECT
    e.*,
    d.alias AS device_alias,
    p.patient_id AS patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_full_name,
    a.full_name AS reviewed_by_name
`;
const EVENTS_BASE_FROM = `
  FROM public.events e
  LEFT JOIN public.devices d ON d.device_id = e.device_id
  LEFT JOIN public.patients p ON p.patient_id = d.patient_id
  LEFT JOIN public.accounts a ON a.account_id = e.reviewed_by
`;
/**
 * Verifica si un usuario tiene acceso a un dispositivo
 */
const userHasDeviceAccess = async (userId, deviceId) => {
    const result = await db_1.db.query('SELECT COUNT(*) as count FROM public.device_access WHERE account_id = $1 AND device_id = $2', [userId, deviceId]);
    return result[0]?.count > 0;
};
const isDuplicateEventUidError = (error) => error?.code === '23505' && String(error?.constraint || '').includes('events_event_uid_key');
const getEventSummaryByUid = async (eventUid) => {
    try {
        const rows = await db_1.db.query(`SELECT
         event_id::text as event_id,
         event_uid::text as event_uid,
         device_id,
         event_type,
         status,
         occurred_at
       FROM public.events
       WHERE event_uid::text = $1
       LIMIT 1`, [eventUid]);
        return rows[0] || null;
    }
    catch (error) {
        if (isMissingColumnError(error, 'event_id')) {
            const fallback = await db_1.db.query(`SELECT
           id::text as event_id,
           event_uid::text as event_uid,
           device_id,
           event_type,
           status,
           occurred_at
         FROM public.events
         WHERE event_uid::text = $1
         LIMIT 1`, [eventUid]);
            return fallback[0] || null;
        }
        throw error;
    }
};
const getEventSummaryByIdentifier = async (eventIdOrUid) => {
    try {
        const rows = await db_1.db.query(`SELECT
         event_id::text as event_id,
         event_uid::text as event_uid,
         device_id,
         event_type,
         status,
         occurred_at
       FROM public.events
       WHERE event_id::text = $1 OR event_uid::text = $1
       LIMIT 1`, [eventIdOrUid]);
        return rows[0] || null;
    }
    catch (error) {
        if (isMissingColumnError(error, 'event_id')) {
            const fallback = await db_1.db.query(`SELECT
           id::text as event_id,
           event_uid::text as event_uid,
           device_id,
           event_type,
           status,
           occurred_at
         FROM public.events
         WHERE id::text = $1 OR event_uid::text = $1
         LIMIT 1`, [eventIdOrUid]);
            return fallback[0] || null;
        }
        throw error;
    }
};
const getEventSamplesByEvent = async (eventId, eventUid) => {
    try {
        const rows = await db_1.db.query(`SELECT seq, t_ms, acc_x, acc_y, acc_z
       FROM public.event_samples
       WHERE event_id::text = $1
       ORDER BY seq ASC`, [eventId]);
        return rows.map((row) => ({
            seq: Number(row.seq),
            t_ms: Number(row.t_ms),
            acc_x: Number(row.acc_x),
            acc_y: Number(row.acc_y),
            acc_z: Number(row.acc_z)
        }));
    }
    catch (error) {
        if (!isMissingColumnError(error, 'event_id')) {
            throw error;
        }
        if (!eventUid) {
            return [];
        }
        try {
            const fallback = await db_1.db.query(`SELECT seq, t_ms, acc_x, acc_y, acc_z
         FROM public.event_samples
         WHERE event_uid::text = $1
         ORDER BY seq ASC`, [eventUid]);
            return fallback.map((row) => ({
                seq: Number(row.seq),
                t_ms: Number(row.t_ms),
                acc_x: Number(row.acc_x),
                acc_y: Number(row.acc_y),
                acc_z: Number(row.acc_z)
            }));
        }
        catch (fallbackError) {
            if (isMissingColumnError(fallbackError, 'event_uid')) {
                return [];
            }
            throw fallbackError;
        }
    }
};
// Get all events
router.get('/', auth_1.authenticateToken, async (req, res) => {
    if (!req.user?.sub) {
        return res.status(401).json({ error: 'Token requerido' });
    }
    const parsePositiveInt = (value, fallback) => {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
    };
    const hasPaginationParams = req.query.page !== undefined || req.query.pageSize !== undefined;
    const requestedPage = parsePositiveInt(req.query.page, 1);
    const requestedPageSize = parsePositiveInt(req.query.pageSize, 20);
    const pageSize = Math.min(requestedPageSize, 100);
    const whereClauses = [];
    const joins = [];
    const params = [];
    if (req.user.role !== 'ADMIN') {
        joins.push('INNER JOIN public.device_access da ON da.device_id = e.device_id');
        params.push(req.user.sub);
        whereClauses.push(`da.account_id = $${params.length}`);
    }
    const joinsSql = joins.length > 0 ? `\n${joins.join('\n')}` : '';
    const whereSql = whereClauses.length > 0 ? `\nWHERE ${whereClauses.join(' AND ')}` : '';
    const orderSql = 'ORDER BY e.occurred_at DESC NULLS LAST, e.created_at DESC NULLS LAST';
    if (!hasPaginationParams) {
        const result = await db_1.db.query(`${EVENTS_SELECT_FIELDS}
       ${EVENTS_BASE_FROM}${joinsSql}${whereSql}
       ${orderSql}`, params);
        return res.json(result);
    }
    const countResult = await db_1.db.query(`SELECT COUNT(*)::int AS total
     ${EVENTS_BASE_FROM}${joinsSql}${whereSql}`, params);
    const total = Number(countResult[0]?.total ?? 0);
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * pageSize;
    const pagedParams = [...params, pageSize, offset];
    const data = await db_1.db.query(`${EVENTS_SELECT_FIELDS}
     ${EVENTS_BASE_FROM}${joinsSql}${whereSql}
     ${orderSql}
     LIMIT $${pagedParams.length - 1}
     OFFSET $${pagedParams.length}`, pagedParams);
    return res.json({
        data,
        pagination: {
            page,
            pageSize,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    });
});
// Get events by device
router.get('/device/:deviceId', auth_1.authenticateToken, async (req, res) => {
    // Permitir si es ADMIN o si el usuario tiene acceso al dispositivo
    const deviceId = req.params.deviceId;
    if (req.user?.role !== 'ADMIN') {
        const hasAccess = await userHasDeviceAccess(req.user?.sub || '', deviceId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'No tienes permiso para ver los eventos de este dispositivo' });
        }
    }
    const result = await db_1.db.query(`${EVENTS_SELECT_FIELDS}
     ${EVENTS_BASE_FROM}
     WHERE e.device_id = $1
     ORDER BY e.occurred_at DESC NULLS LAST, e.created_at DESC NULLS LAST`, [deviceId]);
    res.json(result);
});
router.get('/:id/samples', auth_1.authenticateToken, async (req, res) => {
    if (!req.user?.sub) {
        return res.status(401).json({ error: 'Token requerido' });
    }
    const id = req.params.id;
    try {
        const targetEvent = await getEventSummaryByIdentifier(id);
        if (!targetEvent) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        if (req.user?.role !== 'ADMIN') {
            const hasAccess = await userHasDeviceAccess(req.user.sub, targetEvent.device_id);
            if (!hasAccess) {
                return res.status(403).json({ error: 'No tienes permiso para ver las muestras de este evento' });
            }
        }
        const samples = await getEventSamplesByEvent(targetEvent.event_id, targetEvent.event_uid);
        return res.json(samples);
    }
    catch (error) {
        console.error('Error fetching event samples:', error);
        return res.status(500).json({ error: 'Error al obtener muestras del evento' });
    }
});
// Get event by id
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    const id = req.params.id;
    try {
        const result = await db_1.db.query(`${EVENTS_SELECT_FIELDS}
       ${EVENTS_BASE_FROM}
       WHERE e.event_id::text = $1 OR e.event_uid::text = $1`, [id]);
        // Verificar acceso si no es ADMIN
        if (result.length > 0 && req.user?.role !== 'ADMIN') {
            const event = result[0];
            const hasAccess = await userHasDeviceAccess(req.user?.sub || '', event.device_id);
            if (!hasAccess) {
                return res.status(403).json({ error: 'No tienes permiso para ver este evento' });
            }
        }
        return res.json(result);
    }
    catch (error) {
        if (error?.code === '42703' && String(error?.message || '').includes('event_id')) {
            const fallback = await db_1.db.query(`${EVENTS_SELECT_FIELDS}
         ${EVENTS_BASE_FROM}
         WHERE e.id::text = $1 OR e.event_uid::text = $1`, [id]);
            // Verificar acceso si no es ADMIN
            if (fallback.length > 0 && req.user?.role !== 'ADMIN') {
                const event = fallback[0];
                const hasAccess = await userHasDeviceAccess(req.user?.sub || '', event.device_id);
                if (!hasAccess) {
                    return res.status(403).json({ error: 'No tienes permiso para ver este evento' });
                }
            }
            return res.json(fallback);
        }
        console.error('Error fetching event by id:', error);
        return res.status(500).json({ error: 'Error al obtener el evento' });
    }
});
router.put('/update', auth_1.authenticateToken, async (req, res) => {
    const id = req.body?.id;
    const status = req.body?.status;
    const isAdmin = req.user?.role === 'ADMIN';
    const requesterId = req.user?.sub ?? null;
    const reviewedBy = (isAdmin
        ? (req.body?.reviewedBy ?? req.body?.reviewed_by ?? requesterId ?? null)
        : requesterId);
    const reviewedAt = (isAdmin
        ? (req.body?.reviewedAt ?? req.body?.reviewed_at ?? new Date().toISOString())
        : new Date().toISOString());
    const rawReviewComment = req.body?.review_comment ?? req.body?.reviewComment ?? null;
    const reviewComment = typeof rawReviewComment === 'string'
        ? (rawReviewComment.trim().slice(0, 255) || null)
        : rawReviewComment;
    if (!req.user?.sub) {
        return res.status(401).json({ error: 'Token requerido' });
    }
    if (!id || !status) {
        return res.status(400).json({ error: 'id y status son requeridos' });
    }
    try {
        const targetEvent = await getEventSummaryByIdentifier(id);
        if (!targetEvent) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        if (!isAdmin) {
            const hasAccess = await userHasDeviceAccess(req.user.sub, targetEvent.device_id);
            if (!hasAccess) {
                return res.status(403).json({ error: 'No tienes permiso para revisar este evento' });
            }
        }
    }
    catch (error) {
        console.error('Error checking event access:', error);
        return res.status(500).json({ error: 'Error validando permisos del evento' });
    }
    try {
        const result = await db_1.db.query(`UPDATE public.events
       SET status = $1,
           reviewed_by = COALESCE($2::uuid, reviewed_by),
           reviewed_at = COALESCE($3::timestamptz, reviewed_at, now()),
           review_comment = $4
       WHERE event_id::text = $5 OR event_uid::text = $5
       RETURNING *`, [status, reviewedBy, reviewedAt, reviewComment, id]);
        res.json(result);
    }
    catch (error) {
        if (error?.code === '22P02') {
            return res.status(400).json({ error: 'status o reviewedBy inválido' });
        }
        if (isMissingColumnError(error, 'event_id')) {
            const fallback = await db_1.db.query(`UPDATE public.events
         SET status = $1,
             reviewed_by = COALESCE($2::uuid, reviewed_by),
             reviewed_at = COALESCE($3::timestamptz, reviewed_at, now()),
             review_comment = $4
         WHERE id::text = $5 OR event_uid::text = $5
         RETURNING *`, [status, reviewedBy, reviewedAt, reviewComment, id]);
            return res.json(fallback);
        }
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Error al actualizar el evento' });
    }
});
router.post('/ingest', deviceAuth_1.authenticateDevice, async (req, res) => {
    const authenticatedDeviceId = req.deviceIdAuth;
    const payloadDeviceId = req.body?.deviceId ?? req.body?.device_id;
    const deviceId = authenticatedDeviceId ?? payloadDeviceId;
    const eventUid = req.body?.eventUid ?? req.body?.event_uid;
    const eventType = req.body?.eventType ?? req.body?.event_type;
    const eventOccurredAt = req.body?.occurredAt ?? req.body?.ocurredAt ?? req.body?.occurred_at ?? null;
    if (!deviceId || !eventUid || !eventType) {
        return res.status(400).json({ error: 'deviceId, eventUid y eventType son requeridos' });
    }
    if (payloadDeviceId && authenticatedDeviceId && payloadDeviceId !== authenticatedDeviceId) {
        return res.status(400).json({ error: 'deviceId del body no coincide con dispositivo autenticado' });
    }
    try {
        const result = await db_1.db.query(`INSERT INTO public.events (event_uid, device_id, event_type, occurred_at) 
       VALUES($1, $2, $3, COALESCE($4::timestamptz, now()))
       RETURNING event_id::text as event_id, event_uid::text as event_uid, status, occurred_at`, [eventUid, deviceId, eventType, eventOccurredAt]);
        const createdEvent = result[0];
        void (0, discordWebhook_1.sendDiscordEventNotification)({
            eventId: createdEvent?.event_id ?? null,
            eventUid: createdEvent?.event_uid ?? eventUid,
            deviceId,
            eventType,
            status: createdEvent?.status ?? 'OPEN',
            occurredAt: createdEvent?.occurred_at ? new Date(createdEvent.occurred_at).toISOString() : eventOccurredAt,
            source: 'INGEST'
        });
        return res.status(201).json(result);
    }
    catch (error) {
        if (isDuplicateEventUidError(error)) {
            const existingEvent = await getEventSummaryByUid(String(eventUid));
            return res.status(200).json(existingEvent ? [existingEvent] : []);
        }
        console.error('Error ingesting event:', error);
        return res.status(500).json({ error: 'Error al guardar el evento' });
    }
});
router.post('/samples', deviceAuth_1.authenticateDevice, async (req, res) => {
    const authenticatedDeviceId = req.deviceIdAuth;
    const eventUid = req.body?.eventUid ?? req.body?.event_uid;
    const samples = Array.isArray(req.body?.samples)
        ? req.body.samples
        : (Array.isArray(req.body) ? req.body : []);
    if (!eventUid) {
        return res.status(400).json({ error: 'eventUid es requerido' });
    }
    if (!Array.isArray(samples) || samples.length === 0) {
        return res.status(201).json([]);
    }
    try {
        let eventId = null;
        try {
            const event = await db_1.db.query(`SELECT event_id::text as event_id, device_id FROM public.events WHERE event_uid::text = $1 LIMIT 1`, [eventUid]);
            eventId = event[0]?.event_id ?? null;
            if (authenticatedDeviceId && event[0]?.device_id && event[0].device_id !== authenticatedDeviceId) {
                return res.status(403).json({ error: 'Evento no pertenece al dispositivo autenticado' });
            }
        }
        catch (error) {
            if (isMissingColumnError(error, 'event_id')) {
                const fallback = await db_1.db.query(`SELECT id::text as event_id, device_id FROM public.events WHERE event_uid::text = $1 LIMIT 1`, [eventUid]);
                eventId = fallback[0]?.event_id ?? null;
                if (authenticatedDeviceId && fallback[0]?.device_id && fallback[0].device_id !== authenticatedDeviceId) {
                    return res.status(403).json({ error: 'Evento no pertenece al dispositivo autenticado' });
                }
            }
            else {
                throw error;
            }
        }
        if (!eventId) {
            return res.status(404).json({ error: 'Evento no encontrado para eventUid' });
        }
        try {
            for (const sam of samples) {
                const seq = sam?.seq;
                const tMs = sam?.tMs ?? sam?.t_ms;
                const accX = sam?.accX ?? sam?.acc_x;
                const accY = sam?.accY ?? sam?.acc_y;
                const accZ = sam?.accZ ?? sam?.acc_z;
                await db_1.db.query(`INSERT INTO public.event_samples (event_id, seq, t_ms, acc_x, acc_y, acc_z)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`, [eventId, seq, tMs, accX, accY, accZ]);
            }
        }
        catch (error) {
            if (!isMissingColumnError(error, 'event_id')) {
                throw error;
            }
            for (const sam of samples) {
                const seq = sam?.seq;
                const tMs = sam?.tMs ?? sam?.t_ms;
                const accX = sam?.accX ?? sam?.acc_x;
                const accY = sam?.accY ?? sam?.acc_y;
                const accZ = sam?.accZ ?? sam?.acc_z;
                await db_1.db.query(`INSERT INTO public.event_samples (event_uid, seq, t_ms, acc_x, acc_y, acc_z)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`, [eventUid, seq, tMs, accX, accY, accZ]);
            }
        }
        return res.status(201).json([]);
    }
    catch (error) {
        console.error('Error saving event samples:', error);
        return res.status(500).json({ error: 'Error al guardar samples del evento' });
    }
});
// Create event
router.post('/', async (req, res) => {
    const deviceId = req.body?.deviceId ?? req.body?.device_id;
    const eventType = req.body?.eventType ?? req.body?.event_type;
    const status = req.body?.status ?? 'OPEN';
    const eventUid = req.body?.eventUid ?? req.body?.event_uid;
    const eventOccurredAt = req.body?.occurredAt ?? req.body?.ocurredAt ?? req.body?.occurred_at ?? null;
    const reviewedBy = req.body?.reviewedBy ?? req.body?.reviewed_by ?? null;
    const reviewedAt = req.body?.reviewedAt ?? req.body?.reviewed_at ?? null;
    const reviewComment = req.body?.review_comment ?? req.body?.reviewComment ?? null;
    if (!deviceId || !eventType || !eventUid) {
        return res.status(400).json({ error: 'deviceId, eventType y eventUid son requeridos' });
    }
    try {
        const result = await db_1.db.query(`INSERT INTO public.events (event_uid, device_id, event_type, status, occurred_at, reviewed_by, reviewed_at, review_comment)
       VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, now()), $6, $7, $8)
       RETURNING event_id::text as event_id, event_uid::text as event_uid, status, occurred_at`, [eventUid, deviceId, eventType, status, eventOccurredAt, reviewedBy, reviewedAt, reviewComment]);
        const createdEvent = result[0];
        void (0, discordWebhook_1.sendDiscordEventNotification)({
            eventId: createdEvent?.event_id ?? null,
            eventUid: createdEvent?.event_uid ?? eventUid,
            deviceId,
            eventType,
            status: createdEvent?.status ?? status,
            occurredAt: createdEvent?.occurred_at ? new Date(createdEvent.occurred_at).toISOString() : eventOccurredAt,
            source: 'API'
        });
        return res.status(201).json(result);
    }
    catch (error) {
        if (isDuplicateEventUidError(error)) {
            const existingEvent = await getEventSummaryByUid(String(eventUid));
            return res.status(200).json(existingEvent ? [existingEvent] : []);
        }
        console.error('Error creating event:', error);
        return res.status(500).json({ error: 'Error al crear el evento' });
    }
});
exports.eventsRoutes = router;
//# sourceMappingURL=events.js.map
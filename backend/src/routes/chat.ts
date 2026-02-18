import { randomUUID } from 'crypto'
import { Router } from 'express'
import { db } from '../config/db'
import { getRedisClient, isRedisConfigured, isRedisConnectionError, isRedisReady } from '../config/redis'
import { authenticateToken } from '../middleware/auth'
import { generateChatReply, LlmChatMessage } from '../utils/llmProvider'

const router = Router()

type ChatRole = 'user' | 'assistant' | 'system'

interface StoredChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  provider?: string
  model?: string
}

interface StoredSessionMeta {
  sessionId: string
  accountId: string
  title: string
  createdAt: string
  updatedAt: string
}

interface UiRouteItem {
  label: string
  path: string
}

interface ChatUiContext {
  currentPath: string
  availableRoutes: UiRouteItem[]
}

const MAX_MESSAGE_LENGTH = 1400
const MAX_MESSAGES_PER_SESSION = 200
const MAX_CONTEXT_MESSAGES = 24
const SESSION_LIMIT = 50
const RATE_LIMIT_PER_MINUTE = 30
const CHAT_UNAVAILABLE_MESSAGE = 'Chat no disponible: Redis no esta accesible en este momento'

const userSessionsKey = (accountId: string) => `chat:user:${accountId}:sessions`
const sessionMetaKey = (sessionId: string) => `chat:session:${sessionId}:meta`
const sessionMessagesKey = (sessionId: string) => `chat:session:${sessionId}:messages`
const rateLimitKey = (accountId: string) => `chat:ratelimit:${accountId}`

const ensureRedisAvailable = async (): Promise<boolean> => {
  if (!isRedisConfigured() || !isRedisReady()) {
    return false
  }
  try {
    await getRedisClient().ping()
    return true
  } catch {
    return false
  }
}

const parseStoredMessage = (raw: string): StoredChatMessage | null => {
  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.id || !parsed?.role || !parsed?.content || !parsed?.createdAt) return null
    return parsed
  } catch {
    return null
  }
}

const getSessionMeta = async (sessionId: string): Promise<StoredSessionMeta | null> => {
  const redis = getRedisClient()
  const meta = await redis.hgetall(sessionMetaKey(sessionId))
  if (!meta || Object.keys(meta).length === 0) return null

  return {
    sessionId: meta.sessionId,
    accountId: meta.accountId,
    title: meta.title || 'Nueva conversacion',
    createdAt: meta.createdAt || new Date().toISOString(),
    updatedAt: meta.updatedAt || new Date().toISOString()
  }
}

const saveSessionMeta = async (meta: StoredSessionMeta): Promise<void> => {
  const redis = getRedisClient()
  await redis.hset(sessionMetaKey(meta.sessionId), {
    sessionId: meta.sessionId,
    accountId: meta.accountId,
    title: meta.title,
    createdAt: meta.createdAt,
    updatedAt: meta.updatedAt
  })
  await redis.zadd(userSessionsKey(meta.accountId), Date.now(), meta.sessionId)
}

const getSessionMessages = async (sessionId: string): Promise<StoredChatMessage[]> => {
  const redis = getRedisClient()
  const rawMessages = await redis.lrange(sessionMessagesKey(sessionId), 0, -1)
  return rawMessages
    .map(parseStoredMessage)
    .filter((message): message is StoredChatMessage => Boolean(message))
}

const appendMessage = async (sessionId: string, message: StoredChatMessage): Promise<void> => {
  const redis = getRedisClient()
  await redis.rpush(sessionMessagesKey(sessionId), JSON.stringify(message))
  await redis.ltrim(sessionMessagesKey(sessionId), -MAX_MESSAGES_PER_SESSION, -1)
}

const sanitizeSession = (meta: StoredSessionMeta) => ({
  sessionId: meta.sessionId,
  title: meta.title,
  createdAt: meta.createdAt,
  updatedAt: meta.updatedAt
})

const parseUiContext = (raw: any): ChatUiContext => {
  const currentPathRaw = typeof raw?.currentPath === 'string' ? raw.currentPath.trim() : ''
  const currentPath = currentPathRaw.startsWith('/') ? currentPathRaw.slice(0, 120) : '/'

  const rawRoutes = Array.isArray(raw?.availableRoutes) ? raw.availableRoutes : []
  const dedup = new Set<string>()
  const availableRoutes: UiRouteItem[] = []

  for (const route of rawRoutes) {
    const label = typeof route?.label === 'string' ? route.label.trim().slice(0, 40) : ''
    const path = typeof route?.path === 'string' ? route.path.trim().slice(0, 120) : ''
    if (!label || !path || !path.startsWith('/')) continue
    if (dedup.has(path)) continue
    dedup.add(path)
    availableRoutes.push({ label, path })
    if (availableRoutes.length >= 20) break
  }

  return {
    currentPath: currentPath || '/',
    availableRoutes
  }
}

const buildUiContextText = (ui: ChatUiContext): string => {
  const lines: string[] = [`Ruta actual: ${ui.currentPath}`]
  if (ui.availableRoutes.length === 0) {
    lines.push('Rutas disponibles: no informadas por el cliente.')
    return lines.join('\n')
  }

  lines.push('Rutas disponibles:')
  for (const route of ui.availableRoutes) {
    lines.push(`- ${route.label}: ${route.path}`)
  }
  return lines.join('\n')
}

const CHAT_CONTEXT_TIME_ZONE = 'Europe/Madrid'

const formatDateTimeEs = (value: unknown): string => {
  if (!value) return 'sin fecha'
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: CHAT_CONTEXT_TIME_ZONE
  })
}

const describeEventTypeEs = (value: unknown): string => {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return 'Sin tipo'

  const normalized = raw.toUpperCase()
  return (() => {
    switch (normalized) {
      case 'EMERGENCY_BUTTON':
        return 'Boton de emergencia'
      case 'FALL':
        return 'Caida'
      case 'TILT':
        return 'Inclinacion excesiva'
      case 'SIMULATED':
        return 'Simulado'
      default:
        return normalized
    }
  })()
}

const describeEventStatusEs = (value: unknown): string => {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return 'Sin estado'

  const normalized = raw.toUpperCase()
  return (() => {
    switch (normalized) {
      case 'OPEN':
        return 'Abierto'
      case 'CONFIRMED_FALL':
        return 'Caida confirmada'
      case 'FALSE_ALARM':
        return 'Falsa alarma'
      case 'RESOLVED':
        return 'Resuelto'
      default:
        return normalized
    }
  })()
}

const formatEventSummary = (row: any): string => {
  const happenedAt = formatDateTimeEs(row?.occurred_at)
  const eventType = describeEventTypeEs(row?.event_type)
  const status = describeEventStatusEs(row?.status)
  const patient = row?.patient_name || 'Sin paciente'
  const device = row?.device_alias || 'Dispositivo sin alias'
  return `${happenedAt} | ${eventType} | ${status} | ${patient} | ${device}`
}

const formatDeviceEventsAggregate = (row: any): string => {
  const alias = row?.device_alias || 'Sin alias'
  const deviceId = row?.device_id || 'N/A'
  const eventsCount = Number(row?.events_count || 0)
  return `${alias} (${deviceId}) - ${eventsCount} eventos`
}

const buildMemberContext = async (accountId: string) => {
  const [statsRows, topDevicesRows, recentRows, newestRows, oldestRows] = await Promise.all([
    db.query(
      `SELECT
         COUNT(DISTINCT da.device_id)::int AS devices_count,
         COUNT(DISTINCT d.patient_id)::int AS patients_count,
         COUNT(*) FILTER (WHERE e.event_uid IS NOT NULL)::int AS total_events,
         COUNT(*) FILTER (WHERE e.status = 'OPEN')::int AS open_events
       FROM public.device_access da
       LEFT JOIN public.devices d ON d.device_id = da.device_id
       LEFT JOIN public.events e ON e.device_id = da.device_id
       WHERE da.account_id = $1`,
      [accountId]
    ),
    db.query(
      `SELECT
         e.device_id,
         COALESCE(d.alias, e.device_id) AS device_alias,
         COUNT(*)::int AS events_count
       FROM public.events e
       INNER JOIN public.device_access da ON da.device_id = e.device_id
       LEFT JOIN public.devices d ON d.device_id = e.device_id
       WHERE da.account_id = $1
       GROUP BY e.device_id, d.alias
       ORDER BY events_count DESC, e.device_id ASC
       LIMIT 5`,
      [accountId]
    ),
    db.query(
      `SELECT
         e.event_type,
         e.status,
         e.occurred_at,
         d.alias AS device_alias,
         CONCAT(p.first_name, ' ', p.last_name) AS patient_name
       FROM public.events e
       INNER JOIN public.device_access da ON da.device_id = e.device_id
       LEFT JOIN public.devices d ON d.device_id = e.device_id
       LEFT JOIN public.patients p ON p.patient_id = d.patient_id
       WHERE da.account_id = $1
       ORDER BY e.occurred_at DESC NULLS LAST, e.created_at DESC NULLS LAST
       LIMIT 8`,
      [accountId]
    ),
    db.query(
      `SELECT
         e.event_type,
         e.status,
         e.occurred_at,
         d.alias AS device_alias,
         CONCAT(p.first_name, ' ', p.last_name) AS patient_name
       FROM public.events e
       INNER JOIN public.device_access da ON da.device_id = e.device_id
       LEFT JOIN public.devices d ON d.device_id = e.device_id
       LEFT JOIN public.patients p ON p.patient_id = d.patient_id
       WHERE da.account_id = $1
       ORDER BY e.occurred_at DESC NULLS LAST, e.created_at DESC NULLS LAST
       LIMIT 1`,
      [accountId]
    ),
    db.query(
      `SELECT
         e.event_type,
         e.status,
         e.occurred_at,
         d.alias AS device_alias,
         CONCAT(p.first_name, ' ', p.last_name) AS patient_name
       FROM public.events e
       INNER JOIN public.device_access da ON da.device_id = e.device_id
       LEFT JOIN public.devices d ON d.device_id = e.device_id
       LEFT JOIN public.patients p ON p.patient_id = d.patient_id
       WHERE da.account_id = $1
       ORDER BY e.occurred_at ASC NULLS LAST, e.created_at ASC NULLS LAST
       LIMIT 1`,
      [accountId]
    )
  ])

  const stats = statsRows[0] || {}
  const topDevice = topDevicesRows[0]
  const newest = newestRows[0]
  const oldest = oldestRows[0]

  const topDevices = topDevicesRows.map((row: any, index: number) => `${index + 1}. ${formatDeviceEventsAggregate(row)}`)
  const recent = recentRows.map((row: any, index: number) => `${index + 1}. ${formatEventSummary(row)}`)

  return [
    `Rol: MEMBER`,
    `Dispositivos asignados: ${Number(stats.devices_count || 0)}`,
    `Pacientes asociados: ${Number(stats.patients_count || 0)}`,
    `Eventos totales visibles: ${Number(stats.total_events || 0)}`,
    `Eventos OPEN visibles: ${Number(stats.open_events || 0)}`,
    `Dispositivo con mas eventos visibles (acumulado historico): ${topDevice ? formatDeviceEventsAggregate(topDevice) : '- Sin eventos'}`,
    `Ranking visible de eventos por dispositivo (acumulado historico):`,
    ...(topDevices.length > 0 ? topDevices : ['- Sin eventos']),
    `Evento visible mas reciente (occurred_at max): ${newest ? formatEventSummary(newest) : '- Sin eventos'}`,
    `Evento visible mas antiguo (occurred_at min): ${oldest ? formatEventSummary(oldest) : '- Sin eventos'}`,
    `Ultimos eventos visibles (mas recientes primero; item 1 = mas reciente; limite 8):`,
    ...(recent.length > 0 ? recent : ['- Sin eventos'])
  ].join('\n')
}

const buildAdminContext = async () => {
  const [statsRows, topDevicesRows, recentRows, newestRows, oldestRows] = await Promise.all([
    db.query(
      `SELECT
         (SELECT COUNT(*)::int FROM public.devices) AS devices_count,
         (SELECT COUNT(*)::int FROM public.patients) AS patients_count,
         (SELECT COUNT(*)::int FROM public.events) AS total_events,
         (SELECT COUNT(*)::int FROM public.events WHERE status = 'OPEN') AS open_events`
    ),
    db.query(
      `SELECT
         e.device_id,
         COALESCE(d.alias, e.device_id) AS device_alias,
         COUNT(*)::int AS events_count
       FROM public.events e
       LEFT JOIN public.devices d ON d.device_id = e.device_id
       GROUP BY e.device_id, d.alias
       ORDER BY events_count DESC, e.device_id ASC
       LIMIT 5`
    ),
    db.query(
      `SELECT
         e.event_type,
         e.status,
         e.occurred_at,
         d.alias AS device_alias,
         CONCAT(p.first_name, ' ', p.last_name) AS patient_name
       FROM public.events e
       LEFT JOIN public.devices d ON d.device_id = e.device_id
       LEFT JOIN public.patients p ON p.patient_id = d.patient_id
       ORDER BY e.occurred_at DESC NULLS LAST, e.created_at DESC NULLS LAST
       LIMIT 8`
    ),
    db.query(
      `SELECT
         e.event_type,
         e.status,
         e.occurred_at,
         d.alias AS device_alias,
         CONCAT(p.first_name, ' ', p.last_name) AS patient_name
       FROM public.events e
       LEFT JOIN public.devices d ON d.device_id = e.device_id
       LEFT JOIN public.patients p ON p.patient_id = d.patient_id
       ORDER BY e.occurred_at DESC NULLS LAST, e.created_at DESC NULLS LAST
       LIMIT 1`
    ),
    db.query(
      `SELECT
         e.event_type,
         e.status,
         e.occurred_at,
         d.alias AS device_alias,
         CONCAT(p.first_name, ' ', p.last_name) AS patient_name
       FROM public.events e
       LEFT JOIN public.devices d ON d.device_id = e.device_id
       LEFT JOIN public.patients p ON p.patient_id = d.patient_id
       ORDER BY e.occurred_at ASC NULLS LAST, e.created_at ASC NULLS LAST
       LIMIT 1`
    )
  ])

  const stats = statsRows[0] || {}
  const topDevice = topDevicesRows[0]
  const newest = newestRows[0]
  const oldest = oldestRows[0]

  const topDevices = topDevicesRows.map((row: any, index: number) => `${index + 1}. ${formatDeviceEventsAggregate(row)}`)
  const recent = recentRows.map((row: any, index: number) => `${index + 1}. ${formatEventSummary(row)}`)

  return [
    `Rol: ADMIN`,
    `Dispositivos totales: ${Number(stats.devices_count || 0)}`,
    `Pacientes totales: ${Number(stats.patients_count || 0)}`,
    `Eventos totales: ${Number(stats.total_events || 0)}`,
    `Eventos OPEN: ${Number(stats.open_events || 0)}`,
    `Dispositivo con mas eventos del sistema (acumulado historico): ${topDevice ? formatDeviceEventsAggregate(topDevice) : '- Sin eventos'}`,
    `Ranking del sistema de eventos por dispositivo (acumulado historico):`,
    ...(topDevices.length > 0 ? topDevices : ['- Sin eventos']),
    `Evento del sistema mas reciente (occurred_at max): ${newest ? formatEventSummary(newest) : '- Sin eventos'}`,
    `Evento del sistema mas antiguo (occurred_at min): ${oldest ? formatEventSummary(oldest) : '- Sin eventos'}`,
    `Ultimos eventos del sistema (mas recientes primero; item 1 = mas reciente; limite 8):`,
    ...(recent.length > 0 ? recent : ['- Sin eventos'])
  ].join('\n')
}

const buildDomainContext = async (accountId: string, role: string): Promise<string> => {
  try {
    if (role === 'ADMIN') {
      return await buildAdminContext()
    }
    return await buildMemberContext(accountId)
  } catch (error) {
    console.error('[chat] Error construyendo contexto de dominio:', error)
    return 'No fue posible cargar contexto de dominio para esta consulta.'
  }
}

const buildSystemPrompt = (context: string, role: string, uiContext: string): string => `
Eres el asistente virtual de una plataforma de deteccion de caidas para cuidadores y administradores.
Responde SIEMPRE en espanol, de forma clara y accionable.
Nunca inventes datos. Si no tienes suficiente contexto, dilo explicitamente.
No entregues credenciales, llaves ni datos sensibles.
El usuario actual tiene rol ${role}. Respeta sus permisos y solo usa su contexto visible.
Cuando el usuario pregunte como hacer algo en la interfaz, explica pasos concretos de clics y menus.
Si sugieres una navegacion, incluye esta linea exacta: "RUTA_SUGERIDA: /ruta".
Usa solo rutas que existan en "Rutas disponibles". Si no existe, indicalo.
Para preguntas de volumen por dispositivo (mas o menos eventos), usa solo los datos de "acumulado historico".
No deduzcas conteos por dispositivo desde la lista de "Ultimos eventos".

Contexto operativo en tiempo real:
${context}

Contexto de interfaz del cliente:
${uiContext}
`.trim()

const applyRateLimit = async (accountId: string): Promise<boolean> => {
  const redis = getRedisClient()
  const key = rateLimitKey(accountId)
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, 60)
  }
  return count <= RATE_LIMIT_PER_MINUTE
}

router.get('/sessions', authenticateToken, async (req, res) => {
  if (!req.user?.sub) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  if (!isRedisConfigured()) {
    return res.status(503).json({ error: 'Chat no disponible: REDIS_URL no configurado' })
  }

  if (!(await ensureRedisAvailable())) {
    return res.status(503).json({ error: CHAT_UNAVAILABLE_MESSAGE })
  }

  try {
    const redis = getRedisClient()
    const sessionIds = await redis.zrevrange(userSessionsKey(req.user.sub), 0, SESSION_LIMIT - 1)

    if (sessionIds.length === 0) {
      return res.json([])
    }

    const pipeline = redis.pipeline()
    for (const sessionId of sessionIds) {
      pipeline.hgetall(sessionMetaKey(sessionId))
      pipeline.lindex(sessionMessagesKey(sessionId), -1)
    }

    const results = await pipeline.exec()
    const sessions = sessionIds.map((sessionId, index) => {
      const metaResult = results?.[index * 2]?.[1] as Record<string, string> | undefined
      const lastMessageRaw = results?.[index * 2 + 1]?.[1] as string | undefined
      const lastMessage = lastMessageRaw ? parseStoredMessage(lastMessageRaw) : null

      return {
        sessionId,
        title: metaResult?.title || 'Nueva conversacion',
        createdAt: metaResult?.createdAt || new Date().toISOString(),
        updatedAt: metaResult?.updatedAt || new Date().toISOString(),
        lastMessagePreview: lastMessage?.content?.slice(0, 120) || ''
      }
    })

    return res.json(sessions)
  } catch (error) {
    if (isRedisConnectionError(error)) {
      return res.status(503).json({ error: CHAT_UNAVAILABLE_MESSAGE })
    }
    console.error('[chat] Error listando sesiones:', error)
    return res.status(500).json({ error: 'No se pudieron listar las sesiones de chat' })
  }
})

router.post('/sessions', authenticateToken, async (req, res) => {
  if (!req.user?.sub) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  if (!isRedisConfigured()) {
    return res.status(503).json({ error: 'Chat no disponible: REDIS_URL no configurado' })
  }

  if (!(await ensureRedisAvailable())) {
    return res.status(503).json({ error: CHAT_UNAVAILABLE_MESSAGE })
  }

  const now = new Date().toISOString()
  const rawTitle = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  const title = (rawTitle || 'Nueva conversacion').slice(0, 80)

  const meta: StoredSessionMeta = {
    sessionId: randomUUID(),
    accountId: req.user.sub,
    title,
    createdAt: now,
    updatedAt: now
  }

  try {
    await saveSessionMeta(meta)
    return res.status(201).json(sanitizeSession(meta))
  } catch (error) {
    if (isRedisConnectionError(error)) {
      return res.status(503).json({ error: CHAT_UNAVAILABLE_MESSAGE })
    }
    console.error('[chat] Error creando sesion:', error)
    return res.status(500).json({ error: 'No se pudo crear la sesion de chat' })
  }
})

router.get('/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
  if (!req.user?.sub) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  if (!isRedisConfigured()) {
    return res.status(503).json({ error: 'Chat no disponible: REDIS_URL no configurado' })
  }

  if (!(await ensureRedisAvailable())) {
    return res.status(503).json({ error: CHAT_UNAVAILABLE_MESSAGE })
  }

  const sessionId = String(req.params.sessionId || '').trim()
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId es requerido' })
  }

  try {
    const meta = await getSessionMeta(sessionId)
    if (!meta || meta.accountId !== req.user.sub) {
      return res.status(404).json({ error: 'Sesion no encontrada' })
    }

    const messages = await getSessionMessages(sessionId)
    return res.json({
      session: sanitizeSession(meta),
      messages
    })
  } catch (error) {
    if (isRedisConnectionError(error)) {
      return res.status(503).json({ error: CHAT_UNAVAILABLE_MESSAGE })
    }
    console.error('[chat] Error obteniendo mensajes:', error)
    return res.status(500).json({ error: 'No se pudieron obtener los mensajes' })
  }
})

router.post('/message', authenticateToken, async (req, res) => {
  if (!req.user?.sub || !req.user?.role) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  if (!isRedisConfigured()) {
    return res.status(503).json({ error: 'Chat no disponible: REDIS_URL no configurado' })
  }

  if (!(await ensureRedisAvailable())) {
    return res.status(503).json({ error: CHAT_UNAVAILABLE_MESSAGE })
  }

  const content = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
  const incomingSessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : ''
  const uiContext = parseUiContext(req.body?.uiContext)

  if (!content) {
    return res.status(400).json({ error: 'message es requerido' })
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `El mensaje supera ${MAX_MESSAGE_LENGTH} caracteres` })
  }

  try {
    const allowed = await applyRateLimit(req.user.sub)
    if (!allowed) {
      return res.status(429).json({ error: 'Has superado el limite temporal del chat. Intenta de nuevo en 1 minuto.' })
    }

    let sessionMeta: StoredSessionMeta | null = null

    if (incomingSessionId) {
      sessionMeta = await getSessionMeta(incomingSessionId)
      if (!sessionMeta || sessionMeta.accountId !== req.user.sub) {
        return res.status(404).json({ error: 'Sesion no encontrada' })
      }
    } else {
      const now = new Date().toISOString()
      sessionMeta = {
        sessionId: randomUUID(),
        accountId: req.user.sub,
        title: 'Nueva conversacion',
        createdAt: now,
        updatedAt: now
      }
      await saveSessionMeta(sessionMeta)
    }

    const userMessage: StoredChatMessage = {
      id: randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    }
    await appendMessage(sessionMeta.sessionId, userMessage)

    const history = await getSessionMessages(sessionMeta.sessionId)
    if (sessionMeta.title === 'Nueva conversacion') {
      const firstUserMessage = history.find((message) => message.role === 'user')
      if (firstUserMessage) {
        sessionMeta.title = firstUserMessage.content.slice(0, 60)
      }
    }

    const context = await buildDomainContext(req.user.sub, req.user.role)
    const systemPrompt = buildSystemPrompt(context, req.user.role, buildUiContextText(uiContext))

    const llmConversation: LlmChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history
        .slice(-MAX_CONTEXT_MESSAGES)
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .map((message) => ({
          role: (message.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: message.content
        }))
    ]

    const llmResponse = await generateChatReply(llmConversation)
    const assistantMessage: StoredChatMessage = {
      id: randomUUID(),
      role: 'assistant',
      content: llmResponse.text,
      createdAt: new Date().toISOString(),
      provider: llmResponse.provider,
      model: llmResponse.model
    }

    await appendMessage(sessionMeta.sessionId, assistantMessage)

    sessionMeta.updatedAt = assistantMessage.createdAt
    await saveSessionMeta(sessionMeta)

    const allMessages = await getSessionMessages(sessionMeta.sessionId)

    return res.json({
      session: sanitizeSession(sessionMeta),
      message: assistantMessage,
      messages: allMessages
    })
  } catch (error: any) {
    if (isRedisConnectionError(error)) {
      return res.status(503).json({ error: CHAT_UNAVAILABLE_MESSAGE })
    }
    console.error('[chat] Error procesando mensaje:', error)
    return res.status(500).json({ error: error?.message || 'Error interno en el chat' })
  }
})

export const chatRoutes = router

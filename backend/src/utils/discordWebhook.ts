import { db } from '../config/db'

type EventNotificationSource = 'INGEST' | 'API'

export interface EventNotificationInput {
  eventId?: string | null
  eventUid?: string | null
  deviceId: string
  eventType: string
  status?: string | null
  occurredAt?: string | null
  source: EventNotificationSource
}

interface DeviceContext {
  deviceAlias?: string | null
  patientName?: string | null
}

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '')

const getDiscordWebhookUrl = (): string | null => {
  const value = process.env.DISCORD_WEBHOOK_URL?.trim()
  return value || null
}

const getFrontendBaseUrl = (): string | null => {
  const value = process.env.FRONTEND_URL?.trim()
  if (!value) return null
  return normalizeBaseUrl(value)
}

const getDiscordTimeoutMs = (): number => {
  const raw = Number(process.env.DISCORD_WEBHOOK_TIMEOUT_MS ?? 5000)
  if (Number.isNaN(raw) || raw <= 0) {
    return 5000
  }
  return raw
}

const getStatusColor = (status: string): number => {
  switch (status) {
    case 'OPEN':
      return 15158332
    case 'CONFIRMED_FALL':
      return 16098851
    case 'FALSE_ALARM':
      return 8421504
    case 'RESOLVED':
      return 5763719
    default:
      return 3447003
  }
}

const getSourceLabel = (source: EventNotificationSource): string =>
  source === 'INGEST' ? 'hardware/ingest' : 'api/events'

const fetchDeviceContext = async (deviceId: string): Promise<DeviceContext> => {
  try {
    const rows = await db.query(
      `SELECT
         d.alias AS "deviceAlias",
         CONCAT(p.first_name, ' ', p.last_name) AS "patientName"
       FROM public.devices d
       LEFT JOIN public.patients p ON p.patient_id = d.patient_id
       WHERE d.device_id = $1
       LIMIT 1`,
      [deviceId]
    )
    return rows[0] || {}
  } catch (error) {
    console.error('[discord] No se pudo cargar contexto del dispositivo:', error)
    return {}
  }
}

const toIsoOrNow = (value?: string | null): string => {
  if (!value) return new Date().toISOString()
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

const buildEventUrl = (eventRef: string): string | null => {
  const frontendBaseUrl = getFrontendBaseUrl()
  if (!frontendBaseUrl) return null
  return `${frontendBaseUrl}/admin/events?eventId=${encodeURIComponent(eventRef)}`
}

export const sendDiscordEventNotification = async (
  input: EventNotificationInput
): Promise<void> => {
  const webhookUrl = getDiscordWebhookUrl()
  if (!webhookUrl) return

  try {
    const context = await fetchDeviceContext(input.deviceId)
    const status = input.status || 'OPEN'
    const occurredAtIso = toIsoOrNow(input.occurredAt)
    const deviceLabel = context.deviceAlias
      ? `${context.deviceAlias} (${input.deviceId})`
      : input.deviceId
    const eventRef = input.eventId || input.eventUid || 'N/A'
    const frontendBaseUrl = getFrontendBaseUrl()
    const eventUrl =
      !frontendBaseUrl
        ? null
        : (eventRef === 'N/A'
          ? `${frontendBaseUrl}/admin/events`
          : buildEventUrl(eventRef))

    const fields: Array<{ name: string; value: string; inline: boolean }> = [
      { name: 'Paciente', value: context.patientName || 'Sin paciente asignado', inline: true },
      { name: 'Dispositivo', value: deviceLabel, inline: true },
      { name: 'Tipo', value: input.eventType, inline: true },
      { name: 'Estado', value: status, inline: true },
      { name: 'Ocurrido', value: occurredAtIso, inline: false },
      { name: 'Origen', value: getSourceLabel(input.source), inline: true },
      { name: 'Event UID', value: input.eventUid || 'N/A', inline: false }
    ]

    if (eventUrl) {
      fields.push({ name: 'Panel', value: `[Abrir evento](${eventUrl})`, inline: false })
    }

    const payload = {
      username: 'Fall Detect',
      embeds: [
        {
          title: 'Nuevo evento detectado',
          color: getStatusColor(status),
          fields,
          timestamp: new Date().toISOString(),
          footer: {
            text: `event_ref: ${eventRef}`
          }
        }
      ]
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), getDiscordTimeoutMs())

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      if (!response.ok) {
        const body = await response.text()
        console.error(`[discord] Webhook respondio ${response.status}: ${body}`)
      }
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    console.error('[discord] Error enviando notificacion de evento:', error)
  }
}

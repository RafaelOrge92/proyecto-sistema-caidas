import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL?.trim() || ''

let redisClient: Redis | null = null

if (redisUrl) {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    retryStrategy: (times) => {
      if (times > 12) return null
      return Math.min(times * 200, 2000)
    }
  })

  redisClient.on('connect', () => {
    console.log('[redis] Conectado')
  })

  redisClient.on('error', (error) => {
    console.error('[redis] Error:', error?.message || error)
  })
}

export const isRedisConfigured = (): boolean => Boolean(redisClient)
export const isRedisReady = (): boolean => Boolean(redisClient && redisClient.status === 'ready')

export const isRedisConnectionError = (error: any): boolean => {
  const message = String(error?.message || error || '')
  return (
    message.includes('max retries per request limit') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT') ||
    message.includes('Connection is closed') ||
    message.includes('enableOfflineQueue') ||
    message.includes('Stream isn\'t writeable')
  )
}

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('[redis] REDIS_URL no configurado')
  }
  return redisClient
}

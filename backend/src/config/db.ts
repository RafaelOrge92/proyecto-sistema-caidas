import pg from 'pg'
const { Pool } = pg

// Pool único para toda la app (NO crear uno por query)
const pool = new Pool({
  host: 'aws-1-eu-west-1.pooler.supabase.com', // sin espacios
  port: 5432,
  database: 'postgres',
  user: 'postgres.hkdhszhqwcereylipjuc',
  password: 'hB8nRQmpZOPXaV2E', // mejor mover a .env (abajo te dejo cómo)
  ssl: { rejectUnauthorized: false }, // necesario casi siempre en Supabase
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

export const db = {
  // Para queries normales
  query: async (sql: string, params: any[] = []) => {
    const result = await pool.query(sql, params)
    return result.rows
  },

  // Para transacciones (IMPORTANTE: siempre llamar a release())
  getClient: async () => {
    return await pool.connect()
  },
}
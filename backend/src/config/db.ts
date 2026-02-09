import pg from 'pg'
const { Pool } = pg

// Pool único para toda la app (NO crear uno por query)
const pool = new Pool({
  host: process.env.DB_HOST, // sin espacios
  port: Number(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // mejor mover a .env (abajo te dejo cómo)
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
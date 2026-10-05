import pg from 'pg'
import { env, isProduction } from '../config/env.js'

const { Pool } = pg

// Singleton pattern (see Architecture doc, Figure 22): a single Pool
// instance is created here at module load, and every repository imports
// this same `pool` rather than opening its own connection. ES modules are
// cached by Node after the first import, so this file only ever runs
// once per process — that's what makes it a singleton without needing
// any extra bookkeeping.
//
// Without this, each repository creating its own pool could exhaust
// PostgreSQL's connection limit under concurrent load from all five user
// roles (see Security doc, "Database Connection Exhaustion" mitigation).
export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20, // matches maxConnections documented in the Repository/Singleton pattern diagrams
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // Azure Database for PostgreSQL enforces SSL by default (Security doc,
  // Network Security section). Local dev Postgres doesn't use SSL, so
  // this is only switched on in production.
  // Also switchable with DB_SSL=true so you can run the API locally against Azure
  // without NODE_ENV=production (which turns on secure-only cookies).
  ssl: isProduction || env.dbSsl ? { rejectUnauthorized: false } : false,
})

// Surfaces connection-level errors (e.g. the DB restarting) on the pool's
// idle clients instead of crashing the whole process silently.
pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error on idle PostgreSQL client', err)
})

// Quick startup check so a bad DATABASE_URL fails loudly at boot instead
// of surfacing as a confusing error on the first API request.
export async function verifyConnection() {
  const client = await pool.connect()
  try {
    await client.query('SELECT 1')
  } finally {
    client.release()
  }
}
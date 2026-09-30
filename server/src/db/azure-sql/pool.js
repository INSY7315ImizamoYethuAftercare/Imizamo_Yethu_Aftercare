import sql from 'mssql'
import { env, isProduction } from '../config/env.js'

// Azure SQL configuration
const config = {
  user: env.databaseUser,
  password: env.databasePassword,
  server: env.databaseServer,
  database: env.databaseName,

  options: {
    encrypt: true,
    trustServerCertificate: !isProduction,
  },

  pool: {
    max: 20,
    min: 0,
    idleTimeoutMillis: 30000,
  },

  connectionTimeout: 5000,
  requestTimeout: 30000,
}

// Singleton connection pool.
// ES modules are cached by Node.js, so this module is only
// evaluated once per process.
export const pool = new sql.ConnectionPool(config)

const poolPromise = pool.connect()

// Surfaces connection-level errors without silently
// crashing the application.
pool.on('error', (err) => {
  console.error('Unexpected Azure SQL pool error:', err)
})

// Startup connection check.
export async function verifyConnection() {
  const connectedPool = await poolPromise

  try {
    await connectedPool.request().query('SELECT 1')
    console.log('Azure SQL Database connection verified.')
  } catch (error) {
    console.error('Azure SQL Database connection failed:', error)
    throw error
  }
}

// Export the promise so repositories can reuse
// the exact same connected pool.
export { poolPromise }
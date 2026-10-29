import { fileURLToPath } from 'node:url'
import { runner } from 'node-pg-migrate'
import { env, isProduction } from '../config/env.js'

export const runMigrations = () =>
  runner({
    databaseUrl: {
      connectionString: env.databaseUrl,
      ssl: isProduction || env.dbSsl ? { rejectUnauthorized: false } : false,
    },
    dir: fileURLToPath(new URL('./migrations', import.meta.url)),
    direction: 'up',
    migrationsTable: 'pgmigrations',
    log: console.log,
  })
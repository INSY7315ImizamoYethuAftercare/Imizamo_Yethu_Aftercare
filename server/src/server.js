import { createApp } from './app.js'
import { env } from './config/env.js'
import { verifyConnection } from './db/pool.js'
import { runMigrations } from './db/migrate.js'

const app = createApp()

try {
  await verifyConnection()
  console.log('Connected to PostgreSQL')
  await runMigrations()
} catch (err) {
  console.error('Failed to connect to PostgreSQL — check DATABASE_URL in .env')
  console.error(err)
  process.exit(1)
}

app.listen(env.port, () => {
  console.log(`API listening on port ${env.port} [${env.nodeEnv}]`)
})
import { createApp } from './app.js'
import { env } from './config/env.js'
import { verifyConnection } from './db/pool.js'

const app = createApp()

// eslint-disable-next-line no-console
//console.log('DEBUG DATABASE_URL:', process.env.DATABASE_URL)

// Fail fast at boot if the database is unreachable, rather than letting
// the server start and only discovering the problem on the first request.
try {
  await verifyConnection()
  // eslint-disable-next-line no-console
  console.log('Connected to PostgreSQL')
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Failed to connect to PostgreSQL — check DATABASE_URL in .env')
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
}

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${env.port} [${env.nodeEnv}]`)
})
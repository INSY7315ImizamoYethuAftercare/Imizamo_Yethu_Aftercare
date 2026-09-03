import { createApp } from './app.js'
import { env } from './config/env.js'
import { verifyConnection } from './db/pool.js'

const app = createApp()

//fails  fast at boot if the database is unreachable, rather than letting
// the server start and only discovering the problem on the first request when running 
try {
  await verifyConnection()
  console.log('Connected to PostgreSQL')
} catch (err) {
  console.error('Failed to connect to PostgreSQL — check DATABASE_URL in .env')
  
  console.error(err)
  process.exit(1)
}
 
app.listen(env.port, () => {
  console.log(`API listening on port ${env.port} [${env.nodeEnv}]`)
})

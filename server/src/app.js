import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/logger.js'
import { healthRouter } from './routes/health.routes.js'

export function createApp() {
  const app = express()

  // --- Security & platform middleware ---
  // helmet sets a sensible baseline of HTTP security headers (CSP,
  // X-Content-Type-Options, etc.) per the Security doc's XSS mitigation.
  app.use(helmet())
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true, // required so the httpOnly JWT cookie can be sent later
    }),
  )
  app.use(express.json())
  app.use(requestLogger)

  // --- Routes ---
  // Auth/role-authorisation middleware slots in here, ahead of protected
  // routers, once tasks #20-24 land. Health check stays public.
  app.use('/api', healthRouter)

  // Future routers mount like this, e.g.:
  // app.use('/api/auth', authRouter)
  // app.use('/api/attendance', authenticate, attendanceRouter)

  // --- Fallbacks (must be last) ---
  app.use(notFound)
  app.use(errorHandler)

  return app
}

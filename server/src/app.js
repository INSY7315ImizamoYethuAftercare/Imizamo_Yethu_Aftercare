import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/logger.js'
import { healthRouter } from './routes/health.routes.js'

import cookieParser from 'cookie-parser'

import { authRouter } from './routes/auth.routes.js'
import { attendanceRouter } from './routes/attendance.routes.js'
import { signOutRouter } from './routes/signout.routes.js'
import { guardianRouter } from './routes/guardian.routes.js'
import { schoolClassRouter } from './routes/schoolClass.routes.js'
import { observationRouter } from './routes/observation.routes.js'
import { learnerRouter } from './routes/learner.routes.js'
import { reportRouter } from './routes/report.routes.js'
import { teacherRouter } from './routes/teacher.routes.js'

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
  app.use(cookieParser())
  app.use(requestLogger)

  // --- Routes ---
  // Auth/role-authorisation middleware slots in here, ahead of protected
  // routers. Health check stays public.
    // --- Routes ---
  app.use('/api', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/attendance', attendanceRouter)
  app.use('/api/signout', signOutRouter)
  app.use('/api/guardian', guardianRouter)
  app.use('/api/observations', observationRouter)
  app.use('/api/reports', reportRouter)
  app.use('/api/learners', learnerRouter)
  app.use('/api/classes', schoolClassRouter)
  app.use('/api/teacher', teacherRouter)

  // --- Fallbacks ---
  app.use(notFound)
  app.use(errorHandler)

  return app
}

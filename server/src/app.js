import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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
import { accountRouter } from './routes/account.routes.js'

// Where the built React app lives in the deploy package (see
// scripts/build-deploy.mjs). Absent in local dev, where Vite serves it.
const DEFAULT_PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url))

/**
 * @param {{ publicDir?: string }} [options] - folder holding the built React
 *   app (index.html + assets). When it exists, the API also serves the website.
 */
export function createApp({ publicDir = DEFAULT_PUBLIC_DIR } = {}) {
  const app = express()

  // Azure App Service puts one proxy (its front end) in front of the app.
  // Trusting exactly one hop makes req.ip the real client address from
  // X-Forwarded-For, so per-IP rate limits apply per user, not to everyone.
  app.set('trust proxy', 1)

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
  app.use('/api/accounts', accountRouter)

  // --- Website (production) ---
  // One Azure Web App serves both the API and the React app, so they share
  // an origin and the login cookie just works. Any GET that isn't /api/...
  // and isn't a file gets index.html, so React's router handles the page.
  const indexHtml = path.join(publicDir, 'index.html')
  if (existsSync(indexHtml)) {
    app.use(express.static(publicDir, { index: false }))
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path === '/api' || req.path.startsWith('/api/')) return next()
      res.sendFile(indexHtml)
    })
  }

  // --- Fallbacks ---
  app.use(notFound)
  app.use(errorHandler)

  return app
}
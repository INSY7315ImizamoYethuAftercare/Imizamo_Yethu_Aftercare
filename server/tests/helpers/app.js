// Builds the Express app for Supertest.
//
// The login rate limiter is a module-level instance (5 attempts / 15 min),
// so by default it is swapped for a pass-through to stop unrelated login
// tests tripping it. Rate limiting itself is tested with { rateLimit: true }.
// Must be called before anything else in the test file imports src/app.js.
import { jest } from '@jest/globals'
import { fileURLToPath } from 'node:url'

const rateLimiterPath = fileURLToPath(new URL('../../src/middleware/rateLimiter.js', import.meta.url))
const loggerPath = fileURLToPath(new URL('../../src/middleware/logger.js', import.meta.url))

export async function loadApp({ rateLimit = false, ...appOptions } = {}) {
  // morgan writes straight to stdout; keep test output readable.
  jest.unstable_mockModule(loggerPath, () => ({ requestLogger: (req, res, next) => next() }))
  if (!rateLimit) {
    jest.unstable_mockModule(rateLimiterPath, () => ({
      createRateLimiter: () => (req, res, next) => next(),
      clientIpKey: (req) => req.ip,
    }))
  }
  const { createApp } = await import('../../src/app.js')
  return createApp(appOptions)
}

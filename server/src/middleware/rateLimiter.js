import rateLimit from 'express-rate-limit'

// Factory rather than a single instance, since different routes need
// different limits (e.g. login brute-force protection vs. general API use).
// Wire this onto /auth/login when that task is built:
//   router.post('/login', createRateLimiter({ max: 5 }), loginController)
export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 100 } = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
  })
}

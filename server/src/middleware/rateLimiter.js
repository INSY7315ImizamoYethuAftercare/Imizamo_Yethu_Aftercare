import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

// Factory rather than a single instance, since different routes need
// different limits (e.g. login brute-force protection vs. general API use).
// Extra express-rate-limit options (keyGenerator, skipSuccessfulRequests, ...)
// are passed straight through.
export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 100, ...options } = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
    ...options,
  })
}

/**
 * The caller's IP as a rate-limit key. Azure App Service's front end adds
 * the client port to X-Forwarded-For ("203.0.113.5:51234"); without
 * stripping it every connection would get its own bucket and the limit
 * would never trigger. IPv6 addresses are grouped by /56 by ipKeyGenerator.
 */
export function clientIpKey(req) {
  const ip = String(req.ip ?? '').replace(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/, '$1')
  return ipKeyGenerator(ip)
}

/**
 * Auth routes: /api/auth/*
 * register and login are public. logout is public (clears a cookie that
 * may or may not exist). /me requires a valid session.
 */
import { Router } from 'express'
import { register, login, logout, me } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'
import { clientIpKey, createRateLimiter } from '../middleware/rateLimiter.js'

export const authRouter = Router()

// Brute-force protection on login only (Security documentation). Only
// FAILED attempts count, so staff sharing the centre's Wi-Fi (one public IP)
// don't lock each other out by signing in normally.
//  - 5 failed attempts per account per IP per 15 minutes: guessing one
//    person's password.
//  - 30 failed attempts per IP per 15 minutes: trying a few passwords
//    against many accounts.
const FIFTEEN_MINUTES = 15 * 60 * 1000
const normalisedEmail = (req) => String(req.body?.email ?? '').trim().toLowerCase()

const loginAccountLimiter = createRateLimiter({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${clientIpKey(req)}|${normalisedEmail(req)}`,
})
const loginIpLimiter = createRateLimiter({
  windowMs: FIFTEEN_MINUTES,
  max: 30,
  skipSuccessfulRequests: true,
  keyGenerator: clientIpKey,
})

authRouter.post('/register', register)
authRouter.post('/login', loginIpLimiter, loginAccountLimiter, login)
authRouter.post('/logout', logout)
authRouter.get('/me', authenticate, me)
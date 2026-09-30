/**
 * Auth routes: /api/auth/*
 * register and login are public. logout is public (clears a cookie that
 * may or may not exist). /me requires a valid session.
 */
import { Router } from 'express'
import { register, login, logout, me } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimiter.js'

export const authRouter = Router()

// Brute-force protection on login only: 5 attempts per 15 minutes per IP,
// per the Security documentation.
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 })

authRouter.post('/register', register)
authRouter.post('/login', loginLimiter, login)
authRouter.post('/logout', logout)
authRouter.get('/me', authenticate, me)
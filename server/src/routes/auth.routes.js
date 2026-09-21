import { Router } from 'express'
import { register, login, logout, me } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimiter.js'

export const authRouter = Router()

// Brute-force protection on login only, per the Security documentation.
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 })

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/logout', logout)
authRouter.get('/me', authenticate, me)
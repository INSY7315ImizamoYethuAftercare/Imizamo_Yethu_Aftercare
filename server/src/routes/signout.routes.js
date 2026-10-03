/**
 * Sign-out routes: /api/signout/*
 * Every route here requires an authenticated Teacher or Manager — enforced
 * once at the router level rather than repeated per-route.
 */
import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { getToday, verifyGuardian, confirmSignOut } from '../controllers/signOutController.js'

export const signOutRouter = Router()

signOutRouter.use(authenticate, authorize('teacher', 'manager'))
signOutRouter.get('/today', getToday)
signOutRouter.post('/verify', verifyGuardian)
signOutRouter.post('/confirm', confirmSignOut)
import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { verifyGuardian, confirmSignOut } from '../controllers/signOutController.js'

export const signOutRouter = Router()

signOutRouter.use(authenticate, authorize('teacher'))
signOutRouter.post('/verify', verifyGuardian)
signOutRouter.post('/confirm', confirmSignOut)
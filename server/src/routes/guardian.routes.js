import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { getMyChildren, getChildProfile, getChildObservations } from '../controllers/guardianController.js'

export const guardianRouter = Router()

guardianRouter.use(authenticate, authorize('guardian'))
guardianRouter.get('/children', getMyChildren)
guardianRouter.get('/children/:learnerId', getChildProfile)
guardianRouter.get('/children/:learnerId/observations', getChildObservations)
/**
 * Guardian routes: /api/guardian/*
 * Authentication is enforced once at the router level; role (guardian vs
 * manager) is checked per-route since this router serves both the
 * guardian self-service endpoints and manager account-management actions.
 */
import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import {
  getMyProfile, getMyChildren, getChildProfile, getChildObservations, getChildOverview, addChildPickup, setChildWalkHome,
  deactivateGuardian, activateGuardian,
} from '../controllers/guardianController.js'

export const guardianRouter = Router()

guardianRouter.use(authenticate)

guardianRouter.get('/me', authorize('guardian'), getMyProfile)
guardianRouter.get('/children', authorize('guardian'), getMyChildren)
guardianRouter.get('/children/:learnerId', authorize('guardian'), getChildProfile)
guardianRouter.get('/children/:learnerId/observations', authorize('guardian'), getChildObservations)
guardianRouter.get('/children/:learnerId/overview', authorize('guardian'), getChildOverview)
guardianRouter.post('/children/:learnerId/pickups', authorize('guardian'), addChildPickup)
guardianRouter.patch('/children/:learnerId/walk-home', authorize('guardian'), setChildWalkHome)

guardianRouter.patch('/:guardianId/deactivate', authenticate, authorize('manager'), deactivateGuardian)
guardianRouter.patch('/:guardianId/activate', authenticate, authorize('manager'), activateGuardian)
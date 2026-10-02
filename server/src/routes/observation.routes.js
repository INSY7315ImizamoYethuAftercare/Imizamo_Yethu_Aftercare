import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import {
  addObservation, getLearnerObservations, updateObservation, deleteObservation,
} from '../controllers/observationController.js'

export const observationRouter = Router()

observationRouter.use(authenticate, authorize('teacher'))
observationRouter.post('/', addObservation)
observationRouter.get('/learner/:learnerId', getLearnerObservations)
observationRouter.patch('/:observationId', updateObservation)
observationRouter.delete('/:observationId', deleteObservation)
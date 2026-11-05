import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import * as schemas from '../validation/schemas/observationSchemas.js'
import {
  addObservation, getLearnerObservations, updateObservation, deleteObservation,
} from '../controllers/observationController.js'

export const observationRouter = Router()

observationRouter.use(authenticate, authorize('teacher'))
observationRouter.post('/', validate(schemas.addObservation), addObservation)
observationRouter.get('/learner/:learnerId', validate(schemas.learnerParams), getLearnerObservations)
observationRouter.patch('/:observationId', validate(schemas.updateObservation), updateObservation)
observationRouter.delete('/:observationId', validate(schemas.observationParams), deleteObservation)
import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import * as schemas from '../validation/schemas/learnerSchemas.js'
import {
  listLearners, getLearner, getLearnerOverview, createLearner, updateLearner, deleteLearner,
} from '../controllers/learnerController.js'

export const learnerRouter = Router()

learnerRouter.use(authenticate)
// Read-only list: teachers and managers. Everything that changes data is manager-only.
learnerRouter.get('/', authorize('manager', 'teacher'), listLearners)
learnerRouter.get('/:learnerId', authorize('manager', 'teacher'), validate(schemas.learnerParams), getLearner)
learnerRouter.get('/:learnerId/overview', authorize('manager', 'teacher'), validate(schemas.learnerParams), getLearnerOverview)
learnerRouter.post('/', authorize('manager'), validate(schemas.createLearner), createLearner)
learnerRouter.patch('/:learnerId', authorize('manager'), validate(schemas.updateLearner), updateLearner)
learnerRouter.delete('/:learnerId', authorize('manager'), validate(schemas.learnerParams), deleteLearner)

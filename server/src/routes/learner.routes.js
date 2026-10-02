import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import {
  listLearners, createLearner, updateLearner, deleteLearner,
} from '../controllers/learnerController.js'

export const learnerRouter = Router()

learnerRouter.use(authenticate)
// Read-only list: teachers and managers. Everything that changes data is manager-only.
learnerRouter.get('/', authorize('manager', 'teacher'), listLearners)
learnerRouter.post('/', authorize('manager'), createLearner)
learnerRouter.patch('/:learnerId', authorize('manager'), updateLearner)
learnerRouter.delete('/:learnerId', authorize('manager'), deleteLearner)

import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import {
  listLearners, createLearner, updateLearner, deleteLearner,
} from '../controllers/learnerController.js'

export const learnerRouter = Router()

learnerRouter.use(authenticate, authorize('manager'))
learnerRouter.get('/', listLearners)
learnerRouter.post('/', createLearner)
learnerRouter.patch('/:learnerId', updateLearner)
learnerRouter.delete('/:learnerId', deleteLearner)
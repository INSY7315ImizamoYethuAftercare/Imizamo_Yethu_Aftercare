import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import {
  listClasses, getClass, createClass, updateClass, getClassRoster, deactivateClass, activateClass
} from '../controllers/schoolClassController.js'

export const schoolClassRouter = Router()

schoolClassRouter.use(authenticate)

schoolClassRouter.get('/', authorize('manager', 'teacher'), listClasses)
schoolClassRouter.get('/:classId', authorize('manager', 'teacher'), getClass)
schoolClassRouter.post('/', authorize('manager'), createClass)
schoolClassRouter.patch('/:classId', authorize('manager'), updateClass)
schoolClassRouter.patch('/:classId/deactivate', authorize('manager'), deactivateClass)
schoolClassRouter.patch('/:classId/activate', authorize('manager'), activateClass)
schoolClassRouter.get('/:classId/learners', authorize('teacher', 'manager'), getClassRoster)

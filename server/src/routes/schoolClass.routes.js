import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import {
  listClasses, getClass, createClass, updateClass, deleteClass, getClassRoster,
} from '../controllers/schoolClassController.js'

export const schoolClassRouter = Router()

schoolClassRouter.use(authenticate)

schoolClassRouter.get('/', authorize('manager'), listClasses)
schoolClassRouter.get('/:classId', authorize('manager'), getClass)
schoolClassRouter.post('/', authorize('manager'), createClass)
schoolClassRouter.patch('/:classId', authorize('manager'), updateClass)
schoolClassRouter.delete('/:classId', authorize('manager'), deleteClass)

schoolClassRouter.get('/:classId/learners', authorize('teacher'), getClassRoster)
schoolClassRouter.get('/', authorize('manager', 'teacher'), listClasses)
schoolClassRouter.get('/:classId/learners', authorize('teacher'), getClassRoster)
schoolClassRouter.get('/:classId', authorize('manager', 'teacher'), getClass) 
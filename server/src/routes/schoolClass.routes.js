import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import * as schemas from '../validation/schemas/schoolClassSchemas.js'
import {
  listClasses, getClass, createClass, updateClass, getClassRoster, deactivateClass, activateClass
} from '../controllers/schoolClassController.js'

export const schoolClassRouter = Router()

schoolClassRouter.use(authenticate)

schoolClassRouter.get('/', authorize('manager', 'teacher'), validate(schemas.listClasses), listClasses)
schoolClassRouter.get('/:classId', authorize('manager', 'teacher'), validate(schemas.classParams), getClass)
schoolClassRouter.post('/', authorize('manager'), validate(schemas.createClass), createClass)
schoolClassRouter.patch('/:classId', authorize('manager'), validate(schemas.updateClass), updateClass)
schoolClassRouter.patch('/:classId/deactivate', authorize('manager'), validate(schemas.classParams), deactivateClass)
schoolClassRouter.patch('/:classId/activate', authorize('manager'), validate(schemas.classParams), activateClass)
schoolClassRouter.get('/:classId/learners', authorize('teacher', 'manager'), validate(schemas.classParams), getClassRoster)
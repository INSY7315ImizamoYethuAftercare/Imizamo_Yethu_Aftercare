// teacher.routes.js

import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import * as schemas from '../validation/schemas/teacherSchemas.js'
import {
  listTeachers, createTeacher, updateTeacher, deactivateTeacher, activateTeacher,
} from '../controllers/teacherController.js'

export const teacherRouter = Router()
teacherRouter.use(authenticate, authorize('manager'))
teacherRouter.get('/', listTeachers)
teacherRouter.post('/', validate(schemas.createTeacher), createTeacher)
teacherRouter.patch('/:teacherId', validate(schemas.updateTeacher), updateTeacher)
teacherRouter.patch('/:teacherId/deactivate', validate(schemas.teacherParams), deactivateTeacher)
teacherRouter.patch('/:teacherId/activate', validate(schemas.teacherParams), activateTeacher)




// teacher.routes.js

import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import {
  listTeachers, createTeacher, deactivateTeacher, activateTeacher,
} from '../controllers/teacherController.js'

export const teacherRouter = Router()
teacherRouter.use(authenticate, authorize('manager'))
teacherRouter.get('/', listTeachers)
teacherRouter.post('/', createTeacher)
teacherRouter.patch('/:teacherId/deactivate', deactivateTeacher)
teacherRouter.patch('/:teacherId/activate', activateTeacher)




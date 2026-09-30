// teacherAccount.routes.js
import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import {
  listTeachers, createTeacher, deactivateTeacher, activateTeacher,
} from '../controllers/teacherAccountController.js'

export const teacherAccountRouter = Router()
teacherAccountRouter.use(authenticate, authorize('manager'))
teacherAccountRouter.get('/', listTeachers)
teacherAccountRouter.post('/', createTeacher)
teacherAccountRouter.patch('/:teacherId/deactivate', deactivateTeacher)
teacherAccountRouter.patch('/:teacherId/activate', activateTeacher)
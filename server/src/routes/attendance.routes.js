import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { recordAttendance, getClassAttendance } from '../controllers/attendanceController.js'

export const attendanceRouter = Router()

attendanceRouter.use(authenticate, authorize('teacher'))
attendanceRouter.post('/', recordAttendance)
attendanceRouter.get('/class/:classId', getClassAttendance)
/**
 * Attendance routes: /api/attendance/*
 * Everything requires a login. Recording and correcting attendance is
 * teacher-only; viewing a class's attendance is open to teachers and managers
 * (managers are read-only).
 */
import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { recordAttendance, getClassAttendance, updateAttendance } from '../controllers/attendanceController.js'

export const attendanceRouter = Router()

attendanceRouter.use(authenticate)
attendanceRouter.post('/', authorize('teacher'), recordAttendance)
attendanceRouter.get('/class/:classId', authorize('teacher', 'manager'), getClassAttendance)
attendanceRouter.patch('/:recordId', authorize('teacher'), updateAttendance)
/**
 * Attendance routes: /api/attendance/*
 * Every route here requires an authenticated Teacher — enforced once at
 * the router level rather than repeated per-route.
 */
import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { recordAttendance, getClassAttendance } from '../controllers/attendanceController.js'

export const attendanceRouter = Router()

attendanceRouter.use(authenticate, authorize('teacher'))
attendanceRouter.post('/', recordAttendance)
attendanceRouter.get('/class/:classId', getClassAttendance)
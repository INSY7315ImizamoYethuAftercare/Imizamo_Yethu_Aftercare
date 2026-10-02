/**
 * Attendance controller
 *
 * Thin HTTP layer for attendance endpoints. Parses and validates the
 * request shape, calls into AttendanceService for the actual business
 * logic, and translates the result (or thrown error) into an HTTP
 * response. No business rules live here — see AttendanceService.js.
 */
import { AttendanceService } from '../services/AttendanceService.js'
import AttendanceRepository from '../repositories/AttendanceRepository.js'
import SchoolClassRepository from '../repositories/SchoolClassRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import { pool } from '../db/pool.js'

const attendanceService = new AttendanceService({
  attendanceRepository: new AttendanceRepository(pool),
  schoolClassRepository: new SchoolClassRepository(pool),
  teacherRepository: new TeacherRepository(pool),
  learnerRepository: new LearnerRepository(pool),
})

/**
 * POST /api/attendance
 * Records a learner as present or absent, within a given class. Requires
 * an authenticated Teacher account (enforced by attendanceRouter).
 */
export async function recordAttendance(req, res, next) {
  try {
    const { classId, learnerId, status, timeIn } = req.body
    if (!classId || !learnerId || !status) {
      const err = new Error('classId, learnerId and status are required')
      err.status = 400
      throw err
    }
    const recordDate = new Date().toISOString().slice(0, 10)
    const record = await attendanceService.recordAttendance({
      userId: req.user.userId, classId: Number(classId), learnerId, status, timeIn, recordDate,
    })
    res.status(201).json(record)
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/attendance/:recordId
 * Updates an existing attendance record's status.
 */
export async function updateAttendance(req, res, next) {
  try {
    const { status, timeIn } = req.body
    if (!status) {
      const err = new Error('status is required')
      err.status = 400
      throw err
    }
    const record = await attendanceService.updateAttendanceStatus({
      userId: req.user.userId, recordId: Number(req.params.recordId), status, timeIn,
    })
    res.json(record)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/attendance/class/:classId
 * Retrieves attendance for a class on a given date (defaults to today
 * if ?date= is not supplied).
 */
export async function getClassAttendance(req, res, next) {
  try {
    const { classId } = req.params
    const date = req.query.date || new Date().toISOString().slice(0, 10)
    const records = await attendanceService.getClassAttendance({
      userId: req.user.userId, classId: Number(classId), date,
    })
    res.json(records)
  } catch (err) {
    next(err)
  }
}
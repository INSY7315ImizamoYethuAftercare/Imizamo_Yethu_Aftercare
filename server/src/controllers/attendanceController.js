/**
 * Attendance controller
 *
 * Thin HTTP layer for attendance endpoints. Parses and validates the
 * request shape, calls into AttendanceService for the actual business
 * logic, and translates the result (or thrown error) into an HTTP
 * response. No business rules live here — see AttendanceService.js.
 */
import { AttendanceService, todayInSA } from '../services/AttendanceService.js'
import AttendanceRepository from '../repositories/AttendanceRepository.js'
import SchoolClassRepository from '../repositories/SchoolClassRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import { pool } from '../db/pool.js'
import { actingRole } from '../middleware/auth.js'

const attendanceService = new AttendanceService({
  attendanceRepository: new AttendanceRepository(pool),
  schoolClassRepository: new SchoolClassRepository(pool),
  teacherRepository: new TeacherRepository(pool),
  schoolClassRepository: new SchoolClassRepository(pool),
  learnerRepository: new LearnerRepository(pool),
})

/**
 * POST /api/attendance
 * Records a learner as present or absent, within a given class. Requires
 * an authenticated Teacher account (enforced by attendanceRouter).
 */
export async function recordAttendance(req, res, next) {
  try {
    const { learnerId, classId, status, timeIn } = req.validated.body
    const record = await attendanceService.recordAttendance({
      userId: req.user.userId,
      learnerId,
      classId,
      status,
      timeIn,
      recordDate: todayInSA(),
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
    const { status, timeIn } = req.validated.body
    const record = await attendanceService.updateAttendanceStatus({
      userId: req.user.userId,
      recordId: req.validated.params.recordId,
      status,
      timeIn,
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
    const { classId } = req.validated.params
    const date = req.validated.query.date ?? todayInSA()
    const records = await attendanceService.getClassAttendance({
      userId: req.user.userId, role: actingRole(req.user), classId, date,
    })
    res.json(records)
  } catch (err) {
    next(err)
  }
}
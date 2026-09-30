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
      userId: req.user.userId, classId, learnerId, status, timeIn, recordDate,
    })
    res.status(201).json(record)
  } catch (err) {
    next(err)
  }
}

export async function updateAttendance(req, res, next) {
  try {
    const { status, timeIn } = req.body
    if (!status) {
      const err = new Error('status is required')
      err.status = 400
      throw err
    }
    const record = await attendanceService.updateAttendanceStatus({
      userId: req.user.userId,
      recordId: Number(req.params.recordId),
      status,
      timeIn,
    })
    res.json(record)
  } catch (err) {
    next(err)
  }
}

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
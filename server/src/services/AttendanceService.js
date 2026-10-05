/**
 * AttendanceService
 *
 * Business logic for recording and retrieving daily attendance. Sits between
 * the controllers and the repository layer so that access rules are
 * enforced in exactly one place, rather than being repeated (or forgotten)
 * in every controller that touches attendance.
 *
 * Access rules:
 *  - Recording or correcting attendance needs a Teacher profile on the
 *    account (attendance_records.teacher_id is NOT NULL: it shows who took
 *    the register). Any teacher may take attendance for any class, since
 *    teachers pick the class they are covering rather than being locked to one.
 *  - Viewing a class's attendance is open to teachers and managers
 *    (managers are read-only).
 */

const SA_TIME_ZONE = 'Africa/Johannesburg'

/** Today's date in South Africa as YYYY-MM-DD (the server itself runs in UTC on Azure). */
export const todayInSA = () => new Date().toLocaleDateString('en-CA', { timeZone: SA_TIME_ZONE })

/** The current time in South Africa as HH:MM:SS. */
export const nowInSA = () =>
  new Date().toLocaleTimeString('en-GB', { timeZone: SA_TIME_ZONE, hour12: false })

const httpError = (message, status) => {
  const err = new Error(message)
  err.status = status
  return err
}

export class AttendanceService {
  /**
   * schoolClassRepository and learnerRepository are optional: when they are
   * supplied (as they are in the controller) the class and learner are
   * checked before anything is written.
   */
  constructor({ attendanceRepository, schoolClassRepository, teacherRepository, learnerRepository }) {
    this.attendanceRepository = attendanceRepository
    this.schoolClassRepository = schoolClassRepository
    this.teacherRepository = teacherRepository
    this.learnerRepository = learnerRepository
  }

  /**
   * Confirms the logged-in user has a real Teacher record and returns it.
   * Throws a 403 if the account is not a teacher.
   */
  async #assertIsTeacher(userId) {
    const teacher = await this.teacherRepository.findByUserId(userId)
    if (!teacher) throw httpError('Only teachers can perform this action', 403)
    return teacher
  }

  /** Validates that classId is a real school_classes row. */
  async #assertClassExists(classId) {
    if (!Number.isFinite(classId) || classId <= 0) throw httpError('Invalid classId', 400)
    if (!this.schoolClassRepository) return null
    const schoolClass = await this.schoolClassRepository.findById(classId)
    if (!schoolClass) throw httpError('Class not found', 404)
    return schoolClass
  }

  /**
   * POST /api/attendance: records a learner as present or absent.
   * classId is optional; when given, the learner must belong to that class.
   *
   * @param {{ userId: number, learnerId: number, classId?: number, status: string, timeIn?: string, recordDate: string }} params
   */
  async recordAttendance({ userId, learnerId, classId, status, timeIn, recordDate }) {
    const teacher = await this.#assertIsTeacher(userId)

    const normalised = String(status || '').toLowerCase()
    if (normalised !== 'present' && normalised !== 'absent') {
      throw httpError('status must be either "present" or "absent"', 400)
    }

    if (classId !== undefined && classId !== null) await this.#assertClassExists(Number(classId))

    if (this.learnerRepository) {
      const learner = await this.learnerRepository.findById(learnerId)
      if (!learner) throw httpError('Learner not found', 404)
      if (classId !== undefined && classId !== null && Number(learner.class_id) !== Number(classId)) {
        throw httpError('Learner does not belong to this class', 400)
      }
    }

    try {
      if (normalised === 'present') {
        return await this.attendanceRepository.markPresent({
          learnerId,
          teacherId: teacher.teacher_id,
          recordDate,
          timeIn: timeIn || nowInSA(), // default arrival time to "now"
        })
      }
      return await this.attendanceRepository.markAbsent({
        learnerId,
        teacherId: teacher.teacher_id,
        recordDate,
      })
    } catch (err) {
      // Postgres unique_violation: this learner already has a record for this date.
      if (err.code === '23505') {
        throw httpError('Attendance has already been recorded for this learner today', 409)
      }
      throw err
    }
  }

  /**
   * PATCH /api/attendance/:recordId: flips an existing record to present/absent.
   * Any teacher may update any class's attendance (no ownership check).
   *
   * @param {{ userId: number, recordId: number, status: string, timeIn?: string }} params
   */
  async updateAttendanceStatus({ userId, recordId, status, timeIn }) {
    const teacher = await this.#assertIsTeacher(userId)

    if (!Number.isFinite(recordId) || recordId <= 0) throw httpError('Invalid recordId', 400)

    const existing = await this.attendanceRepository.findById(recordId)
    if (!existing) throw httpError('Attendance record not found', 404)

    const normalised = String(status || '').toLowerCase()
    if (normalised !== 'present' && normalised !== 'absent') {
      throw httpError('status must be either "present" or "absent"', 400)
    }

    const resolvedTimeIn =
      normalised === 'present' ? timeIn || existing.time_in || nowInSA() : null

    return this.attendanceRepository.updateStatus({
      recordId, status: normalised, timeIn: resolvedTimeIn, teacherId: teacher.teacher_id,
    })
  }

  /**
   * GET /api/attendance/class/:classId?date=YYYY-MM-DD
   * Teachers and managers may view any class's attendance.
   *
   * @param {{ userId: number, role?: string, classId: number, date: string }} params
   */
  async getClassAttendance({ userId, role, classId, date }) {
    if (role !== 'manager') await this.#assertIsTeacher(userId)
    await this.#assertClassExists(classId)
    return this.attendanceRepository.findByClassAndDate(classId, date)
  }
}

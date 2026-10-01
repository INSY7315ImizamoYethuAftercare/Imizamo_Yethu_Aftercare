/**
 * AttendanceService
 *
 * Business logic for recording and retrieving daily attendance. Sits between
 * the controllers and the repository layer so that access rules are
 * enforced in exactly one place, rather than being repeated (or forgotten)
 * in every controller that touches attendance.
 *
 * Access rule: any authenticated Teacher account may record or view
 * attendance for any class, since teachers select the class they are
 * covering rather than being locked to a single one (see the UX Journey
 * Map and User Roles documentation). The only requirement is that the
 * requesting user genuinely has a Teacher profile linked to their account.
 */
export class AttendanceService {
  constructor({ attendanceRepository, schoolClassRepository, teacherRepository, learnerRepository }) {
    this.attendanceRepository = attendanceRepository
    this.teacherRepository = teacherRepository
    this.learnerRepository = learnerRepository
  }

  /**
   * Confirms the logged-in user has a real Teacher record and returns their
   * teacherId, which is stored on every attendance record to show who
   * actually took it. Throws a 403 if the account is not a teacher.
   *
   * @param {number} userId - The user_id from the verified JWT.
   * @returns {Promise<number>} The teacher's teacher_id.
   */
  async #assertIsTeacher(userId) {
    const teacher = await this.teacherRepository.findByUserId(userId)
    if (!teacher) {
      const err = new Error('Only teachers can perform this action')
      err.status = 403
      throw err
    }
    return teacher.teacher_id
  }

  /**
   * Records a learner as present or absent for a given date.
   *
   * @param {Object} params
   * @param {number} params.userId - The requesting user's id (from the JWT).
   * @param {number} params.learnerId - The learner being marked.
   * @param {'present'|'absent'} params.status - The attendance status to record.
   * @param {string} [params.timeIn] - Time the learner arrived, if present.
   * @param {string} params.recordDate - The date (YYYY-MM-DD) this record is for.
   * @returns {Promise<Object>} The created attendance record.
   */
  async recordAttendance({ userId, learnerId, status, timeIn, recordDate }) {

    if (status === 'present') {
      return this.attendanceRepository.markPresent({ learnerId, teacherId, recordDate, timeIn })
    }
    if (status === 'absent') {
      return this.attendanceRepository.markAbsent({ learnerId, teacherId, recordDate })
    }

    const err = new Error('status must be either "present" or "absent"')
    err.status = 400
    throw err
  }

  /**
   * Retrieves attendance for a given class and date.
   *
   * @param {Object} params
   * @param {number} params.userId - The requesting user's id (from the JWT).
   * @param {number} params.classId - The class to retrieve attendance for.
   * @param {string} params.date - The date (YYYY-MM-DD) to retrieve.
   * @returns {Promise<Array<Object>>} The attendance records for that class and date.
   */
  async getClassAttendance({ userId, classId, date }) {
    await this.#assertIsTeacher(userId)
    return teacher
  }

  /**
   * Validates that classId is a real school_classes row.
   *
   * @param {number} classId
   * @returns {Promise<Object>}
   */
  async #assertClassExists(classId) {
    if (!Number.isFinite(classId) || classId <= 0) {
      const err = new Error('Invalid classId')
      err.status = 400
      throw err
    }
    const schoolClass = await this.schoolClassRepository.findById(classId)
    if (!schoolClass) {
      const err = new Error('Class not found')
      err.status = 404
      throw err
    }
    return schoolClass
  }

  /**
   * POST /api/attendance - create a present/absent record.
   * Teachers may mark attendance for any class.
   *
   * @param {{ userId: number, classId: number, learnerId: number, status: string, timeIn?: string, recordDate: string }}
   */
  async recordAttendance({ userId, classId, learnerId, status, timeIn, recordDate }) {
    const teacher = await this.#assertIsTeacher(userId)
    await this.#assertClassExists(classId)

    // Optional safety: learner must exist and belong to the given class
    if (this.learnerRepository) {
      const learner = await this.learnerRepository.findById(learnerId)
      if (!learner) {
        const err = new Error('Learner not found')
        err.status = 404
        throw err
      }
      if (Number(learner.class_id) !== Number(classId)) {
        const err = new Error('Learner does not belong to this class')
        err.status = 400
        throw err
      }
    }

    const normalised = String(status || '').toLowerCase()
    try {
      if (normalised === 'present') {
        return await this.attendanceRepository.markPresent({
          learnerId,
          teacherId: teacher.teacher_id,
          recordDate,
          // Default arrival time to "now" if the client omitted it
          timeIn: timeIn || new Date().toTimeString().slice(0, 8),
        })
      }
      if (normalised === 'absent') {
        return await this.attendanceRepository.markAbsent({
          learnerId,
          teacherId: teacher.teacher_id,
          recordDate,
        })
      }
      const err = new Error('status must be either "present" or "absent"')
      err.status = 400
      throw err
    } catch (err) {
      // Postgres unique_violation if (learner_id, record_date) is unique
      if (err.code === '23505') {
        const conflict = new Error('Attendance has already been recorded for this learner today')
        conflict.status = 409
        throw conflict
      }
      throw err
    }
  }

  /**
   * PATCH /api/attendance/:recordId
   * markPresent() / markAbsent() on an existing AttendanceRecord.
   * Any teacher may update any class's attendance (no ownership check).
   *
   * @param {{ userId: number, recordId: number, status: string, timeIn?: string }}
   */
  async updateAttendanceStatus({ userId, recordId, status, timeIn }) {
    const teacher = await this.#assertIsTeacher(userId)

    if (!Number.isFinite(recordId) || recordId <= 0) {
      const err = new Error('Invalid recordId')
      err.status = 400
      throw err
    }

    const existing = await this.attendanceRepository.findById(recordId)
    if (!existing) {
      const err = new Error('Attendance record not found')
      err.status = 404
      throw err
    }

    const normalised = String(status || '').toLowerCase()
    if (normalised !== 'present' && normalised !== 'absent') {
      const err = new Error('status must be either "present" or "absent"')
      err.status = 400
      throw err
    }

    // Present keeps/sets time_in; absent clears it
    const resolvedTimeIn =
      normalised === 'present'
        ? (timeIn || existing.time_in || new Date().toTimeString().slice(0, 8))
        : null

    return this.attendanceRepository.updateStatus({
      recordId,
      status: normalised,
      timeIn: resolvedTimeIn,
      teacherId: teacher.teacher_id,
    })
  }

  /**
   * GET /api/attendance/class/:classId?date=YYYY-MM-DD
   * Any teacher may view attendance for any class.
   */
  async getClassAttendance({ userId, classId, date }) {
    await this.#assertIsTeacher(userId)
    await this.#assertClassExists(classId)
    return this.attendanceRepository.findByClassAndDate(classId, date)
  }
}
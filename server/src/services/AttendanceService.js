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
  constructor({ attendanceRepository, teacherRepository }) {
    this.attendanceRepository = attendanceRepository
    this.teacherRepository = teacherRepository
  }

  /**
   * Confirms the logged-in user has a real Teacher record and returns their
   * teacherId, which is stored on every attendance record to show who
   * actually took it. Throws a 403 if the account is not a teacher.
   *
   * @param {number} userId - The user_id from the verified JWT.
   * @returns {Promise<number>} The teacher's teacher_id.
   */
  async #getTeacherId(userId) {
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
    const teacherId = await this.#getTeacherId(userId)

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
    await this.#getTeacherId(userId)
    return this.attendanceRepository.findByClassAndDate(classId, date)
  }
}
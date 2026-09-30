// repositories/AttendanceRepository.js

class AttendanceRepository {
  constructor(pool) {
    // pool is the shared Singleton PgPool instance
    this.pool = pool
  }

  /**
   * Retrieves a single attendance record by its primary key.
   * Used by PATCH /attendance/:recordId before updating status.
   *
   * @param {number} recordId
   * @returns {Promise<Object|null>}
   */
  async findById(recordId) {
    const result = await this.pool.query(
      `SELECT "record_id", "learner_id", "teacher_id", "record_date", "time_in", "status"
       FROM attendance_records
       WHERE "record_id" = $1`,
      [recordId],
    )
    return result.rows[0] || null
  }

  /**
   * Full attendance history for one learner (most recent first).
   *
   * @param {number} learnerId
   * @returns {Promise<Array<Object>>}
   */
  async findByLearnerId(learnerId) {
    const result = await this.pool.query(
      `SELECT "record_id", "learner_id", "teacher_id", "record_date", "time_in", "status"
       FROM attendance_records
       WHERE "learner_id" = $1
       ORDER BY "record_date" DESC`,
      [learnerId],
    )
    return result.rows
  }

  /**
   * Attendance for every learner in a class on a given date.
   * Joins learners because attendance_records stores learner_id, not class_id.
   *
   * @param {number} classId
   * @param {string} date - YYYY-MM-DD
   * @returns {Promise<Array<Object>>}
   */
  async findByClassAndDate(classId, date) {
    const result = await this.pool.query(
      `SELECT ar."record_id", ar."learner_id", ar."teacher_id", ar."record_date",
              ar."time_in", ar."status"
       FROM attendance_records ar
       JOIN learners l ON l."learner_id" = ar."learner_id"
       WHERE l."class_id" = $1 AND ar."record_date" = $2
       ORDER BY ar."learner_id"`,
      [classId, date],
    )
    return result.rows
  }

  /**
   * Creates a new attendance row with status = 'present'.
   * Called from the daily roll-call flow (POST /attendance).
   *
   * @param {{ learnerId: number, teacherId: number, recordDate: string, timeIn: string }}
   * @returns {Promise<Object>}
   */
  async markPresent({ learnerId, teacherId, recordDate, timeIn }) {
    const result = await this.pool.query(
      `INSERT INTO attendance_records ("learner_id", "teacher_id", "record_date", "time_in", "status")
       VALUES ($1, $2, $3, $4, 'present')
       RETURNING "record_id", "learner_id", "teacher_id", "record_date", "time_in", "status"`,
      [learnerId, teacherId, recordDate, timeIn],
    )
    return result.rows[0]
  }

  /**
   * Creates a new attendance row with status = 'absent'.
   * time_in is left null because the learner did not arrive.
   *
   * @param {{ learnerId: number, teacherId: number, recordDate: string }}
   * @returns {Promise<Object>}
   */
  async markAbsent({ learnerId, teacherId, recordDate }) {
    const result = await this.pool.query(
      `INSERT INTO attendance_records ("learner_id", "teacher_id", "record_date", "status")
       VALUES ($1, $2, $3, 'absent')
       RETURNING "record_id", "learner_id", "teacher_id", "record_date", "time_in", "status"`,
      [learnerId, teacherId, recordDate],
    )
    return result.rows[0]
  }

  /**
   * Task #27 — Updates status (and optional time_in) on an existing AttendanceRecord.
   * Implements markPresent() / markAbsent() when correcting or flipping attendance.
   * Also records which teacher made the change via teacher_id.
   *
   * @param {{ recordId: number, status: 'present'|'absent', timeIn: string|null, teacherId: number }}
   * @returns {Promise<Object|null>}
   */
  async updateStatus({ recordId, status, timeIn, teacherId }) {
    const result = await this.pool.query(
      `UPDATE attendance_records
       SET "status" = $1,
           "time_in" = $2,
           "teacher_id" = $3
       WHERE "record_id" = $4
       RETURNING "record_id", "learner_id", "teacher_id", "record_date", "time_in", "status"`,
      [status, timeIn ?? null, teacherId, recordId],
    )
    return result.rows[0] || null
  }
}

export default AttendanceRepository
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
   * One learner's attendance record for one date (there is at most one:
   * uq_attendance_learner_date). Used to check a learner is present before
   * they can be signed out.
   *
   * @param {number} learnerId
   * @param {string} date - YYYY-MM-DD
   * @returns {Promise<Object|null>}
   */
  async findByLearnerAndDate(learnerId, date) {
    const result = await this.pool.query(
      `SELECT "record_id", "learner_id", "teacher_id", "record_date", "time_in", "status"
       FROM attendance_records
       WHERE "learner_id" = $1 AND "record_date" = $2`,
      [learnerId, date],
    )
    return result.rows[0] || null
  }

  /**
   * One learner's attendance from a date onwards, newest first. Dates come
   * back as YYYY-MM-DD text so they never shift a day in other time zones.
   *
   * @param {number} learnerId
   * @param {string} fromDate - YYYY-MM-DD (inclusive)
   * @returns {Promise<Array<{ record_date: string, status: string, time_in: string|null }>>}
   */
  async findByLearnerSince(learnerId, fromDate) {
    const result = await this.pool.query(
      `SELECT "record_date"::text AS "record_date", "status", "time_in"
       FROM attendance_records
       WHERE "learner_id" = $1 AND "record_date" >= $2
       ORDER BY "record_date" DESC`,
      [learnerId, fromDate],
    )
    return result.rows
  }

  /**
   * Every active learner marked present on a date, with their class, for
   * the Sign-Out page ("who is here and still to be collected").
   *
   * @param {string} date - YYYY-MM-DD
   * @returns {Promise<Array<Object>>}
   */
  async findPresentByDate(date) {
    const result = await this.pool.query(
      `SELECT l."learner_id", l."first_name", l."last_name", l."can_walk_home_alone",
              c."class_name", c."grade_range"
       FROM attendance_records a
       JOIN learners l ON l."learner_id" = a."learner_id"
       JOIN school_classes c ON c."class_id" = l."class_id"
       WHERE a."record_date" = $1 AND a."status" = 'present' AND l."is_active"
       ORDER BY c."class_name", l."last_name", l."first_name"`,
      [date],
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
   * Updates status (and optional time_in) on an existing AttendanceRecord.
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

  /**
   * Aggregates attendance counts across all learners for a date range.
   * Used for donor reporting — does not identify individual learners.
   *
   * @param {string} periodStart - YYYY-MM-DD
   * @param {string} periodEnd - YYYY-MM-DD
   * @returns {Promise<{ total_present: string, total_absent: string, unique_learners: string, attended_learners: string }>}
   *   unique_learners counts anyone with a record; attended_learners only those marked present at least once.
   */
  async getAggregateByDateRange(periodStart, periodEnd) {
    const result = await this.pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE "status" = 'present') AS total_present,
         COUNT(*) FILTER (WHERE "status" = 'absent') AS total_absent,
         COUNT(DISTINCT "learner_id") AS unique_learners,
         COUNT(DISTINCT "learner_id") FILTER (WHERE "status" = 'present') AS attended_learners
       FROM attendance_records
       WHERE "record_date" BETWEEN $1 AND $2`,
      [periodStart, periodEnd],
    )
    return result.rows[0]
  }

  /**
   * Present and absent counts per calendar day for a date range (weekly chart).
   * A day with no register has no row.
   * @param {string} periodStart - YYYY-MM-DD
   * @param {string} periodEnd - YYYY-MM-DD
   * @returns {Promise<Array<{ record_date: string, present_count: string, absent_count: string }>>}
   */
  async getDailyPresentCounts(periodStart, periodEnd) {
    const result = await this.pool.query(
      `SELECT "record_date"::text AS record_date,
              COUNT(*) FILTER (WHERE "status" = 'present') AS present_count,
              COUNT(*) FILTER (WHERE "status" = 'absent') AS absent_count
       FROM attendance_records
       WHERE "record_date" BETWEEN $1 AND $2
       GROUP BY "record_date"
       ORDER BY "record_date"`,
      [periodStart, periodEnd],
    )
    return result.rows
  }

  /**
   * Attendance rate + active learner count per class for a date range.
   * @param {string} periodStart - YYYY-MM-DD
   * @param {string} periodEnd - YYYY-MM-DD
   * @returns {Promise<Array<{ class_name: string, learner_count: string, present_count: string, total_count: string }>>}
   */
  async getAttendanceByClass(periodStart, periodEnd) {
    const result = await this.pool.query(
      `SELECT c."class_name",
              COUNT(DISTINCT l."learner_id") FILTER (WHERE l."is_active") AS learner_count,
              COUNT(*) FILTER (WHERE a."status" = 'present') AS present_count,
              COUNT(*) AS total_count
       FROM attendance_records a
       JOIN learners l ON l."learner_id" = a."learner_id"
       JOIN school_classes c ON c."class_id" = l."class_id"
       WHERE a."record_date" BETWEEN $1 AND $2
       GROUP BY c."class_name"
       ORDER BY c."class_name"`,
      [periodStart, periodEnd],
    )
    return result.rows
  }

  /**
   * Organisation-wide attendance rate for a date range (0–100), or null if no records.
   * @param {string} periodStart - YYYY-MM-DD
   * @param {string} periodEnd - YYYY-MM-DD
   * @returns {Promise<number|null>}
   */
  async getAttendanceRate(periodStart, periodEnd) {
    const result = await this.pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE "status" = 'present') AS total_present,
         COUNT(*) AS total_count
       FROM attendance_records
       WHERE "record_date" BETWEEN $1 AND $2`,
      [periodStart, periodEnd],
    )
    const present = Number(result.rows[0].total_present)
    const total = Number(result.rows[0].total_count)
    if (total === 0) return null
    return Math.round((present / total) * 100)
  }

  /**
   * Distinct days that have at least one attendance record in the range.
   * @param {string} periodStart - YYYY-MM-DD
   * @param {string} periodEnd - YYYY-MM-DD
   * @returns {Promise<number>}
   */
  async getDaysWithAttendance(periodStart, periodEnd) {
    const result = await this.pool.query(
      `SELECT COUNT(DISTINCT "record_date") AS days
       FROM attendance_records
       WHERE "record_date" BETWEEN $1 AND $2`,
      [periodStart, periodEnd],
    )
    return Number(result.rows[0].days)
  }
}

export default AttendanceRepository
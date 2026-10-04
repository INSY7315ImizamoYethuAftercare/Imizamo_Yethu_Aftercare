// repositories/SignOutRepository.js

class SignOutRepository {
    constructor(pool) {
        // pool is the shared Singleton PgPool instance
        this.pool = pool
    }

    /**
     * Retrieves a single sign out's record by their unique identifier.
     * 
     * @param {number} recordId - The unique identifier of the sign out record.
     * @returns {Promise<Object|null>} The sign out record, or null if no sign out record exists with the given ID.
     */
    async findById(recordId) {
        const result = await this.pool.query(
            `SELECT "record_id", "learner_id", "teacher_id", "manager_id", "guardian_id", "record_date", "time_out"
            FROM sign_out_records 
            WHERE "record_id" = $1`,
            [recordId]
        );
        return result.rows[0] || null;
    }

     /**
     * Retrieves the full sign-out history for a single learner.
     * 
     * @param {number} learnerId - The unique identifier of the learner.
     * @returns {Promise<Array<Object>>} A list of sign-out records for the 
     * learner, ordered for most recent to oldest. 
     */
    async findByLearnerId(learnerId) {
        const result = await this.pool.query(
            `SELECT "record_id", "learner_id", "teacher_id", "manager_id", "guardian_id", "record_date", "time_out"
            FROM sign_out_records
            WHERE "learner_id" = $1 ORDER BY "record_date" DESC`,
            [learnerId]
        );
        return result.rows;
    }

    /**
     * Retrieves a learner's sign-out for one date, if there is one. Used to
     * stop the same learner being signed out twice on the same day.
     *
     * @param {number} learnerId - The unique identifier of the learner.
     * @param {string} date - YYYY-MM-DD
     * @returns {Promise<Object|null>} The sign-out record, or null if none exists.
     */
    async findByLearnerAndDate(learnerId, date) {
        const result = await this.pool.query(
            `SELECT "record_id", "learner_id", "teacher_id", "manager_id", "guardian_id", "record_date", "time_out"
            FROM sign_out_records
            WHERE "learner_id" = $1 AND "record_date" = $2`,
            [learnerId, date]
        );
        return result.rows[0] || null;
    }

    /**
     * Creates a new sign out record.
     *
     * @param {Object} params - The new sign out record details.
     * @param {number} params.learnerId - The unique identifier of the learner.
     * @param {number|null} params.teacherId - The teacher who recorded it (or null if a manager did).
     * @param {number|null} params.managerId - The manager who recorded it (or null if a teacher did).
     * @param {number|null} params.guardianId - The guardian who collected; null = walked home alone.
     * @param {string} params.recordDate - The date the sign out of a leaner was recorded.
     * @param {string} params.timeOut - The time the sign out of a learner was recorded.
     * @returns {Promise<Object>} The newly created sign out record.
     */
  async create({ learnerId, teacherId = null, managerId = null, guardianId, recordDate, timeOut }) {
    const result = await this.pool.query(
      `INSERT INTO sign_out_records ("learner_id", "teacher_id", "manager_id", "guardian_id", "record_date", "time_out")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING "record_id", "learner_id", "teacher_id", "manager_id", "guardian_id", "record_date", "time_out"`,
      [learnerId, teacherId, managerId, guardianId, recordDate, timeOut]
    );
    return result.rows[0];
  }

  /**
   * Every sign-out on one date, with who collected the learner (null
   * guardian = walked home alone). Feeds the Sign-Out page's
   * "already collected today" list.
   *
   * @param {string} date - YYYY-MM-DD
   * @returns {Promise<Array<Object>>}
   */
  async findByDate(date) {
    const result = await this.pool.query(
      `SELECT s."record_id", s."learner_id", s."guardian_id", s."time_out", g."full_name" AS "guardian_name"
       FROM sign_out_records s
       LEFT JOIN guardians g ON g."guardian_id" = s."guardian_id"
       WHERE s."record_date" = $1
       ORDER BY s."time_out"`,
      [date]
    );
    return result.rows;
  }

  /**
   * Count of sign-out (safe collection) records in a date range.
   * @param {string} periodStart - YYYY-MM-DD
   * @param {string} periodEnd - YYYY-MM-DD
   * @returns {Promise<number>}
   */
  async countByDateRange(periodStart, periodEnd) {
    const result = await this.pool.query(
      `SELECT COUNT(*) AS count
       FROM sign_out_records
       WHERE "record_date" BETWEEN $1 AND $2`,
      [periodStart, periodEnd],
    );
    return Number(result.rows[0].count);
  }
}

export default SignOutRepository;
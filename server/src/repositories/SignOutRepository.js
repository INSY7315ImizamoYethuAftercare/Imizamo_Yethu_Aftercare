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
            `SELECT "record_id", "learner_id", "teacher_id", "guardian_id", "record_date", "time_out"
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
            `SELECT "record_id", "learner_id", "teacher_id", "guardian_id", "record_date", "time_out"
            FROM sign_out_records
            WHERE "learner_id" = $1 ORDER BY "record_date" DESC`,
            [learnerId]
        );
        return result.rows;
    }

    /**
     * Creates a new sign out record.
     *
     * @param {Object} params - The new sign out record details.
     * @param {number} params.learnerId - The unique identifier of the learner.
     * @param {string} params.teacherId - The unique identifier of the teacher.
     * @param {string} params.guardianId - The unique identifier of the guardian.
     * @param {string} params.recordDate - The date the sign out of a leaner was recorded.
     * @param {string} params.timeOut - The time the sign out of a learner was recorded.
     * @returns {Promise<Object>} The newly created sign out record.
     */
  async create({ learnerId, teacherId, guardianId, recordDate, timeOut }) {
    const result = await this.pool.query(
      `INSERT INTO sign_out_records ("learner_id", "teacher_id", "guardian_id", "record_date", "time_out")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING "record_id", "learner_id", "teacher_id", "guardian_id", "record_date", "time_out"`,
      [learnerId, teacherId, guardianId, recordDate, timeOut]
    );
    return result.rows[0];
  }
}

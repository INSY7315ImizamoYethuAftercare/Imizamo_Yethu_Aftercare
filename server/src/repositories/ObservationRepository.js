// repositories/ObservationRepository.js

class ObservationRepository {
    constructor(pool) {
        // pool is the shared Singleton PgPool instance
        this.pool = pool
    }

    /**
     * Retrieves an observation full profile by their unique identifier.
     * 
     * @param {number} observationId - The unique identifier of the observation.
     * @returns {Promise<Object|null>} The observation record, or null if no observation exists with the given ID.
     */
    async findById(observationId) {
        const result = await this.pool.query(
            `SELECT "observation_id", "learner_id", "teacher_id", "record_date", "category", "rating", "notes"
            FROM development_observations 
            WHERE "observation_id" = $1`,
            [observationId]
        );
        return result.rows[0] || null;
    }

    /**
     * Retrieves the full observation history for a single learner.
     * 
     * @param {number} learnerId - The unique identifier of the learner.
     * @returns {Promise<Array<Object>>} A list of observation records for the 
     * learner, ordered for most recent to oldest. 
     */
    async findByLearnerId(learnerId) {
        const result = await this.pool.query(
            `SELECT "observation_id", "learner_id", "teacher_id", "record_date", "category", "rating", "notes"
            FROM development_observations
            WHERE "learner_id" = $1 ORDER BY "record_date" DESC`,
            [learnerId]
        );
        return result.rows;
    }

    /**
     * Creates a new observation record and links it to a specified learner.
     *
     * @param {Object} params - The new observation's details.
     * @param {number} params.learnerId - The unique identifier of the learner.
     * @param {string} params.teacherId - The unique identifier of the teacher.
     * @param {string} params.recordDate - The observation's record date.
     * @param {string} params.category - The observation's development categotry.
     * @param {number} params.rating - The rating from 1-10.
     * @param {string} params.notes - The notes on the observation.
     * @returns {Promise<Object>} The newly created observation record.
     */
  async create({ learnerId, teacherId, recordDate, category, rating, notes }) {
    const result = await this.pool.query(
      `INSERT INTO development_observations ("learner_id", "teacher_id", "record_date", "category", "rating", "notes")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING "observation_id", "learner_id", "teacher_id", "record_date", "category", "rating", "notes"`,
      [learnerId, teacherId, recordDate, category, rating, notes]
    );
    return result.rows[0];
  }

  /**
     * Updates one or more fields on an existing observation record. 
     * Only columns in the allowed whitelist can be modified, preventing callers
     * from injecting arbitrary column names into the update.
     *
     * @param {number} observationId - The unique identifier of the observation to update.
     * @param {Object} fields - A partial object containing the fields to
     * update (any of: recordDate, category, rating, notes).
     * @returns {Promise<Object|null>} The updated observation record, or the
     * unchanged record if no valid fields were provided, or null if the observation does not exist.
     */
  async update(observationId, fields) {
    // Whitelist updatable columns so callers can't inject arbitrary column names
    const allowed = ['record_date', 'category', 'rating', 'notes'];
    const keys = Object.keys(fields).filter(k => allowed.includes(k));
    if (keys.length === 0) return this.findById(observationId);

    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = keys.map(k => fields[k]);

    const result = await this.pool.query(
      `UPDATE development_observations SET ${setClause} 
      WHERE "observation_id" = $${keys.length + 1} 
      RETURNING "observation_id", "learner_id", "teacher_id", "record_date", "category", "rating", "notes"`,
      [...values, observationId]
    );
    return result.rows[0] || null;
  }

  /**
     * Permanently deletes a observation record.
     *
     * @param {number} observationId - The unique identifier of an observation to delete.
     * @returns {Promise<boolean>} True if a observation was deleted, false if no matching observation was found.
     */
  async delete(observationId) {
    const result = await this.pool.query(
      `DELETE FROM development_observations WHERE "observation_id" = $1 RETURNING "observation_id"`,
      [observationId]
    );
    return result.rowCount > 0;
  }
}
export default ObservationRepository
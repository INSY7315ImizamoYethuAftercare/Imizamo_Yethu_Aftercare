// repositories/LearnerRepository.js

class LearnerRepository {
    constructor(pool) {
        // pool is the shared Singleton PgPool instance
        this.pool = pool
    }

    /**
     * Retrieves a single learner's full profile by their unique identifier.
     * 
     * @param {number} learnerId - The unique identifier of the learner.
     * @returns {Promise<Object|null>} The learner's profile, or null if no learner exists with the given ID.
     */
    async findById(learnerId) {
        const result = await this.pool.query(
            `SELECT "learner_id", "class_id", "first_name", "last_name", "date_of_birth", "can_walk_home_alone" 
            FROM learners 
            WHERE "learner_id" = $1`,
            [learnerId]
        );
        return result.rows[0] || null;
    }

    /**
     * Retrieves a roster of learners enrolled in a specific class, sorted
     * alphabetically by surname. Excludes dateOfBirth, since this method is
     * intended for roster/attendance views that do not require it.
     * 
     * @param {number} classId - The unique identifier of the class. 
     * @returns {Promise<Array<Object>>} A list of learners enrolled in the 
     * class, ordered by surname then first name.
     */
    async findByClassId(classId) {
    const result = await this.pool.query(
      `SELECT "learner_id", "first_name", "last_name", "can_walk_home_alone" 
      FROM learners 
      WHERE "class_id" = $1 
      ORDER BY "last_name", "first_name"`,
      [classId]
    );
    return result.rows;
  }

  /**
     * Creates a new learner record and enrolls them in the specified class.
     *
     * @param {Object} params - The new learner's details.
     * @param {number} params.classId - The unique identifier of the class the learner is being enrolled in.
     * @param {string} params.firstName - The learner's first name.
     * @param {string} params.lastName - The learner's last name.
     * @param {string} params.dateOfBirth - The learner's date of birth (format: YYYY-MM-DD).
     * @param {boolean} params.canWalkHomeAlone - Whether the learner is permitted to leave the aftercare without a guardian.
     * @returns {Promise<Object>} The newly created learner record.
     */
  async create({ classId, firstName, lastName, dateOfBirth, canWalkHomeAlone }) {
    const result = await this.pool.query(
      `INSERT INTO learners ("class_id", "first_name", "last_name", "date_of_birth", "can_walk_home_alone")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING "learner_id", "class_id", "first_name", "last_name", "date_of_birth", "can_walk_home_alone"`,
      [classId, firstName, lastName, dateOfBirth, canWalkHomeAlone]
    );
    return result.rows[0];
  }

    /**
     * Updates one or more fields on an existing learner record. 
     * Only columns in the allowed whitelist can be modified, preventing callers
     * from injecting arbitrary column names into the update.
     *
     * @param {number} learnerId - The unique identifier of the learner to update.
     * @param {Object} fields - A partial object containing the fields to
     * update (any of: firstName, lastName, dateOfBirth, canWalkHomeAlone, classID).
     * @returns {Promise<Object|null>} The updated learner record, or the
     * unchanged record if no valid fields were provided, or null if the learner does not exist.
     */
  async update(learnerId, fields) {
    // Whitelist updatable columns so callers can't inject arbitrary column names
    const allowed = ['first_name', 'last_name', 'date_of_birth', 'can_walk_home_alone', 'class_id'];
    const keys = Object.keys(fields).filter(k => allowed.includes(k));
    if (keys.length === 0) return this.findById(learnerId);

    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = keys.map(k => fields[k]);

    const result = await this.pool.query(
      `UPDATE learners SET ${setClause} 
      WHERE "learner_id" = $${keys.length + 1} 
      RETURNING "learner_id", "class_id", "first_name", "last_name", "date_of_birth", "can_walk_home_alone"`,
      [...values, learnerId]
    );
    return result.rows[0] || null;
  }

   /**
     * Permanently deletes a learner record.
     *
     * @param {number} learnerId - The unique identifier of the learner to delete.
     * @returns {Promise<boolean>} True if a learner was deleted, false if no matching learner was found.
     */
  async delete(learnerId) {
    const result = await this.pool.query(
      `DELETE FROM learners WHERE "learner_id" = $1 RETURNING "learner_id"`,
      [learnerId]
    );
    return result.rowCount > 0;
  }
}

module.exports = LearnerRepository;

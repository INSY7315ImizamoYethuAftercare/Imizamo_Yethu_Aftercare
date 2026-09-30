// repositories/GuardianRepository.js

class GuardianRepository {
    constructor(pool) {
        // pool is the shared Singleton PgPool instance
        this.pool = pool
    }

     /**
     * Fetches a guardian's profile via their user identifier.
     * 
     * @param {number} userId - The unique identifier of the user.
     * @returns {Promise<Object|null>} The user's profile, or null if no user exists with the given ID.
     */
    async findByUserId(userId) {
        const result = await this.pool.query(
        `SELECT "guardian_id", "user_id", "full_name", "contact_number", "relationship"
        FROM guardians 
        WHERE "user_id" = $1`,
        [userId]
        );
        return result.rows[0] || null;
    }

    /**
     * Retrieves a single guardian full profile by their unique identifier.
     * 
     * @param {number} guardianId - The unique identifier of the guardian.
     * @returns {Promise<Object|null>} The guardian's profile, or null if no guardian exists with the given ID.
     */
    async findById(guardianId) {
        const result = await this.pool.query(
            `SELECT "guardian_id", "user_id", "full_name", "contact_number", "relationship" 
            FROM guardians 
            WHERE "guardian_id" = $1`,
            [guardianId]
        );
        return result.rows[0] || null;
    }

    /**
     * Creates a new guardian record.
     *
     * @param {Object} params - The new guardian's details.
     * @param {number} params.userId - The unique identifier of the user to link to the guardianId.
     * @param {string} params.fullName - The guardian's full name.
     * @param {string} params.contactNumber - The guardian's contact number.
     * @param {string} params.relationship - The guardian's relationship to the learner.
     * @returns {Promise<Object>} The newly created guardian record.
     */
  async create({ userId, fullName, contactNumber, relationship }) {
    const result = await this.pool.query(
      `INSERT INTO guardians ("user_id", "full_name", "contact_number", "relationship")
       VALUES ($1, $2, $3, $4)
       RETURNING "guardian_id", "user_id", "full_name", "contact_number", "relationship"`,
      [userId, fullName, contactNumber, relationship]
    );
    return result.rows[0];
  }

  /**
     * Updates one or more fields on an existing guardian record. 
     * Only columns in the allowed whitelist can be modified, preventing callers
     * from injecting arbitrary column names into the update.
     *
     * @param {number} guardianId - The unique identifier of the guardian to update.
     * @param {Object} fields - A partial object containing the fields to
     * update (any of: fullName, contactNumber, relationship).
     * @returns {Promise<Object|null>} The updated guardian record, or the
     * unchanged record if no valid fields were provided, or null if the guardian does not exist.
     */
  async update(guardianId, fields) {
    // Whitelist updatable columns so callers can't inject arbitrary column names
    const allowed = ['full_name', 'contact_number', 'relationship'];
    const keys = Object.keys(fields).filter(k => allowed.includes(k));
    if (keys.length === 0) return this.findById(guardianId);

    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = keys.map(k => fields[k]);

    const result = await this.pool.query(
      `UPDATE guardians SET ${setClause} 
      WHERE "guardian_id" = $${keys.length + 1} 
      RETURNING "guardian_id", "user_id", "full_name", "contact_number", "relationship"`,
      [...values, guardianId]
    );
    return result.rows[0] || null;
  }
}

export default GuardianRepository;
// repositories/AdminRepository.js

// ToDo: Check whether access_level ever needs to change post-creation

class AdminRepository {
    constructor(pool) {
        // pool is the shared Singleton PgPool instance
        this.pool = pool
    }

     /**
     * Fetches a Admin's profile via their user identifier.
     * 
     * @param {number} userId - The unique identifier of the user.
     * @returns {Promise<Object|null>} The user's profile, or null if no user exists with the given ID.
     */
    async findByUserId(userId) {
        const result = await this.pool.query(
        `SELECT "admin_id", "user_id", "full_name", "access_level" 
        FROM admins 
        WHERE "user_id" = $1`,
        [userId]
        );
        return result.rows[0] || null;
    }

    /**
     * Retrieves a single admin's full profile by their unique identifier.
     * 
     * @param {number} adminId - The unique identifier of the admin.
     * @returns {Promise<Object|null>} The admin's profile, or null if no admin exists with the given ID.
     */
    async findById(adminId) {
        const result = await this.pool.query(
            `SELECT "admin_id", "user_id", "full_name", "access_level" 
            FROM admins 
            WHERE "admin_id" = $1`,
            [adminId]
        );
        return result.rows[0] || null;
    }

    /**
     * Creates a new admin record.
     *
     * @param {Object} params - The new admin's details.
     * @param {number} params.userId - The unique identifier of the user to link to the adminId.
     * @param {string} params.fullName - The admin's full name.
     * @param {char} params.accessLevel - The admin's access level.
     * @returns {Promise<Object>} The newly created admin record.
     */
  async create({ userId, fullName, accessLevel}) {
    const result = await this.pool.query(
      `INSERT INTO admins ("user_id", "full_name", "access_level")
       VALUES ($1, $2, $3)
       RETURNING "admin_id", "user_id", "full_name", "access_level"`,
      [userId, fullName, accessLevel]
    );
    return result.rows[0];
  }

  /**
     * Updates one or more fields on an existing admin record. 
     * Only columns in the allowed whitelist can be modified, preventing callers
     * from injecting arbitrary column names into the update.
     *
     * @param {number} adminId - The unique identifier of the admin to update.
     * @param {Object} fields - A partial object containing the fields to
     * update (any of: fullName, access_level).
     * @returns {Promise<Object|null>} The updated admin record, or the
     * unchanged record if no valid fields were provided, or null if the admin does not exist.
     */
  async update(adminId, fields) {
    // Whitelist updatable columns so callers can't inject arbitrary column names
    const allowed = ['full_name', 'access_level'];
    const keys = Object.keys(fields).filter(k => allowed.includes(k));
    if (keys.length === 0) return this.findById(adminId);

    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = keys.map(k => fields[k]);

    const result = await this.pool.query(
      `UPDATE admins SET ${setClause} 
      WHERE "admin_id" = $${keys.length + 1} 
      RETURNING "admin_id", "user_id", "full_name", "access_level"`,
      [...values, adminId]
    );
    return result.rows[0] || null;
  }
}

export default AdminRepository;
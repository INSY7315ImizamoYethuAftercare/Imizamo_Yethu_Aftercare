// repositories/ManagerRepository.js

class ManagerRepository {
    constructor(pool) {
        // pool is the shared Singleton PgPool instance
        this.pool = pool
    }

    /**
     * Fetches a Manager's profile via their user identifier.
     * 
     * @param {number} userId - The unique identifier of the user.
     * @returns {Promise<Object|null>} The user's profile, or null if no user exists with the given ID.
     */
    async findByUserId(userId) {
        const result = await this.pool.query(
        `SELECT "manager_id", "user_id", "full_name"
        FROM managers 
        WHERE "user_id" = $1`,
        [userId]
        );
        return result.rows[0] || null;
    }

     /**
     * Retrieves a single manager full profile by their unique identifier.
     * 
     * @param {number} mangerId - The unique identifier of the manager.
     * @returns {Promise<Object|null>} The manager's profile, or null if no manager exists with the given ID.
     */
    async findById(managerId) {
        const result = await this.pool.query(
            `SELECT "manager_id", "user_id", "full_name"
            FROM managers 
            WHERE "manager_id" = $1`,
            [managerId]
        );
        return result.rows[0] || null;
    }

    /**
     * Creates a new manager record.
     *
     * @param {Object} params - The new manager's details.
     * @param {number} params.userId - The unique identifier of the user to link to the managerId.
     * @param {string} params.fullName - The manager's full name.
     * @returns {Promise<Object>} The newly created manager record.
     */
  async create({ userId, fullName}) {
    const result = await this.pool.query(
      `INSERT INTO managers ("user_id", "full_name")
       VALUES ($1, $2)
       RETURNING "manager_id", "user_id", "full_name"`,
      [userId, fullName]
    );
    return result.rows[0];
  }

    /**
     * Updates the managers full name on an existing manager record.
     *
     * @param {number} managerId - The unique identifier of the manager to update.
     * @param {string} fullName - The manager's full name.
     * @returns {Promise<Object|null>} The updated manager record, or null if the manager does not exist.
     */
    async updateFullName(managerId, fullName) {
        const result = await this.pool.query(
        `UPDATE managers SET "full_name" = $2
        WHERE "manager_id" =  $1
        RETURNING "manager_id", "user_id", "full_name"`,
        [managerId, fullName]
        );
        return result.rows[0] || null;
    }
}

export default ManagerRepository;
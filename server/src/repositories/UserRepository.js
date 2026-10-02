// repositories/UserRepository.js

class UserRepository {
    constructor(pool) {
        // pool is the shared Singleton PgPool instance
        this.pool = pool
    }

    /**
     * Retrieves a single user's full profile by their email address.
     * 
     * @param {string} email - The email address of the user.
     * @returns {Promise<Object|null>} The user's profile, or null if no user exists with the given email address.
     */
    async findByEmail(email) {
         const result = await this.pool.query(
            `SELECT "user_id", "email", "password_hash", "role", "full_name", "is_active"
            FROM users
            WHERE "email" = $1`,
            [email]
         );
         return result.rows[0] || null;
    }

    /**
     * Retrieves a user's profile by their unique identifier (no password hash).
     *
     * @param {number} userId - The unique identifier of the user.
     * @returns {Promise<Object|null>} The user, or null if none exists.
     */
    async findById(userId) {
        const result = await this.pool.query(
            `SELECT "user_id", "email", "role", "full_name", "is_active"
            FROM users
            WHERE "user_id" = $1`,
            [userId]
        );
        return result.rows[0] || null;
    }

    /**
    * Creates a new user record and adds their respective role
    * 
    * @param {Object} params - The new user's details.
    * @param {string} params.email - The user's email address.
    * @param {string} params.role - The user's role.
    * @param {string} params.passwordHash - The user's password hashed.
    * @param {string} params.fullName - The user's full name.
    * @param {boolean} params.isActive - If the user's account is active or not
    * 
    * @returns {Promise<Object>} The newly created user record.
    */
    async createUser({ email, role, passwordHash, fullName, isActive }) {
         const result = await this.pool.query(
            `INSERT INTO users ("email", "role", "password_hash", "full_name", "is_active")
             VALUES ($1, $2, $3, $4, $5)
             RETURNING "user_id", "email", "role", "full_name", "is_active"`,
             [email, role, passwordHash, fullName, isActive]
    );
        return result.rows[0];
    }


     /**
     * Updates one or more fields on an existing user record. Only
     * columns in the allowed whitelist can be modified, preventing callers
     * from injecting arbitrary column names into the update.
     *
     * @param {string} email - The unique identifier of the user to update.
     * @param {Object} fields - A partial object containing the fields to
     * update (any of: email, fullName).
     * @returns {Promise<Object|null>} The updated user record, or the
     * unchanged record if no valid fields were provided, or null if the user does not exist.
     */
    async update(email, fields) {
        const allowed = ['email', 'full_name'];
        const keys = Object.keys(fields).filter(k => allowed.includes(k));
        if (keys.length === 0) return this.findByEmail(email);

        const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const values = keys.map(k => fields[k]);

        const result = await this.pool.query(
        `UPDATE users SET ${setClause} 
        WHERE "email" = $${keys.length + 1} 
        RETURNING  "email", "role", "password_hash", "full_name"`,
        [...values, email]
        );
        return result.rows[0] || null;
    }

    /**
     * Updates the role on an existing user record.
     *
     * @param {number} userId - The unique identifier of the user to update.
     * @param {string} role - The user's role.
     * @returns {Promise<Object|null>} The updated user record, or null if the user does not exist.
     */
    async updateRole(userId, role) {
        const result = await this.pool.query(
        `UPDATE users SET "role" = $2
        WHERE "user_id" =  $1
        RETURNING "user_id", "email", "role", "password_hash", "full_name"`,
        [userId, role]
        );
        return result.rows[0] || null;
    }

    /**
     * Updates the password on an existing user record.
     *
     * @param {string} email - The email of the user to identify which email password to update.
     * @param {string} passwordHash - The user's hashed password.
     * @returns {Promise<Object|null>} The updated user record, or null if the user does not exist.
     */
    async updatePassword(email, passwordHash) {
        const result = await this.pool.query(
        `UPDATE users SET "password_hash" = $2
        WHERE "email" =  $1
        RETURNING "user_id", "email", "role", "full_name"`,
        [email, passwordHash]
        );
        return result.rows[0] || null;
    }
}

export default UserRepository;
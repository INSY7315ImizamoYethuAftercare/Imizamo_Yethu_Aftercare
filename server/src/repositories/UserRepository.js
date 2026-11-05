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
            `SELECT "user_id", "email", "password_hash", "role", "full_name", "is_active",
                    "password_changed_at", "must_change_password"
            FROM users
            WHERE LOWER("email") = LOWER($1)`,
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
            `SELECT "user_id", "email", "role", "full_name", "is_active",
                    "password_changed_at", "must_change_password"
            FROM users
            WHERE "user_id" = $1`,
            [userId]
        );
        return result.rows[0] || null;
    }

    /**
     * Lists every manager and admin account (no password hash), with the
     * admin access level ('master' | 'standard', null for managers).
     * Used by the master admin's account management.
     *
     * @returns {Promise<Array<Object>>} Admins first, then managers, by name.
     */
    async findManagersAndAdmins() {
        const result = await this.pool.query(
            `SELECT u."user_id", u."email", u."role", u."full_name", u."is_active", a."access_level"
            FROM users u
            LEFT JOIN admins a ON a."user_id" = u."user_id"
            WHERE u."role" IN ('admin', 'manager')
            ORDER BY u."role", u."full_name"`
        );
        return result.rows;
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
    * @param {boolean} [params.mustChangePassword=false] - Make them choose their own password at first sign-in.
    *
    * @returns {Promise<Object>} The newly created user record.
    */
    async createUser({ email, role, passwordHash, fullName, isActive, mustChangePassword = false }) {
         const result = await this.pool.query(
            `INSERT INTO users ("email", "role", "password_hash", "full_name", "is_active", "must_change_password")
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING "user_id", "email", "role", "full_name", "is_active"`,
             [email, role, passwordHash, fullName, isActive, mustChangePassword]
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
        RETURNING "user_id", "email", "role", "full_name"`,
        [...values, email]
        );
        return result.rows[0] || null;
    }

    /**
     * Sets a new password. Also records when (which ends every session
     * started before now) and whether the user must choose their own
     * password before using the app (true after a master admin's reset).
     *
     * @param {number} userId - The unique identifier of the user.
     * @param {string} passwordHash - The bcrypt hash of the new password.
     * @param {Object} options
     * @param {Date} options.changedAt - When it changed (the app's clock, matching session tokens).
     * @param {boolean} options.mustChangePassword
     * @returns {Promise<Object|null>} The updated user (no password hash), or null if none exists.
     */
    async setPassword(userId, passwordHash, { changedAt, mustChangePassword }) {
        const result = await this.pool.query(
        `UPDATE users
         SET "password_hash" = $2, "password_changed_at" = $3, "must_change_password" = $4
         WHERE "user_id" = $1
         RETURNING "user_id", "email", "role", "full_name", "is_active",
                   "password_changed_at", "must_change_password"`,
        [userId, passwordHash, changedAt, mustChangePassword]
        );
        return result.rows[0] || null;
    }

    /**
     * Updates one or more fields on a user, found by their user id. Only
     * whitelisted columns can be modified (any of: email, full_name).
     * Passwords go through setPassword.
     *
     * @param {number} userId - The unique identifier of the user to update.
     * @param {Object} fields - A partial object of the columns to update.
     * @returns {Promise<Object|null>} The updated user record (no password hash),
     * the unchanged record if no valid fields were provided, or null if the user does not exist.
     */
    async updateById(userId, fields) {
        const allowed = ['email', 'full_name'];
        const keys = Object.keys(fields).filter(k => allowed.includes(k));
        if (keys.length === 0) return this.findById(userId);

        const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const values = keys.map(k => fields[k]);

        const result = await this.pool.query(
        `UPDATE users SET ${setClause}
        WHERE "user_id" = $${keys.length + 1}
        RETURNING "user_id", "email", "role", "full_name", "is_active"`,
        [...values, userId]
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
        RETURNING "user_id", "email", "role", "full_name"`,
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
// repositories/TeacherRepository.js

class TeacherRepository {
  constructor(pool) {
    // pool is the shared Singleton PgPool instance
    this.pool = pool;
  }

  /**
   * Fetches a teacher's profile via their user identifier.
   *
   * @param {number} userId - The unique identifier of the user.
   * @returns {Promise<Object|null>} The user's profile, or null if no user exists with the given ID.
   */
  async findByUserId(userId) {
    const result = await this.pool.query(
      `SELECT "teacher_id", "user_id", "full_name", "contact_email" 
        FROM teachers 
        WHERE "user_id" = $1`,
      [userId],
    );
    return result.rows[0] || null;
  }

  /**
   * Retrieves a single teacher full profile by their unique identifier.
   *
   * @param {number} teacherId - The unique identifier of the teacher.
   * @returns {Promise<Object|null>} The teacher's profile, or null if no teacher exists with the given ID.
   */
  async findById(teacherId) {
    const result = await this.pool.query(
      `SELECT "teacher_id", "user_id", "full_name", "contact_email" 
            FROM teachers 
            WHERE "teacher_id" = $1`,
      [teacherId],
    );
    return result.rows[0] || null;
  }

  /**
   * Retrieves all teacher accounts full profiles
   * 
   * @returns {Promise<Object>} An object of teacher records
   */
  async findAll() {
    const result = await this.pool.query(
      `SELECT t."teacher_id", t."user_id", t."full_name", t."contact_email", u."is_active"
        FROM teachers t JOIN users u ON u."user_id" = t."user_id"
        ORDER BY t."full_name"`,
    );
    return result.rows;
  }

  /**
   * Sets the teacher account record as active
   * 
   * @param {number} teacherId - The unique identifier of the teacher.
   * @param {boolean} isActive - If the teacher account is active.
   * 
   * @returns {Promise<Object|null>} An object of the teacher record with the is_active coloum
   */
  async setActive(teacherId, isActive) {
    const result = await this.pool.query(
      `UPDATE users u SET "is_active" = $2
       FROM teachers t
       WHERE t."user_id" = u."user_id" AND t."teacher_id" = $1
       RETURNING t."teacher_id", u."is_active"`,
      [teacherId, isActive],
    );
    return result.rows[0] || null;
  }

  /**
   * Creates a new teacher record.
   *
   * @param {Object} params - The new teacher's details.
   * @param {number} params.userId - The unique identifier of the user to link to the teacherId.
   * @param {string} params.fullName - The teacher's full name.
   * @param {string} params.contactEmail - The teacher's contact email.
   * @returns {Promise<Object>} The newly created teacher record.
   */
  async create({ userId, fullName, contactEmail }) {
    const result = await this.pool.query(
      `INSERT INTO teachers ("user_id", "full_name", "contact_email")
       VALUES ($1, $2, $3)
       RETURNING "teacher_id", "user_id", "full_name", "contact_email"`,
      [userId, fullName, contactEmail],
    );
    return result.rows[0];
  }

  /**
   * Updates one or more fields on an existing teacher record.
   * Only columns in the allowed whitelist can be modified, preventing callers
   * from injecting arbitrary column names into the update.
   *
   * @param {number} teacherId - The unique identifier of the teacher to update.
   * @param {Object} fields - A partial object containing the fields to
   * update (any of: fullName, contactEmail).
   * @returns {Promise<Object|null>} The updated teacher record, or the
   * unchanged record if no valid fields were provided, or null if the teacher does not exist.
   */
  async update(teacherId, fields) {
    // Whitelist updatable columns so callers can't inject arbitrary column names
    const allowed = ["full_name", "contact_email"];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return this.findById(teacherId);

    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
    const values = keys.map((k) => fields[k]);

    const result = await this.pool.query(
      `UPDATE teachers SET ${setClause} 
      WHERE "teacher_id" = $${keys.length + 1} 
      RETURNING "teacher_id", "user_id", "full_name", "contact_email"`,
      [...values, teacherId],
    );
    return result.rows[0] || null;
  }
}

export default TeacherRepository;

// repositories/SchoolClassRepository.js

class SchoolClassRepository {
  constructor(pool) {
    // pool is the shared Singleton PgPool instance
    this.pool = pool;
  }

  /**
   * Retrieves the class's record by their unique identifier.
   *
   * @param {number} classId - The unique identifier of the class.
   * @returns {Promise<Object|null>} The class's record, or null if no class exists with the given ID.
   */
  async findById(classId) {
    const result = await this.pool.query(
      `SELECT "class_id", "teacher_id", "class_name", "grade_range"
            FROM school_classes 
            WHERE "class_id" = $1`,
      [classId],
    );
    return result.rows[0] || null;
  }

  /**
   * Find all classes for a given teacher
   *
   * @param {number} teacherId - The unique identifier of the teacher.
   * @returns {Promise<Object|null>} The , or null if no user exists with the given ID.
   */
  async findByTeacherId(teacherId) {
    const result = await this.pool.query(
      `SELECT "class_id", "class_name", "grade_range"
        FROM school_classes 
        WHERE "teacher_id" = $1`,
      [teacherId],
    );
    return result.rows;
  }

  /**
   * Creates a new class record.
   *
   * @param {Object} params - The new class details.
   * @param {number} params.teacherId - The unique identifier of the teacher.
   * @param {string} params.className - The class's name.
   * @param {string} params.gradeRange - The class's grande range.
   * @returns {Promise<Object>} The newly created class record.
   */
  async create({ teacherId, className, gradeRange }) {
    const result = await this.pool.query(
      `INSERT INTO school_classes ("teacher_id", "class_name", "grade_range")
       VALUES ($1, $2, $3)
       RETURNING "class_id", "teacher_id", "class_name", "grade_range"`,
      [teacherId, className, gradeRange],
    );
    return result.rows[0];
  }

  /**
   * Updates one or more fields on an existing class record.
   * Only columns in the allowed whitelist can be modified, preventing callers
   * from injecting arbitrary column names into the update.
   *
   * @param {number} classId - The unique identifier of the class to update.
   * @param {Object} fields - A partial object containing the fields to
   * update (any of: className, gradeRange).
   * @returns {Promise<Object|null>} The updated class record, or the
   * unchanged record if no valid fields were provided, or null if the class does not exist.
   */
  async update(classId, fields) {
    // Whitelist updatable columns so callers can't inject arbitrary column names
    const allowed = ["class_name", "grade_range"];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return this.findById(classId);

    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
    const values = keys.map((k) => fields[k]);

    const result = await this.pool.query(
      `UPDATE school_classes SET ${setClause} 
        WHERE "class_id" = $${keys.length + 1} 
        RETURNING "class_id", "teacher_id", "class_name", "grade_range"`,
      [...values, classId],
    );
    return result.rows[0] || null;
  }

  /**
   * Permanently deletes a class record.
   *
   * @param {number} classId - The unique identifier of the class to delete.
   * @returns {Promise<boolean>} True if a class was deleted, false if no matching class was found.
   */
  async delete(classId) {
    const result = await this.pool.query(
      'DELETE FROM school_classes WHERE "class_id" = $1 RETURNING "class_id"',
      [classId],
    );
    return result.rowCount > 0;
  }
}

module.exports = SchoolClassRepository;
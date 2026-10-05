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
      `SELECT "class_id", "teacher_id", "class_name", "grade_range", "colour", "is_active"
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
      `SELECT "class_id", "class_name", "grade_range", "colour", "is_active"
        FROM school_classes 
        WHERE "teacher_id" = $1`,
      [teacherId],
    );
    return result.rows;
  }

  /**
   * Lists classes with everything the UI needs in one query: the teacher's
   * name, how many learners are enrolled (all / active) and how many are
   * marked present today (South African date).
   *
   * @param {Object} [options]
   * @param {boolean} [options.includeInactive=false] - also return deactivated classes.
   */
  async findAll({ includeInactive = false } = {}) {
    const result = await this.pool.query(
      `SELECT c."class_id", c."teacher_id", c."class_name", c."grade_range", c."colour", c."is_active",
              t."full_name" AS "teacher_name",
              (SELECT COUNT(*) FROM learners l
                 WHERE l."class_id" = c."class_id")::int AS "learner_count",
              (SELECT COUNT(*) FROM learners l
                 WHERE l."class_id" = c."class_id" AND l."is_active")::int AS "active_learner_count",
              (SELECT COUNT(*) FROM attendance_records a
                 JOIN learners l ON l."learner_id" = a."learner_id"
                 WHERE l."class_id" = c."class_id"
                   AND a."status" = 'present'
                   AND a."record_date" = (now() AT TIME ZONE 'Africa/Johannesburg')::date)::int AS "present_today"
       FROM school_classes c
       LEFT JOIN teachers t ON t."teacher_id" = c."teacher_id"
       WHERE ($1::boolean OR c."is_active")
       ORDER BY c."class_name"`,
      [includeInactive],
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

  
  async create({ teacherId, className, gradeRange, colour = null }) {
    const result = await this.pool.query(
      `INSERT INTO school_classes ("teacher_id", "class_name", "grade_range", "colour")
       VALUES ($1, $2, $3, $4)
       RETURNING "class_id", "teacher_id", "class_name", "grade_range", "colour", "is_active"`,
      [teacherId, className, gradeRange, colour],
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
    const allowed = ["class_name", "grade_range", "teacher_id", "colour"];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return this.findById(classId);

    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
    const values = keys.map((k) => fields[k]);

    const result = await this.pool.query(
      `UPDATE school_classes SET ${setClause} 
        WHERE "class_id" = $${keys.length + 1} 
        RETURNING "class_id", "teacher_id", "class_name", "grade_range", "colour", "is_active"`,
      [...values, classId],
    );
    return result.rows[0] || null;
  }

    /**
   * Activates or deactivates a class. Unlike Teacher/Guardian, this
   * updates school_classes directly. There's no backing users row to
   * join through.
   *
   * @param {number} classId
   * @param {boolean} isActive
   * @returns {Promise<Object|null>} { class_id, is_active }, or null if not found.
   */
  async setActive(classId, isActive) {
    const result = await this.pool.query(
      `UPDATE school_classes SET "is_active" = $2
       WHERE "class_id" = $1
       RETURNING "class_id", "is_active"`,
      [classId, isActive],
    );
    return result.rows[0] || null;
  }
}

export default SchoolClassRepository;
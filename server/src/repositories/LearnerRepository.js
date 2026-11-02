// repositories/LearnerRepository.js

// The pg driver turns DATE columns into JS Date objects, which reach the
// browser as "2018-03-14T00:00:00.000Z" (and can shift a day across time
// zones). Selecting the DOB as text keeps it a plain "YYYY-MM-DD".
const DOB = `TO_CHAR("date_of_birth", 'YYYY-MM-DD') AS "date_of_birth"`
const L_DOB = `TO_CHAR(l."date_of_birth", 'YYYY-MM-DD') AS "date_of_birth"`

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
            `SELECT l."learner_id", l."class_id", l."first_name", l."last_name",
                ${L_DOB}, l."can_walk_home_alone", l."is_active",
                c."class_name", c."grade_range", c."colour" AS "class_colour"
            FROM learners l
            JOIN school_classes c ON c."class_id" = l."class_id"
            WHERE l."learner_id" = $1`,
            [learnerId]
        );
        return result.rows[0] || null;
    }

  /**
   * Retrieves all learners a guardian is linked to via pickup permissions.
   * Used to restrict guardian accounts to their own children only.
   * Not filtered by is_active — a guardian should still see a child's
   * profile/history even if that child has since left (been deactivated).
   * 
   * @param {number} guardianId - The unique identifier of the guardian.
   * @returns {Promise<Array<Object>>} The learners linked to this guardian.
   */
  async findByGuardianId(guardianId) {
    const result = await this.pool.query(
      `SELECT l."learner_id", l."class_id", l."first_name", l."last_name",
              ${L_DOB}, l."can_walk_home_alone", l."is_active"
       FROM learners l
       INNER JOIN pickup_permissions p ON p."learner_id" = l."learner_id"
       WHERE p."guardian_id" = $1`,
      [guardianId]
    );
    return result.rows;
  }

    /**
   * Retrieves every learner across all classes, with their class name
   * attached. 
   * Used for the manager's learner-management view.
   * Includes inactive learners so managers can see and reactivate them if needed.
   *
   * @returns {Promise<Array<Object>>} All learners, ordered by class then surname.
   */
  async findAll() {
    const result = await this.pool.query(
      `SELECT l."learner_id", l."class_id", l."first_name", l."last_name",
              ${L_DOB}, l."can_walk_home_alone", l."is_active", c."class_name", c."grade_range",
              c."colour" AS "class_colour"
       FROM learners l
       JOIN school_classes c ON c."class_id" = l."class_id"
       ORDER BY c."class_name", l."last_name", l."first_name"`,
    );
    return result.rows;
  }

    /**
     * Retrieves a roster of learners enrolled in a specific class, sorted
     * alphabetically by surname. 
     * Excludes dateOfBirth, since this method is intended for roster/attendance views that do not require it.
     * Filtered to is_active - a deactivated/left learner should not appear
     * on a teacher's daily attendance roster.
     * 
     * @param {number} classId - The unique identifier of the class. 
     * @returns {Promise<Array<Object>>} A list of learners enrolled in the 
     * class, ordered by surname then first name.
     */
    async findByClassId(classId) {
    const result = await this.pool.query(
      `SELECT "learner_id", "first_name", "last_name", "can_walk_home_alone" 
      FROM learners 
      WHERE "class_id" = $1 AND "is_active" = true
      ORDER BY "last_name", "first_name"`,
      [classId]
    );
    return result.rows;
  }

/**
 * Finds a learner by full name and date of birth, for guardian
 * self-registration matching (Part 2 - name+DOB match; Part 3 will
 * replace this with something more secure).
 *
 * @param {string} fullName - e.g. "Thandiwe Mokoena"
 * @param {string} dateOfBirth - YYYY-MM-DD
 * @returns {Promise<Object|null>}
 */
async findByFullNameAndDob(fullName, dateOfBirth) {
  const result = await this.pool.query(
    `SELECT "learner_id", "class_id", "first_name", "last_name", ${DOB}, "can_walk_home_alone", "is_active"
     FROM learners
     WHERE LOWER(TRIM("first_name" || ' ' || "last_name")) = LOWER(TRIM($1))
       AND "date_of_birth" = $2`,
    [fullName, dateOfBirth]
  );
  return result.rows[0] || null;
}

  /**
   * Counts how many active learners are currently enrolled in a class.
   * Used by SchoolClassService to block deactivating a class that still
   * has active learners in it.
   *
   * @param {number} classId
   * @returns {Promise<number>} Number of active learners in the class.
   */
  async countActiveByClassId(classId) {
    const result = await this.pool.query(
      `SELECT COUNT(*) AS count
       FROM learners
       WHERE "class_id" = $1 AND "is_active" = true`,
      [classId],
    )
    return Number(result.rows[0].count)
  }

  /**
     * Creates a new learner record and enrolls them in the specified class.
     * is_active defaults to true at the database level.
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
       RETURNING "learner_id", "class_id", "first_name", "last_name", ${DOB}, "can_walk_home_alone", "is_active"`,
      [classId, firstName, lastName, dateOfBirth ?? null, canWalkHomeAlone ?? false]
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
     * update (any of: firstName, lastName, dateOfBirth, canWalkHomeAlone, classId, isActive).
     * @returns {Promise<Object|null>} The updated learner record, or the
     * unchanged record if no valid fields were provided, or null if the learner does not exist.
     */
  async update(learnerId, fields) {
    // Whitelist updatable columns so callers can't inject arbitrary column names
    const allowed = ['first_name', 'last_name', 'date_of_birth', 'can_walk_home_alone', 'class_id', 'is_active'];
    const keys = Object.keys(fields).filter(k => allowed.includes(k));
    if (keys.length === 0) return this.findById(learnerId);

    const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const values = keys.map(k => fields[k]);

    const result = await this.pool.query(
      `UPDATE learners SET ${setClause} 
      WHERE "learner_id" = $${keys.length + 1} 
      RETURNING "learner_id", "class_id", "first_name", "last_name", ${DOB}, "can_walk_home_alone", "is_active"`,
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

export default LearnerRepository;

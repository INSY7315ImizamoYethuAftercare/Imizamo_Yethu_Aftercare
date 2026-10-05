// repositories/PickupPermissionRepository.js

class PickupPermissionRepository {
    constructor(pool) {
        // pool is the shared Singleton PgPool instance
        this.pool = pool
    }

    /**
     * Retrieves a single pick up permission record by it's unique identifier.
     * 
     * @param {number} pickupPermissionId - The unique identifier of the pick up permission.
     * @returns {Promise<Object|null>} The pick up permissions record, or null if no pick up permission record exists with the given ID.
     */
    async findById(pickupPermissionId) {
        const result = await this.pool.query(
            `SELECT "permission_id", "learner_id", "guardian_id", "is_primary_contact", "authorised_date" 
            FROM  pickup_permissions
            WHERE "permission_id" = $1`,
            [pickupPermissionId]
        );
        return result.rows[0] || null;
    }

    /**
     * Verifies the guardian is authorised to pick up a learner. 
     * 
     * @param {number} learnerId - The unique identifier of the learner.
     * @param {number} guardianId - The unique identifier of the guardian.
     * A guardian whose account a manager has deactivated is never authorised.
     * A pickup person a parent added (no account, user_id NULL) is authorised.
     *
     * @returns {Promise<boolean>} - True if the guardian is authorised to collect the learner, false otherwise.
     */
    async verifyGuardian(learnerId, guardianId) {
        const result = await this.pool.query(
            `SELECT 1
            FROM pickup_permissions p
            JOIN guardians g ON g."guardian_id" = p."guardian_id"
            LEFT JOIN users u ON u."user_id" = g."user_id"
            WHERE p."learner_id" = $1 AND p."guardian_id" = $2
              AND (g."user_id" IS NULL OR u."is_active" = true)`,
            [learnerId, guardianId]
        );
        return result.rows.length > 0;
    }

    /**
     * The authorised pickups for several learners at once: active guardian
     * accounts, plus pickup people a parent added (they have no account). Names and relationships only (no contact numbers):
     * enough for staff to recognise who is at the door (POPIA).
     *
     * @param {number[]} learnerIds
     * @returns {Promise<Array<Object>>} { learner_id, guardian_id, full_name, relationship, is_primary_contact }
     */
    async findActiveByLearnerIds(learnerIds) {
        if (learnerIds.length === 0) return [];
        const result = await this.pool.query(
            `SELECT p."learner_id", g."guardian_id", g."full_name", g."relationship", p."is_primary_contact"
            FROM pickup_permissions p
            JOIN guardians g ON g."guardian_id" = p."guardian_id"
            LEFT JOIN users u ON u."user_id" = g."user_id"
            WHERE p."learner_id" = ANY($1::int[]) AND (g."user_id" IS NULL OR u."is_active" = true)
            ORDER BY p."is_primary_contact" DESC, g."full_name"`,
            [learnerIds]
        );
        return result.rows;
    }

    /**
     * Creates a new pick up permission authorisation.
     *
     * @param {Object} params - The new authorised pick up person's details.
     * @param {number} params.learnerId - The unique identifier of the learner that is being picked up.
     * @param {string} params.guardianId - The unique identifier of the guardian of the learner.
     * @param {string} params.isPrimaryContact - If the pick up person if the primary contact of the learner.
     * @param {string} params.authorisedDate - The authorised date.
     * @returns {Promise<boolean>} The newly created pick up person's record.
     */
  async create({ learnerId, guardianId, isPrimaryContact, authorisedDate, addedByGuardianId = null }) {
    const result = await this.pool.query(
      `INSERT INTO pickup_permissions ("learner_id", "guardian_id", "is_primary_contact", "authorised_date", "added_by_guardian_id")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING "permission_id", "learner_id", "guardian_id", "is_primary_contact", "authorised_date", "added_by_guardian_id"`,
      [learnerId, guardianId, isPrimaryContact, authorisedDate, addedByGuardianId]
    );
    return result.rows[0];
  }

 /**
     * Permanently deletes a pick up permission record.
     *
     * @param {number} pickupPermissionId - The unique identifier of the pick up permission to delete.
     * @returns {Promise<boolean>} True if a pick up permission was deleted, false if no matching permission was found.
     */
  async delete(pickupPermissionId) {
    const result = await this.pool.query(
      `DELETE FROM pickup_permissions WHERE "permission_id" = $1 
      RETURNING "permission_id"`,
      [pickupPermissionId]
    );
    return result.rowCount > 0;
  }
    
}

export default PickupPermissionRepository;
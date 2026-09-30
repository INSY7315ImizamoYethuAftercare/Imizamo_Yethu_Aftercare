/**
 * GuardianService
 *
 * Business logic for the Parent/Guardian portal. Implements US25: a
 * guardian must only ever be able to see information about their own
 * child or children, never another family's. Every method that returns
 * learner-specific data routes through #assertOwnsLearner, so this rule
 * cannot be accidentally skipped by a future method that forgets to check.
 */
export class GuardianService {
  constructor({ guardianRepository, learnerRepository, attendanceRepository, observationRepository }) {
    this.guardianRepository = guardianRepository
    this.learnerRepository = learnerRepository
    this.attendanceRepository = attendanceRepository
    this.observationRepository = observationRepository
  }

  /**
   * Confirms the logged-in user has a real Guardian record.
   *
   * @param {number} userId - The user_id from the verified JWT.
   * @returns {Promise<number>} The guardian's guardian_id.
   */
  async #getGuardianId(userId) {
    const guardian = await this.guardianRepository.findByUserId(userId)
    if (!guardian) {
      const err = new Error('Only guardians can perform this action')
      err.status = 403
      throw err
    }
    return guardian.guardian_id
  }

  /**
   * Central guard for US25. Confirms the requested learner is actually
   * one of this guardian's own children (via their pickup permissions)
   * before any child-specific data is returned. Every guardian-facing
   * method below calls this first.
   *
   * @param {number} userId
   * @param {number} learnerId - The learner being requested.
   * @returns {Promise<number>} The guardian's guardian_id, for reuse by the caller.
   */
  async #assertOwnsLearner(userId, learnerId) {
    const guardianId = await this.#getGuardianId(userId)
    const children = await this.learnerRepository.findByGuardianId(guardianId)
    const owns = children.some((child) => child.learner_id === Number(learnerId))
    if (!owns) {
      const err = new Error('You can only view information for your own children')
      err.status = 403
      throw err
    }
    return guardianId
  }

  /**
   * Lists all learners linked to the logged-in guardian.
   *
   * @param {number} userId
   * @returns {Promise<Array<Object>>} This guardian's own children.
   */
  async getMyChildren(userId) {
    const guardianId = await this.#getGuardianId(userId)
    return this.learnerRepository.findByGuardianId(guardianId)
  }

  /**
   * Retrieves one child's profile, after confirming the requester is
   * actually that child's guardian.
   */
  async getChildProfile({ userId, learnerId }) {
    await this.#assertOwnsLearner(userId, learnerId)
    return this.learnerRepository.findById(learnerId)
  }

  /**
   * Retrieves one child's development observations, after confirming the
   * requester is actually that child's guardian.
   */
  async getChildObservations({ userId, learnerId }) {
    await this.#assertOwnsLearner(userId, learnerId)
    return this.observationRepository.findByLearnerId(learnerId)
  }
}
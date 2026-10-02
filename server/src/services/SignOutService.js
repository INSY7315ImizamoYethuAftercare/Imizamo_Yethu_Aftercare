/**
 * SignOutService
 *
 * Business logic for the digital sign-out (collection) flow. Any teacher
 * may verify or confirm a sign-out for any learner — this is deliberate,
 * not an oversight, since a substitute or another class's teacher may be
 * the one covering pickup for a particular child (see US-19). The safety
 * check that matters here is not "does this teacher own this class", but
 * "is this specific guardian actually allowed to collect this specific
 * learner", which is enforced on every call.
 */
export class SignOutService {

  //
  constructor({ signOutRepository, pickupPermissionRepository, teacherRepository, learnerRepository }) {
    this.signOutRepository = signOutRepository
    this.pickupPermissionRepository = pickupPermissionRepository
    this.teacherRepository = teacherRepository
    this.learnerRepository = learnerRepository
  }

  /**
   * Confirms the logged-in user has a real Teacher record.
   *
   * @param {number} userId - The user_id from the verified JWT.
   * @returns {Promise<number>} The teacher's teacher_id.
   */
  async #getTeacherId(userId) {

    const teacher = await this.teacherRepository.findByUserId(userId)

    if (!teacher) {
      const err = new Error('Only teachers can sign learners out')
      err.status = 403
      throw err
    }

    return teacher.teacher_id
  }

  /**
   * Checks whether a guardian is authorised to collect a learner, without
   * writing anything. Used by the UI to show a clear "authorised" or
   * "not authorised" result before the teacher confirms the collection,
   * and returns the learner's walk-home-alone status so a teacher can
   * make a quick, informed safety decision during busy collection times.
   *
   * @param {Object} params
   * @param {number} params.userId - The requesting teacher's user id.
   * @param {number} params.learnerId
   * @param {number} params.guardianId - The guardian attempting collection.
   * @returns {Promise<Object>} { authorised, learnerId, guardianId, canWalkHomeAlone, message }
   */
  async verifyGuardian({ userId, learnerId, guardianId }) {

    await this.#getTeacherId(userId)

    const learner = await this.learnerRepository.findById(learnerId)

    if (!learner) {
      const err = new Error('Learner not found')
      err.status = 404
      throw err
    }

    const authorised = await this.pickupPermissionRepository.verifyGuardian(learnerId, guardianId)

    return {
      authorised,
      learnerId,
      guardianId,
      canWalkHomeAlone: learner.can_walk_home_alone,
      message: authorised
        ? 'Guardian is authorised to collect this learner'
        : 'This person is not authorised to collect this learner. Escalate to the manager.',
    }
  }

  /**
   * Records a learner's collection. Re-checks authorisation independently
   * of verifyGuardian() (never trusts a prior client-side check) and
   * blocks the write entirely if the guardian is not on the learner's
   * pickup permission list.
   *
   * @param {Object} params
   * @param {number} params.userId - The requesting teacher's user id.
   * @param {number} params.learnerId
   * @param {number} params.guardianId - The guardian collecting the learner.
   * @param {string} params.timeOut - Time of collection.
   * @param {string} params.recordDate - Date (YYYY-MM-DD) of collection.
   * @returns {Promise<Object>} The created sign-out record.
   */
  async confirmSignOut({ userId, learnerId, guardianId, timeOut, recordDate }) {

    const teacherId = await this.#getTeacherId(userId)

    const authorised = await this.pickupPermissionRepository.verifyGuardian(learnerId, guardianId)
    
    if (!authorised) {
      const err = new Error('This person is not authorised to collect this learner. Escalate to the manager.')
      err.status = 403
      throw err
    }

    return this.signOutRepository.create({ learnerId, teacherId, guardianId, recordDate, timeOut })
  }
}
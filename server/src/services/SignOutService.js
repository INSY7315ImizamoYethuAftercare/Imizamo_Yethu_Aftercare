export class SignOutService {

  //
  constructor({ signOutRepository, pickupPermissionRepository, teacherRepository, learnerRepository }) {
    this.signOutRepository = signOutRepository
    this.pickupPermissionRepository = pickupPermissionRepository
    this.teacherRepository = teacherRepository
    this.learnerRepository = learnerRepository
  }

  /**
   * 
   * @param {*} userId 
   * @returns 
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
   * Checks whether this guardian may collect this learner, without writing anything.
   * The teacher calls this before confirming a collection.
   * 
   * @param {*} 
   * @returns
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
   * Records the collection. Blocks the write if the guardian is not on the
   * learner's pickup permission list.
   * 
   * @param {*} param0 
   * @returns 
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
export class GuardianService {
  constructor({ guardianRepository, learnerRepository, attendanceRepository, observationRepository }) {
    this.guardianRepository = guardianRepository
    this.learnerRepository = learnerRepository
    this.attendanceRepository = attendanceRepository
    this.observationRepository = observationRepository
  }

  async #getGuardianId(userId) {
    const guardian = await this.guardianRepository.findByUserId(userId)
    if (!guardian) {
      const err = new Error('Only guardians can perform this action')
      err.status = 403
      throw err
    }
    return guardian.guardian_id
  }

  // Central guard for US25. Every guardian request goes through this, so a
  // guardian can never read data about a learner who is not their own child.
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

  async getMyChildren(userId) {
    const guardianId = await this.#getGuardianId(userId)
    return this.learnerRepository.findByGuardianId(guardianId)
  }

  async getChildProfile({ userId, learnerId }) {
    await this.#assertOwnsLearner(userId, learnerId)
    return this.learnerRepository.findById(learnerId)
  }

  async getChildObservations({ userId, learnerId }) {
    await this.#assertOwnsLearner(userId, learnerId)
    return this.observationRepository.findByLearnerId(learnerId)
  }
}
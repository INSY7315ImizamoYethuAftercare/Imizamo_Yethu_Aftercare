export class LearnerService {
  constructor({ learnerRepository, schoolClassRepository, managerRepository }) {
    this.learnerRepository = learnerRepository
    this.schoolClassRepository = schoolClassRepository
    this.managerRepository = managerRepository
  }

  async #assertIsManager(userId) {
    const manager = await this.managerRepository.findByUserId(userId)
    if (!manager) {
      const err = new Error('Only managers can manage learners')
      err.status = 403
      throw err
    }
    return manager
  }

  async listLearners({ userId }) {
    await this.#assertIsManager(userId)
    return this.learnerRepository.findAll()
  }

  async createLearner({ userId, classId, firstName, lastName, dateOfBirth, canWalkHomeAlone }) {
    await this.#assertIsManager(userId)
    const schoolClass = await this.schoolClassRepository.findById(classId)
    if (!schoolClass) {
      const err = new Error('Class not found')
      err.status = 404
      throw err
    }
    return this.learnerRepository.create({
      classId, firstName, lastName, dateOfBirth, canWalkHomeAlone,
    })
  }

  async updateLearner({ userId, learnerId, fields }) {
    await this.#assertIsManager(userId)
    const updated = await this.learnerRepository.update(learnerId, fields)
    if (!updated) {
      const err = new Error('Learner not found')
      err.status = 404
      throw err
    }
    return updated
  }

  async deleteLearner({ userId, learnerId }) {
    await this.#assertIsManager(userId)
    const deleted = await this.learnerRepository.delete(learnerId)
    if (!deleted) {
      const err = new Error('Learner not found')
      err.status = 404
      throw err
    }
  }
}
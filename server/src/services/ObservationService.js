export class ObservationService {
  
  //
  constructor({ observationRepository, learnerRepository, schoolClassRepository, teacherRepository }) {
    this.observationRepository = observationRepository
    this.learnerRepository = learnerRepository
    this.schoolClassRepository = schoolClassRepository
    this.teacherRepository = teacherRepository
  }


  /**
   * 
   * @param {*} userId 
   * @param {*} learnerId 
   * @returns 
   */
  async #assertOwnsLearner(userId, learnerId) {

    const teacher = await this.teacherRepository.findByUserId(userId)

    if (!teacher) {
      const err = new Error('Only teachers can record observations')
      err.status = 403
      throw err
    }

    const learner = await this.learnerRepository.findById(learnerId)

    if (!learner) {
      const err = new Error('Learner not found')
      err.status = 404
      throw err
    }

    const schoolClass = await this.schoolClassRepository.findById(learner.class_id)

    if (!schoolClass || schoolClass.teacher_id !== teacher.teacher_id) {
      const err = new Error('You can only record observations for learners in your own class')
      err.status = 403
      throw err
    }

    return teacher
  }


  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async addObservation({ userId, learnerId, category, rating, notes, recordDate }) {

    const teacher = await this.#assertOwnsLearner(userId, learnerId)

    return this.observationRepository.create({
      learnerId, teacherId: teacher.teacher_id, recordDate, category, rating, notes,
    })

  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async getLearnerObservations({ userId, learnerId }) {

    await this.#assertOwnsLearner(userId, learnerId)

    return this.observationRepository.findByLearnerId(learnerId)
  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async updateObservation({ userId, observationId, learnerId, fields }) {

    await this.#assertOwnsLearner(userId, learnerId)

    const updated = await this.observationRepository.update(observationId, fields)

    if (!updated) {
      const err = new Error('Observation not found')
      err.status = 404
      throw err
    }
    
    return updated
  }

  /**
   * 
   * @param {*} param0 
   */
  async deleteObservation({ userId, observationId, learnerId }) {

    await this.#assertOwnsLearner(userId, learnerId)

    const deleted = await this.observationRepository.delete(observationId)

    return updated
  }

  /**
   * 
   * @param {*} param0 
   */
  async deleteObservation({ userId, observationId, learnerId }) {

    await this.#assertOwnsLearner(userId, learnerId)

    const deleted = await this.observationRepository.delete(observationId)

    if (!deleted) {
      const err = new Error('Observation not found')
      err.status = 404
      throw err
    }
  }
}
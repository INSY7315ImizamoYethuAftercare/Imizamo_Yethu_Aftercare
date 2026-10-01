export class ObservationService {
  
  //
  constructor({ observationRepository, learnerRepository, schoolClassRepository, teacherRepository }) {
    this.observationRepository = observationRepository
    this.learnerRepository = learnerRepository
    this.schoolClassRepository = schoolClassRepository
    this.teacherRepository = teacherRepository
  }


 /**
   * Confirms the caller is a registered teacher and the learner exists.
   * Does NOT restrict by class assignment — any teacher may record or
   * view observations for any learner (teachers are not confined to a
   * single assigned class in this system).
   *
   * @param {*} userId
   * @param {*} learnerId
   * @returns {Promise<Object>} The teacher record.
   */
  async #assertIsTeacher(userId, learnerId) {

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

    return teacher
  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async addObservation({ userId, learnerId, category, rating, notes, recordDate }) {

    const teacher = await this.#assertIsTeacher(userId, learnerId)

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

    await this.#assertIsTeacher(userId, learnerId)

    return this.observationRepository.findByLearnerId(learnerId)
  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async updateObservation({ userId, observationId, fields }) {

    const teacher = await this.teacherRepository.findByUserId(userId)

    if (!teacher) {
      const err = new Error('Only teachers can update observations')
      err.status = 403
      throw err
    }

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
  async deleteObservation({ userId, observationId }) {

     const teacher = await this.teacherRepository.findByUserId(userId)
    if (!teacher) {
      const err = new Error('Only teachers can delete observations')
      err.status = 403
      throw err
    }

    const deleted = await this.observationRepository.delete(observationId)

    if (!deleted) {
      const err = new Error('Observation not found')
      err.status = 404
      throw err
    }
  }
}
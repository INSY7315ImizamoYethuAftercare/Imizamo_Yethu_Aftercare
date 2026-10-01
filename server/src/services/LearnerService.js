export class LearnerService {
  constructor({ learnerRepository, schoolClassRepository, managerRepository }) {
    this.learnerRepository = learnerRepository;
    this.schoolClassRepository = schoolClassRepository;
    this.managerRepository = managerRepository;
  }

  /**
   *
   * @param {*} userId
   * @returns
   */
  async #assertIsManager(userId) {
    const manager = await this.managerRepository.findByUserId(userId);

    if (!manager) {
      const err = new Error("Only managers can manage learners");
      err.status = 403;
      throw err;
    }

    return manager;
  }

  /**
   *
   * @param {*} param0
   * @returns
   */
  async listLearners({ userId }) {
    await this.#assertIsManager(userId);

    return this.learnerRepository.findAll();
  }

  /**
   *
   * @param {*} param0
   * @returns
   */
  async createLearner({
    userId,
    classId,
    firstName,
    lastName,
    dateOfBirth,
    canWalkHomeAlone,
  }) {
    await this.#assertIsManager(userId);

    const schoolClass = await this.schoolClassRepository.findById(classId);

    if (!schoolClass) {
      const err = new Error("Class not found");
      err.status = 404;
      throw err;
    }

    return this.learnerRepository.create({
      classId,
      firstName,
      lastName,
      dateOfBirth,
      canWalkHomeAlone,
    });
  }

  /**
   * This method updates a learner.
   * It enforces manager-only access.
   * If the update includes moving the learner to a different class,
   * validates that the new class exists.
   *
   * @param {Object} params
   * @param {number} params.userId - The unique identifier of the user making the update request.
   * @param {number} params.learnerId - The unique identifier of the learner to update.
   * @param {Object} params.fields - The fields to update.
   *
   * @returns {Promise<Object>} The updated learner record.
   *
   * @throws {Error} 404 if the learner does not exist.
   * @throws {Error} 404 if fields.class_id is provided and no class exists with that id.
   */
  async updateLearner({ userId, learnerId, fields }) {

    await this.#assertIsManager(userId)

    if (fields.class_id !== undefined) {
      const schoolClass = await this.schoolClassRepository.findById(fields.class_id)

      if (!schoolClass) {
        const err = new Error('Class not found')
        err.status = 404
        throw err
      }
    }

    const updated = await this.learnerRepository.update(learnerId, fields)

    if (!updated) {
      const err = new Error('Learner not found')
      err.status = 404
      throw err
    }

    return updated
  }

    /**
   * This method deletes a learner.
   * It enforces manager-only access.
   * Returns 409 status code when the learner still has dependent records
   * (attendance, observations, pickup permissions, or sign-out records).
   *
   * @param {Object} params - The delete details
   * @param {number} params.userId - The unique identifier of the user making the delete request.
   * @param {number} params.learnerId - The unique identifier of the learner to delete.
   *
   * @throws {Error} 404 if no learner exists with the given learnerId.
   * @throws {Error} 409 if the learner still has dependent records.
   */
  async deleteLearner({ userId, learnerId }) {

    await this.#assertIsManager(userId)

    try {
      const deleted = await this.learnerRepository.delete(learnerId)

      if (!deleted) {
        const err = new Error('Learner not found')
        err.status = 404
        throw err
      }

    } catch (err) {
      if (err.code === '23503') {
        const conflictErr = new Error('Cant delete this learner - there are dependent records (attendance, observations, pickup permissions, or sign-outs) linked to this learner')
        conflictErr.status = 409
        throw conflictErr
      }

      throw err
    }
  }
}

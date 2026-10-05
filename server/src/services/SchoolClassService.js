export class SchoolClassService {

  // Constructor that takes in all the repository classes needed in this service.
  constructor({ schoolClassRepository, managerRepository, teacherRepository, learnerRepository }) {
    this.schoolClassRepository = schoolClassRepository
    this.managerRepository = managerRepository
    this.teacherRepository = teacherRepository
    this.learnerRepository = learnerRepository
  }

  /**
   * 
   * @param {*} userId 
   */
  async #assertIsManager(userId) {

    const manager = await this.managerRepository.findByUserId(userId)

    if (!manager) {
      const err = new Error('Only managers can manage classes')
      err.status = 403
      throw err
    }
  }

  /**
   * 
   * @param {*} userId 
   */
  async #assertIsTeacherOrManager(userId) {
    const teacher = await this.teacherRepository.findByUserId(userId)
    const manager = await this.managerRepository.findByUserId(userId)

    if (!teacher && !manager) {
        const err = new Error('Only teachers and managers can perform this action')
        err.status = 403
        throw err
    }
  }

  /**
   * Retrieves a single class's details by its unique identifier.
   * Restricted to callers who are a registered teacher or manager.
   * 
   * @param {Object} params - The request details.
   * @param {number} params.userId - The unique identifier of the user making the request
   * @param {number} params.classId - The unique identifier of the class being requested
   * 
   * @returns {Promise<Object>} The class record.
   */
  async getClass({ userId, classId }) {

    await this.#assertIsTeacherOrManager(userId)

    const schoolClass = await this.schoolClassRepository.findById(classId)

    if (!schoolClass) {
        const err = new Error('Class not found')
        err.status = 404
        throw err
    }
    return schoolClass
  }

  /**
   * This method retrieves all the class's 
   * Restricted to callers who are a registered teacher or manager.
   * 
   * @param {Object} params - A list of all the classes 
   * @param {number} params.userId - The unique identifier of the user making the request.
   * 
   * @returns {Promise<Array<Object>>} - A list of all classes
   */
  async listClasses({ userId, includeInactive = false }) {

    await this.#assertIsTeacherOrManager(userId)

    return this.schoolClassRepository.findAll({ includeInactive })
  }

  /**
   * This method creates a new school class
   * It enforces manager-only access
   * 
   * @param {Object} params - The new class details
   * @param {number} params.userId - The unique identifier of the user making the create request.
   * @param {number} params.teacherId - The unique identifier of the teacher that is assigned to the new class.
   * @param {Object} params.className - The name of the new class.
   * @param {Object} params.gradeRange - The grade range of the new class.
   * @param {string|null} [params.colour] - The class colour as a hex code (e.g. #FFD166).
   * 
   * @returns {Promise<Object>} The new class record.
   */
  async createClass({ userId, teacherId, className, gradeRange, colour = null }) {

    await this.#assertIsManager(userId)

    if (teacherId !== undefined && teacherId !== null) {
      const teacher = await this.teacherRepository.findById(teacherId)
      if (!teacher) {
        const err = new Error('Teacher not found')
        err.status = 404
        throw err
      }
    }

    try {
      return await this.schoolClassRepository.create({ teacherId: teacherId ?? null, className, gradeRange, colour })
    } catch (err) {
      if (err.code === '23505') {
        const conflictErr = new Error('An active class with this name already exists')
        conflictErr.status = 409
        throw conflictErr
      }
      throw err
    }
  }

  /**
   * This method updates a school class.
   * It enforces manager-only access
   * 
   * @param {Object} params - The updated details
   * @param {number} params.userId - This unique identifier of the user making the update request.
   * @param {number} params.classId -  The unique identifier of the class which is requested to be updated.
   * 
   * @returns {Promise<Object>} The updated class record
   */
  async updateClass({ userId, classId, fields }) {

    await this.#assertIsManager(userId)

    // Assigning a teacher: make sure they exist (null just clears the assignment).
    if (fields.teacher_id !== undefined && fields.teacher_id !== null) {
      const teacher = await this.teacherRepository.findById(fields.teacher_id)
      if (!teacher) {
        const err = new Error('Teacher not found')
        err.status = 404
        throw err
      }
    }

    let updated
    try {
      updated = await this.schoolClassRepository.update(classId, fields)
    } catch (err) {
      if (err.code === '23505') {
        const conflictErr = new Error('An active class with this name already exists')
        conflictErr.status = 409
        throw conflictErr
      }
      throw err
    }

    if (!updated) {
      const err = new Error('Class not found')
      err.status = 404
      throw err
    }
    return updated
  }

  /** 
   * This method retrieves the full learner roster for a class.
   * Restricted to callers who are a registered teacher or manager.
   * 
   * @param {Object} params - The request details.
   * @param {number} params.userId - The unique identifier of the logged-in user making request.
   * @param {number} params.classId - The unique identifier of the class whose roster is being requested.
   * 
   * @returns {Promise<Array<Object>>} - A list of learners enrolled in the class. 
   * Throws a 403 error code if the caller is not a teacher or a manager.
   * Throws a 404 if the class doesn't exist.
   */
   async getClassRoster({ userId, classId }) {

    await this.#assertIsTeacherOrManager(userId)

    const schoolClass = await this.schoolClassRepository.findById(classId)

    if (!schoolClass) {
      const err = new Error('Class not found')
      err.status = 404
      throw err
    }
    
    return this.learnerRepository.findByClassId(classId)
  }

  /**
   * Deactivates a class. Blocked if any active learners are still
   * enrolled in it — unlike Teacher/Guardian, this is an application-level
   * check, not a database FK constraint (deactivating a class never
   * touches the learners table).
   */
  async deactivateClass({ userId, classId }) {

    await this.#assertIsManager(userId)

    const schoolClass = await this.schoolClassRepository.findById(classId)
    if (!schoolClass) {
      const err = new Error('Class not found')
      err.status = 404
      throw err
    }

    const activeLearnerCount = await this.learnerRepository.countActiveByClassId(classId)
    if (activeLearnerCount > 0) {
      const err = new Error('Cannot deactivate this class - there are active learners enrolled in it')
      err.status = 409
      throw err
    }

    return this.schoolClassRepository.setActive(classId, false)
  }

  /**
   * Reactivates a class. Can fail if another active class already holds
   * this name (uq_school_classes_active_name).
   */
  async activateClass({ userId, classId }) {

    await this.#assertIsManager(userId)

    try {
      const updated = await this.schoolClassRepository.setActive(classId, true)
      if (!updated) {
        const err = new Error('Class not found')
        err.status = 404
        throw err
      }
      return updated
    } catch (err) {
      if (err.code === '23505') {
        const conflictErr = new Error('Cannot reactivate this class - another active class already has this name')
        conflictErr.status = 409
        throw conflictErr
      }
      throw err
    }
  }
}
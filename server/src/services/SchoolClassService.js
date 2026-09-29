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
  async listClasses({ userId }) {

    await this.#assertIsTeacherOrManager(userId)

    return this.schoolClassRepository.findAll()
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
   * 
   * @returns {Promise<Object>} The new class record.
   */
  async createClass({ userId, teacherId, className, gradeRange }) {

    await this.#assertIsManager(userId)

    const teacher = await this.teacherRepository.findById(teacherId)

    if (!teacher) {
      const err = new Error('Teacher not found')
      err.status = 404
      throw err
    }
    return this.schoolClassRepository.create({ teacherId, className, gradeRange })
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

    const updated = await this.schoolClassRepository.update(classId, fields)

    if (!updated) {
      const err = new Error('Class not found')
      err.status = 404
      throw err
    }
    return updated
  }

  /**
   * This method deletes a school class.
   * It enforces manager-only accesss.
   * Returns 409 status code when learners are still enrolled in the class.
   * 
   * @param {Object} params - The deleted detials
   * @param {number} params.userId - The unique identifier of the user making the delete request.
   * @param {number} params.classId -  The unique identifier of the class which is requested to be deleted.
   * 
   * @returns {Promise<boolean>} - Returns true if the class was deleted successfully.
   * 
   * @throws {Error} 404 if no class exists with the given classId.
   * @throws {Error} 409 if the class still has learners enrolled.
   */
  async deleteClass({ userId, classId }) {

    await this.#assertIsManager(userId)

    try {
        const deleted = await this.schoolClassRepository.delete(classId)

        if (!deleted) {
            const err = new Error('Class not found')
            err.status = 404
            throw err
        }
        return deleted

    } catch (err) {
         if (err.code === '23503') {
            const conflictErr = new Error('Cant delete this class - there are learners enrolled in this class')
            conflictErr.status = 409
            throw conflictErr
        }

        throw err
    }
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

}
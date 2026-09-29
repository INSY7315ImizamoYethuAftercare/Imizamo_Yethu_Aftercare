export class SchoolClassService {
  constructor({ schoolClassRepository, managerRepository, teacherRepository, learnerRepository }) {
    this.schoolClassRepository = schoolClassRepository
    this.managerRepository = managerRepository
    this.teacherRepository = teacherRepository
    this.learnerRepository = learnerRepository
  }

  async #assertIsManager(userId) {
    const manager = await this.managerRepository.findByUserId(userId)
    if (!manager) {
      const err = new Error('Only managers can manage classes')
      err.status = 403
      throw err
    }
  }

  async listClasses({ userId }) {
    await this.#assertIsManager(userId)
    return this.schoolClassRepository.findAll()
  }

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

  async deleteClass({ userId, classId }) {
    await this.#assertIsManager(userId)
    const deleted = await this.schoolClassRepository.delete(classId)
    if (!deleted) {
      const err = new Error('Class not found')
      err.status = 404
      throw err
    }
  }

   async getClassRoster({ userId, classId }) {
    const teacher = await this.teacherRepository.findByUserId(userId)
    if (!teacher) {
      const err = new Error('Only teachers can view a class roster')
      err.status = 403
      throw err
    }
    const schoolClass = await this.schoolClassRepository.findById(classId)
    if (!schoolClass )
    {
      const err = new Error('Class not found')
      err.status = 404
      throw err
    }
    return this.learnerRepository.findByClassId(classId)
  }

}
import bcrypt from 'bcryptjs'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

export class TeacherService {

  //   
  constructor({ teacherRepository, managerRepository, userRepository }) {
    this.teacherRepository = teacherRepository
    this.managerRepository = managerRepository
    this.userRepository = userRepository
  }

  /**
   * 
   * @param {*} userId 
   */
  async #assertIsManager(userId) {

    const manager = await this.managerRepository.findByUserId(userId)

    if (!manager) 
        throw httpError(403, 'Only managers can manage teacher accounts')
  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async listTeachers({ userId }) {

    await this.#assertIsManager(userId)

    return this.teacherRepository.findAll()
  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async createTeacher({ userId, email, password, fullName }) {

    await this.#assertIsManager(userId)

    if (password.length < 8) 
        throw httpError(400, 'Password must be at least 8 characters')

    if (await this.userRepository.findByEmail(email)) {
      throw httpError(409, 'An account with this email already exists')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await this.userRepository.createUser({ email, role: 'teacher', passwordHash, fullName })

    return this.teacherRepository.create({ userId: newUser.user_id, fullName, contactEmail: email })
  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async setTeacherActive({ userId, teacherId, isActive }) {

    await this.#assertIsManager(userId)

    const updated = await this.teacherRepository.setActive(teacherId, isActive)

    if (!updated) 
        throw httpError(404, 'Teacher not found')

    return updated
  }
}
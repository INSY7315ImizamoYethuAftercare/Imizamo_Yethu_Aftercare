import bcrypt from 'bcryptjs'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

export class TeacherAccountService {
  constructor({ teacherAccountRepository, managerRepository, userRepository }) {
    this.teacherAccountRepository = teacherAccountRepository
    this.managerRepository = managerRepository
    this.userRepository = userRepository
  }

  async #assertIsManager(userId) {
    const manager = await this.managerRepository.findByUserId(userId)
    if (!manager) throw httpError(403, 'Only managers can manage teacher accounts')
  }

  async listTeachers({ userId }) {
    await this.#assertIsManager(userId)
    return this.teacherAccountRepository.findAll()
  }

  async createTeacher({ userId, email, password, fullName }) {
    await this.#assertIsManager(userId)
    if (password.length < 8) throw httpError(400, 'Password must be at least 8 characters')
    if (await this.userRepository.findByEmail(email)) {
      throw httpError(409, 'An account with this email already exists')
    }
    const passwordHash = await bcrypt.hash(password, 10)
    return this.teacherAccountRepository.create({ email, passwordHash, fullName })
  }

  async setTeacherActive({ userId, teacherId, isActive }) {
    await this.#assertIsManager(userId)
    const updated = await this.teacherAccountRepository.setActive(teacherId, isActive)
    if (!updated) throw httpError(404, 'Teacher not found')
    return updated
  }
}
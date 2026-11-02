import bcrypt from "bcryptjs";

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export class TeacherService {
  //
  constructor({ teacherRepository, managerRepository, userRepository }) {
    this.teacherRepository = teacherRepository;
    this.managerRepository = managerRepository;
    this.userRepository = userRepository;
  }

  /**
   *
   * @param {*} userId
   */
  async #assertIsManager(userId) {
    const manager = await this.managerRepository.findByUserId(userId);

    if (!manager)
      throw httpError(403, "Only managers can manage teacher accounts");
  }

  /**
   *
   * @param {*} param0
   * @returns
   */
  async createTeacher({ userId, email, password, fullName, contactEmail }) {
    await this.#assertIsManager(userId);

    const existing = await this.userRepository.findByEmail(email);

    if (existing) {
      throw httpError(409, "An account with this email already exists");
    }

    if (password.length < 8)
      throw httpError(400, "Password must be at least 8 characters");

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.userRepository.createUser({
      email,
      role: "teacher",
      passwordHash,
      fullName,
      isActive: true,
      // The manager picks the starting password, so the teacher chooses their own at first sign-in.
      mustChangePassword: true,
    });

    return this.teacherRepository.create({
      userId: user.user_id,
      fullName,
      contactEmail,
    });
  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async updateTeacher({ userId, teacherId, fields }) {

    await this.#assertIsManager(userId);

    const updated = await this.teacherRepository.update(teacherId, fields);

    if (!updated) {
      throw httpError(404, "Teacher not found");
    }
    return updated;
  }

  /**
   *
   * @param {*} param0
   * @returns
   */
  async listTeachers({ userId }) {
    await this.#assertIsManager(userId);

    return this.teacherRepository.findAll();
  }

  /**
   *
   * @param {*} param0
   * @returns
   */
  async setTeacherActive({ userId, teacherId, isActive }) {
    await this.#assertIsManager(userId);

    const updated = await this.teacherRepository.setActive(teacherId, isActive);

    if (!updated) throw httpError(404, "Teacher not found");

    return updated;
  }
}

export class AttendanceService {
  constructor({ attendanceRepository, schoolClassRepository, teacherRepository }) {
    this.attendanceRepository = attendanceRepository
    this.schoolClassRepository = schoolClassRepository
    this.teacherRepository = teacherRepository
  }

  async #assertOwnsClass(userId, classId) {
    const teacher = await this.teacherRepository.findByUserId(userId)
    if (!teacher) {
      const err = new Error('Only teachers can perform this action')
      err.status = 403
      throw err
    }
    const schoolClass = await this.schoolClassRepository.findById(classId)
    if (!schoolClass || schoolClass.teacher_id !== teacher.teacher_id) {
      const err = new Error('You can only manage attendance for your own class')
      err.status = 403
      throw err
    }
    return teacher
  }

  async recordAttendance({ userId, classId, learnerId, status, timeIn, recordDate }) {
    const teacher = await this.#assertOwnsClass(userId, classId)

    try {
      if (status === 'present') {
        return await this.attendanceRepository.markPresent({ learnerId, teacherId: teacher.teacher_id, recordDate, timeIn })
      }
      if (status === 'absent') {
        return await this.attendanceRepository.markAbsent({ learnerId, teacherId: teacher.teacher_id, recordDate })
      }
      const err = new Error('status must be either "present" or "absent"')
      err.status = 400
      throw err
    } catch (err) {
      if (err.code === '23505') {
        const conflict = new Error('Attendance has already been recorded for this learner today')
        conflict.status = 409
        throw conflict
      }
      throw err
    }
  }

  async getClassAttendance({ userId, classId, date }) {
    await this.#assertOwnsClass(userId, classId)
    return this.attendanceRepository.findByClassAndDate(classId, date)
  }
}
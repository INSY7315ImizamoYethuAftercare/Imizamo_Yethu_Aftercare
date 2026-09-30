import { TeacherAccountService } from '../services/TeacherAccountService.js'
import TeacherAccountRepository from '../repositories/TeacherAccountRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import UserRepository from '../repositories/UserRepository.js'
import { pool } from '../db/pool.js'

const service = new TeacherAccountService({
  teacherAccountRepository: new TeacherAccountRepository(pool),
  managerRepository: new ManagerRepository(pool),
  userRepository: new UserRepository(pool),
})

export async function listTeachers(req, res, next) {
  try {
    res.json(await service.listTeachers({ userId: req.user.userId }))
  } catch (err) { next(err) }
}

export async function createTeacher(req, res, next) {
  try {
    const { email, password, fullName } = req.body
    if (!email || !password || !fullName) {
      const err = new Error('email, password and fullName are required')
      err.status = 400
      throw err
    }
    const teacher = await service.createTeacher({ userId: req.user.userId, email, password, fullName })
    res.status(201).json(teacher)
  } catch (err) { next(err) }
}

const setActive = (isActive) => async (req, res, next) => {
  try {
    const result = await service.setTeacherActive({
      userId: req.user.userId, teacherId: Number(req.params.teacherId), isActive,
    })
    res.json(result)
  } catch (err) { next(err) }
}
export const deactivateTeacher = setActive(false)
export const activateTeacher = setActive(true)
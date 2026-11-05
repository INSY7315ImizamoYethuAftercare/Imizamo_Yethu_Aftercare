// teacherController.js

import { TeacherService } from '../services/TeacherService.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import UserRepository from '../repositories/UserRepository.js'
import { pool } from '../db/pool.js'

const service = new TeacherService({
  teacherRepository: new TeacherRepository(pool),
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
    // contactEmail defaults to email in the schema.
    const { email, password, fullName, contactEmail } = req.validated.body
    const teacher = await service.createTeacher({ userId: req.user.userId, email, password, fullName, contactEmail })
    res.status(201).json(teacher)
  } catch (err) { next(err) }
}

export async function updateTeacher(req, res, next) {
  try {
    // The schema has already refused an empty edit and renamed the keys to column names.
    const teacher = await service.updateTeacher({
      userId: req.user.userId,
      teacherId: req.validated.params.teacherId,
      fields: req.validated.body,
    })
    res.json(teacher)
  } catch (err) { next(err) }
}

const setActive = (isActive) => async (req, res, next) => {
  try {
    const result = await service.setTeacherActive({
      userId: req.user.userId, teacherId: req.validated.params.teacherId, isActive,
    })
    res.json(result)
  } catch (err) { next(err) }
}
export const deactivateTeacher = setActive(false)
export const activateTeacher = setActive(true)
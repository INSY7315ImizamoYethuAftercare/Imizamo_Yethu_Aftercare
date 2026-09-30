// teacherController.js

import { TeacherService } from '../services/TeacherService.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import UserRepository from '../repositories/UserRepository.js'
import { pool } from '../db/postgresql/pool.js'

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
    const { email, password, fullName } = req.body
    if (!email || !password || !fullName || !contactEmail) {
      const err = new Error('email, password and fullName and contactEmail are required')
      err.status = 400
      throw err
    }
    const teacher = await service.createTeacher({ userId: req.user.userId, email, password, fullName, contactEmail })
    res.status(201).json(teacher)

  } catch (err) {
     next(err) 
    }
}

export async function updateTeacher(req, res, next) {
  try {
    const { fullName, contactEmail } = req.body
    const fields = {}
    if (fullName !== undefined) fields.full_name = fullName
    if (contactEmail !== undefined) fields.contact_email = contactEmail

    if (Object.keys(fields).length === 0) {
      const err = new Error('At least one of fullName or contactEmail is required')
      err.status = 400
      throw err
    }

    const teacher = await service.updateTeacher({
      userId: req.user.userId,
      teacherId: Number(req.params.teacherId),
      fields,
    })
    res.json(teacher)
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
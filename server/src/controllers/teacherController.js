// teacherController.js

import { TeacherService } from '../services/TeacherService.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import UserRepository from '../repositories/UserRepository.js'
import { pool } from '../db/pool.js'
import * as validate from '../utils/validation.js'

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
    const { email, password, fullName, contactEmail = email } = req.body ?? {}
    if (!email || !password || !fullName) {
      const err = new Error('email, password and fullName are required')
      err.status = 400
      throw err
    }
    const normalisedEmail = validate.email(email)
    validate.password(password)
    validate.text(fullName, 'fullName', { max: validate.LIMITS.fullName })
    const normalisedContact = validate.email(contactEmail, 'contactEmail')
    const teacher = await service.createTeacher({
      userId: req.user.userId, email: normalisedEmail, password, fullName, contactEmail: normalisedContact,
    })
    res.status(201).json(teacher)

  } catch (err) {
     next(err) 
    }
}

export async function updateTeacher(req, res, next) {
  try {
    const { fullName, contactEmail } = req.body ?? {}
    const fields = {}
    if (fullName !== undefined) fields.full_name = validate.text(fullName, 'fullName', { max: validate.LIMITS.fullName })
    if (contactEmail !== undefined) fields.contact_email = validate.email(contactEmail, 'contactEmail')

    if (Object.keys(fields).length === 0) {
      const err = new Error('At least one of fullName or contactEmail is required')
      err.status = 400
      throw err
    }

    const teacher = await service.updateTeacher({
      userId: req.user.userId,
      teacherId: validate.parseId(req.params.teacherId, 'teacherId'),
      fields,
    })
    res.json(teacher)
  } catch (err) { next(err) }
}

const setActive = (isActive) => async (req, res, next) => {
  try {
    const result = await service.setTeacherActive({
      userId: req.user.userId, teacherId: validate.parseId(req.params.teacherId, 'teacherId'), isActive,
    })
    res.json(result)
  } catch (err) { next(err) }
}
export const deactivateTeacher = setActive(false)
export const activateTeacher = setActive(true)
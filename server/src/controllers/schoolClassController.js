import { SchoolClassService } from '../services/SchoolClassService.js'
import SchoolClassRepository from '../repositories/SchoolClassRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import { pool } from '../db/pool.js'

const schoolClassService = new SchoolClassService({
  schoolClassRepository: new SchoolClassRepository(pool),
  managerRepository: new ManagerRepository(pool),
  teacherRepository: new TeacherRepository(pool),
  learnerRepository: new LearnerRepository(pool),
})

export async function listClasses(req, res, next) {
  try {
    const classes = await schoolClassService.listClasses({ userId: req.user.userId })
    res.json(classes)
  } catch (err) {
    next(err)
  }
}

export async function getClass(req, res, next) {
  try {
    const schoolClass = await schoolClassService.getClass({
      userId: req.user.userId,
      classId: Number(req.params.classId),
    })
    res.json(schoolClass)
  } catch (err) {
    next(err)
  }
}

export async function createClass(req, res, next) {
  try {
    const { teacherId, className, gradeRange } = req.body
    if (!teacherId || !className || !gradeRange) {
      const err = new Error('teacherId, className and gradeRange are required')
      err.status = 400
      throw err
    }
    const schoolClass = await schoolClassService.createClass({
      userId: req.user.userId, teacherId, className, gradeRange,
    })
    res.status(201).json(schoolClass)
  } catch (err) {
    next(err)
  }
}

export async function updateClass(req, res, next) {
  try {
    const { className, gradeRange } = req.body
    const updated = await schoolClassService.updateClass({
      userId: req.user.userId,
      classId: Number(req.params.classId),
      fields: { class_name: className, grade_range: gradeRange },
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export async function getClassRoster(req, res, next) {
  try {
    const roster = await schoolClassService.getClassRoster({
      userId: req.user.userId,
      classId: Number(req.params.classId),
    })
    res.json(roster)
  } catch (err) {
    next(err)
  }
}


export async function deleteClass(req, res, next) {
  try {
    await schoolClassService.deleteClass({
      userId: req.user.userId,
      classId: Number(req.params.classId),
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
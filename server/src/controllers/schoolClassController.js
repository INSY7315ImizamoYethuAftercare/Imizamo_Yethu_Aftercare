import { SchoolClassService } from '../services/SchoolClassService.js'
import SchoolClassRepository from '../repositories/SchoolClassRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import { pool } from '../db/pool.js'
import * as validate from '../utils/validation.js'

const schoolClassService = new SchoolClassService({
  schoolClassRepository: new SchoolClassRepository(pool),
  managerRepository: new ManagerRepository(pool),
  teacherRepository: new TeacherRepository(pool),
  learnerRepository: new LearnerRepository(pool),
})

export async function listClasses(req, res, next) {
  try {
    const classes = await schoolClassService.listClasses({
      userId: req.user.userId,
      includeInactive: req.query.includeInactive === 'true',
    })
    res.json(classes)
  } catch (err) {
    next(err)
  }
}

export async function getClass(req, res, next) {
  try {
    const schoolClass = await schoolClassService.getClass({
      userId: req.user.userId,
      classId: validate.parseId(req.params.classId, 'classId'),
    })
    res.json(schoolClass)
  } catch (err) {
    next(err)
  }
}

export async function createClass(req, res, next) {

  try {

    const { teacherId, className, gradeRange } = req.body ?? {}

    if (!className || !gradeRange) {
      const err = new Error('className and gradeRange are required')
      err.status = 400
      throw err
    }
    const schoolClass = await schoolClassService.createClass({
      userId: req.user.userId,
      teacherId: validate.optionalId(teacherId, 'teacherId') ?? null,
      className: validate.text(className, 'className', { max: validate.LIMITS.className }),
      gradeRange: validate.text(gradeRange, 'gradeRange', { max: validate.LIMITS.gradeRange }),
    })
    res.status(201).json(schoolClass)
  } catch (err) {
    next(err)
  }
}

export async function updateClass(req, res, next) {

  try {

    const { className, gradeRange, teacherId } = req.body ?? {}

    const fields = {}
    if (className !== undefined) fields.class_name = validate.text(className, 'className', { max: validate.LIMITS.className })
    if (gradeRange !== undefined) fields.grade_range = validate.text(gradeRange, 'gradeRange', { max: validate.LIMITS.gradeRange })
    // null unassigns the teacher.
    if (teacherId !== undefined) fields.teacher_id = validate.optionalId(teacherId, 'teacherId') ?? null

    const updated = await schoolClassService.updateClass({
      userId: req.user.userId,
      classId: validate.parseId(req.params.classId, 'classId'),
      fields,
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
      classId: validate.parseId(req.params.classId, 'classId'),
    })
    res.json(roster)
  } catch (err) {
    next(err)
  }
}

export async function deactivateClass(req, res, next) {
  try {
    const updated = await schoolClassService.deactivateClass({
      userId: req.user.userId,
      classId: validate.parseId(req.params.classId, 'classId'),
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export async function activateClass(req, res, next) {
  try {
    const updated = await schoolClassService.activateClass({
      userId: req.user.userId,
      classId: validate.parseId(req.params.classId, 'classId'),
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}
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
    const classes = await schoolClassService.listClasses({
      userId: req.user.userId,
      includeInactive: req.validated.query.includeInactive ?? false,
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
      classId: req.validated.params.classId,
    })
    res.json(schoolClass)
  } catch (err) {
    next(err)
  }
}

export async function createClass(req, res, next) {

  try {
    const { teacherId, className, gradeRange, colour } = req.validated.body

    const schoolClass = await schoolClassService.createClass({
      userId: req.user.userId,
      teacherId: teacherId ?? null,
      className,
      gradeRange,
      colour: colour ?? null,
    })
    res.status(201).json(schoolClass)
  } catch (err) {
    next(err)
  }
}

export async function updateClass(req, res, next) {

  try {
    // The schema has already renamed the sent keys to column names (class_name, ...).
    // A null teacherId unassigns the teacher; a null colour clears it (the class
    // then uses the colour matching its name).
    const updated = await schoolClassService.updateClass({
      userId: req.user.userId,
      classId: req.validated.params.classId,
      fields: req.validated.body,
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
      classId: req.validated.params.classId,
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
      classId: req.validated.params.classId,
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
      classId: req.validated.params.classId,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}
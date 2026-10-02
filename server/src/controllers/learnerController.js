import { LearnerService } from '../services/LearnerService.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import SchoolClassRepository from '../repositories/SchoolClassRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import { pool } from '../db/pool.js'

const learnerService = new LearnerService({
  learnerRepository: new LearnerRepository(pool),
  schoolClassRepository: new SchoolClassRepository(pool),
  managerRepository: new ManagerRepository(pool),
  teacherRepository: new TeacherRepository(pool),
})

export async function listLearners(req, res, next) {
  try {
    const learners = await learnerService.listLearners({ userId: req.user.userId })
    res.json(learners)
  } catch (err) {
    next(err)
  }
}

export async function createLearner(req, res, next) {
  try {
    const { classId, firstName, lastName, dateOfBirth, canWalkHomeAlone } = req.body
    // dateOfBirth is optional: learners imported from the Hub list have none yet.
    if (!classId || !firstName || !lastName) {
      const err = new Error('classId, firstName and lastName are required')
      err.status = 400
      throw err
    }
    const learner = await learnerService.createLearner({
      userId: req.user.userId, classId, firstName, lastName, dateOfBirth,
      canWalkHomeAlone: Boolean(canWalkHomeAlone),
    })
    res.status(201).json(learner)
  } catch (err) {
    next(err)
  }
}

export async function updateLearner(req, res, next) {
  try {
    const { firstName, lastName, dateOfBirth, canWalkHomeAlone, classId, isActive } = req.body
    const fields = {}
    if (firstName !== undefined) fields.first_name = firstName
    if (lastName !== undefined) fields.last_name = lastName
    if (dateOfBirth !== undefined) fields.date_of_birth = dateOfBirth
    if (canWalkHomeAlone !== undefined) fields.can_walk_home_alone = canWalkHomeAlone
    if (classId !== undefined) fields.class_id = classId
    if (isActive !== undefined) fields.is_active = Boolean(isActive)

    const updated = await learnerService.updateLearner({
      userId: req.user.userId,
      learnerId: Number(req.params.learnerId),
      fields,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
} 

export async function deleteLearner(req, res, next) {
  try {
    await learnerService.deleteLearner({
      userId: req.user.userId,
      learnerId: Number(req.params.learnerId),
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
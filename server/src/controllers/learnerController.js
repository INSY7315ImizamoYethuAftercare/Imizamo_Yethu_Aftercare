import { LearnerService } from '../services/LearnerService.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import SchoolClassRepository from '../repositories/SchoolClassRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import AttendanceRepository from '../repositories/AttendanceRepository.js'
import SignOutRepository from '../repositories/SignOutRepository.js'
import PickupPermissionRepository from '../repositories/PickupPermissionRepository.js'
import ObservationRepository from '../repositories/ObservationRepository.js'
import { todayInSA } from '../services/AttendanceService.js'
import { pool } from '../db/pool.js'
import * as validate from '../utils/validation.js'

const learnerService = new LearnerService({
  learnerRepository: new LearnerRepository(pool),
  schoolClassRepository: new SchoolClassRepository(pool),
  managerRepository: new ManagerRepository(pool),
  teacherRepository: new TeacherRepository(pool),
  attendanceRepository: new AttendanceRepository(pool),
  signOutRepository: new SignOutRepository(pool),
  pickupPermissionRepository: new PickupPermissionRepository(pool),
  observationRepository: new ObservationRepository(pool),
})

export async function listLearners(req, res, next) {
  try {
    const learners = await learnerService.listLearners({ userId: req.user.userId })
    res.json(learners)
  } catch (err) {
    next(err)
  }
}

export async function getLearner(req, res, next) {
  try {
    const learner = await learnerService.getLearner({
      userId: req.user.userId,
      learnerId: validate.parseId(req.params.learnerId, 'learnerId'),
    })
    res.json(learner)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/learners/:learnerId/overview — the staff learner profile's
 * attendance, recent days, pickups and observations.
 */
export async function getLearnerOverview(req, res, next) {
  try {
    const overview = await learnerService.getLearnerOverview({
      userId: req.user.userId,
      learnerId: validate.parseId(req.params.learnerId, 'learnerId'),
      today: todayInSA(),
    })
    res.json(overview)
  } catch (err) {
    next(err)
  }
}

// Only a real true (or the string "true" from a form) counts as true.
// Boolean("false") is true, which would let a child walk home alone by mistake.
const toBoolean = (value) => value === true || value === 'true'

export async function createLearner(req, res, next) {
  try {
    const { classId, firstName, lastName, dateOfBirth, canWalkHomeAlone } = req.body ?? {}
    // dateOfBirth is optional: learners imported from the Hub list have none yet.
    if (!classId || !firstName || !lastName) {
      const err = new Error('classId, firstName and lastName are required')
      err.status = 400
      throw err
    }
    const learner = await learnerService.createLearner({
      userId: req.user.userId,
      classId: validate.parseId(classId, 'classId'),
      firstName: validate.text(firstName, 'firstName', { max: validate.LIMITS.learnerName }),
      lastName: validate.text(lastName, 'lastName', { max: validate.LIMITS.learnerName }),
      dateOfBirth: validate.isoDate(dateOfBirth, 'dateOfBirth', { required: false }),
      canWalkHomeAlone: toBoolean(canWalkHomeAlone),
    })
    res.status(201).json(learner)
  } catch (err) {
    next(err)
  }
}

export async function updateLearner(req, res, next) {
  try {
    const { firstName, lastName, dateOfBirth, canWalkHomeAlone, classId, isActive } = req.body ?? {}
    const fields = {}
    if (firstName !== undefined) fields.first_name = validate.text(firstName, 'firstName', { max: validate.LIMITS.learnerName })
    if (lastName !== undefined) fields.last_name = validate.text(lastName, 'lastName', { max: validate.LIMITS.learnerName })
    // null or '' clears the date of birth.
    if (dateOfBirth !== undefined) fields.date_of_birth = validate.isoDate(dateOfBirth, 'dateOfBirth', { required: false }) ?? null
    if (canWalkHomeAlone !== undefined) fields.can_walk_home_alone = toBoolean(canWalkHomeAlone)
    if (classId !== undefined) fields.class_id = validate.parseId(classId, 'classId')
    if (isActive !== undefined) fields.is_active = toBoolean(isActive)

    const updated = await learnerService.updateLearner({
      userId: req.user.userId,
      learnerId: validate.parseId(req.params.learnerId, 'learnerId'),
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
      learnerId: validate.parseId(req.params.learnerId, 'learnerId'),
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
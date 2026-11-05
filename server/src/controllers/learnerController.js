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
      learnerId: req.validated.params.learnerId,
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
      learnerId: req.validated.params.learnerId,
      today: todayInSA(),
    })
    res.json(overview)
  } catch (err) {
    next(err)
  }
}

export async function createLearner(req, res, next) {
  try {
    // dateOfBirth is optional: learners imported from the Hub list have none yet.
    // canWalkHomeAlone is only true for a real true or "true" (see flagField).
    const { classId, firstName, lastName, dateOfBirth, canWalkHomeAlone } = req.validated.body
    const learner = await learnerService.createLearner({
      userId: req.user.userId,
      classId,
      firstName,
      lastName,
      dateOfBirth,
      canWalkHomeAlone,
    })
    res.status(201).json(learner)
  } catch (err) {
    next(err)
  }
}

export async function updateLearner(req, res, next) {
  try {
    // The schema has already renamed the sent keys to column names (first_name, ...);
    // a null date of birth clears it.
    const updated = await learnerService.updateLearner({
      userId: req.user.userId,
      learnerId: req.validated.params.learnerId,
      fields: req.validated.body,
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
      learnerId: req.validated.params.learnerId,
    })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
/**
 * Guardian controller
 *
 * Thin HTTP layer for the Parent/Guardian portal endpoints. Every method
 * here trusts GuardianService to enforce - the
 * controller itself does no authorisation logic.
 */
import { GuardianService } from '../services/GuardianService.js'
import GuardianRepository from '../repositories/GuardianRepository.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import AttendanceRepository from '../repositories/AttendanceRepository.js'
import ObservationRepository from '../repositories/ObservationRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import SignOutRepository from '../repositories/SignOutRepository.js'
import PickupPermissionRepository from '../repositories/PickupPermissionRepository.js'
import SchoolClassRepository from '../repositories/SchoolClassRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/transaction.js'
import { todayInSA } from '../services/AttendanceService.js'
import * as validate from '../utils/validation.js'

const guardianService = new GuardianService({
  guardianRepository: new GuardianRepository(pool),
  learnerRepository: new LearnerRepository(pool),
  attendanceRepository: new AttendanceRepository(pool),
  observationRepository: new ObservationRepository(pool),
  managerRepository: new ManagerRepository(pool),
  signOutRepository: new SignOutRepository(pool),
  pickupPermissionRepository: new PickupPermissionRepository(pool),
  schoolClassRepository: new SchoolClassRepository(pool),
  teacherRepository: new TeacherRepository(pool),
  // Adding a pickup writes guardians + pickup_permissions (+ learners) as one unit.
  runInTransaction: (work) =>
    withTransaction((client) =>
      work({
        guardianRepository: new GuardianRepository(client),
        pickupPermissionRepository: new PickupPermissionRepository(client),
        learnerRepository: new LearnerRepository(client),
      }),
    ),
})

/** GET /api/guardian/children - lists the logged-in guardian's own children. */
export async function getMyChildren(req, res, next) {
  try {
    const children = await guardianService.getMyChildren(req.user.userId)
    res.json(children)
  } catch (err) {
    next(err)
  }
}

/** GET /api/guardian/children/:learnerId - one child's profile. */
export async function getChildProfile(req, res, next) {
  try {
    const profile = await guardianService.getChildProfile({
      userId: req.user.userId, learnerId: req.params.learnerId,
    })
    res.json(profile)
  } catch (err) {
    next(err)
  }
}

/** GET /api/guardian/children/:learnerId/observations - one child's development notes. */
export async function getChildObservations(req, res, next) {
  try {
    const observations = await guardianService.getChildObservations({
      userId: req.user.userId, learnerId: req.params.learnerId,
    })
    res.json(observations)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/guardian/children/:learnerId/overview
 * Everything the parent home page shows for one of the guardian's children.
 */
export async function getChildOverview(req, res, next) {
  try {
    res.json(await guardianService.getChildOverview({
      userId: req.user.userId,
      learnerId: validate.parseId(req.params.learnerId, 'learnerId'),
      today: todayInSA(),
    }))
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/guardian/children/:learnerId/pickups
 * The guardian adds someone who may collect their child.
 * Body: { fullName, relationship, contactNumber, canWalkHomeAlone? }
 */
export async function addChildPickup(req, res, next) {
  try {
    const { fullName, relationship, contactNumber, canWalkHomeAlone } = req.body ?? {}
    const pickup = await guardianService.addPickup({
      userId: req.user.userId,
      learnerId: validate.parseId(req.params.learnerId, 'learnerId'),
      fullName: validate.text(fullName, 'fullName', { max: validate.LIMITS.fullName }),
      relationship: validate.text(relationship, 'relationship', { max: validate.LIMITS.relationship }),
      contactNumber: validate.text(contactNumber, 'contactNumber', { max: validate.LIMITS.contactNumber }),
      canWalkHomeAlone: canWalkHomeAlone === true || canWalkHomeAlone === 'true',
      today: todayInSA(),
    })
    res.status(201).json(pickup)
  } catch (err) {
    next(err)
  }
}

const setGuardianActiveHandler = (isActive) => async (req, res, next) => {
  try {
    const updated = await guardianService.setGuardianActive({
      userId: req.user.userId,
      guardianId: validate.parseId(req.params.guardianId, 'guardianId'),
      isActive,
    })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}
export const deactivateGuardian = setGuardianActiveHandler(false)
export const activateGuardian = setGuardianActiveHandler(true)
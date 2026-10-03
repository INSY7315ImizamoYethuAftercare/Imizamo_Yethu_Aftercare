/**
 * Sign-out controller
 *
 * Thin HTTP layer for the digital sign-out endpoints. See SignOutService.js
 * for the actual guardian-verification logic.
 */
import { SignOutService } from '../services/SignOutService.js'
import { nowInSA, todayInSA } from '../services/AttendanceService.js'
import SignOutRepository from '../repositories/SignOutRepository.js'
import PickupPermissionRepository from '../repositories/PickupPermissionRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import AttendanceRepository from '../repositories/AttendanceRepository.js'
import { pool } from '../db/pool.js'
import * as validate from '../utils/validation.js'

const signOutService = new SignOutService({
  signOutRepository: new SignOutRepository(pool),
  pickupPermissionRepository: new PickupPermissionRepository(pool),
  teacherRepository: new TeacherRepository(pool),
  managerRepository: new ManagerRepository(pool),
  learnerRepository: new LearnerRepository(pool),
  attendanceRepository: new AttendanceRepository(pool),
})

/**
 * GET /api/signout/today
 * Today's (SA date) collection list: learners marked present, who may
 * collect each one, and who has already gone.
 */
export async function getToday(req, res, next) {
  try {
    res.json(await signOutService.getDay({ userId: req.user.userId, role: req.user.role, date: todayInSA() }))
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/signout/verify
 * Checks whether a guardian may collect a learner, without recording
 * anything. Lets the UI show "authorised" / "not authorised" before the
 * teacher confirms.
 */
export async function verifyGuardian(req, res, next) {
  try {
    const { learnerId, guardianId } = req.body ?? {}
    if (!learnerId || !guardianId) {
      const err = new Error('learnerId and guardianId are required')
      err.status = 400
      throw err
    }
    const result = await signOutService.verifyGuardian({
      userId: req.user.userId,
      role: req.user.role,
      learnerId: validate.parseId(learnerId, 'learnerId'),
      guardianId: validate.parseId(guardianId, 'guardianId'),
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/signout/confirm
 * Records the collection. Re-verifies authorisation server-side and
 * rejects the write if the guardian is not on the learner's pickup
 * permission list, regardless of what the client claims.
 * guardianId: null records a learner walking home alone (only allowed
 * when the learner has that permission).
 */
export async function confirmSignOut(req, res, next) {
  try {
    const { learnerId, guardianId, timeOut } = req.body ?? {}
    // guardianId must be sent explicitly: an id, or null for walking home alone.
    if (!learnerId || guardianId === undefined || guardianId === '') {
      const err = new Error('learnerId and guardianId are required (guardianId: null for a learner walking home alone)')
      err.status = 400
      throw err
    }
    // South African date/time, the same as attendance uses (the server runs
    // in UTC on Azure), so the "present today" check looks at the right day.
    const record = await signOutService.confirmSignOut({
      userId: req.user.userId,
      role: req.user.role,
      learnerId: validate.parseId(learnerId, 'learnerId'),
      guardianId: guardianId === null ? null : validate.parseId(guardianId, 'guardianId'),
      timeOut: validate.timeOfDay(timeOut, 'timeOut') ?? nowInSA(),
      recordDate: todayInSA(),
    })
    res.status(201).json(record)
  } catch (err) {
    next(err)
  }
}
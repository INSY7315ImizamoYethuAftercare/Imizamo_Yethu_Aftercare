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
import SignOutEscalationRepository from '../repositories/SignOutEscalationRepository.js'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/transaction.js'
import { actingRole } from '../middleware/auth.js'

const signOutService = new SignOutService({
  signOutRepository: new SignOutRepository(pool),
  pickupPermissionRepository: new PickupPermissionRepository(pool),
  teacherRepository: new TeacherRepository(pool),
  managerRepository: new ManagerRepository(pool),
  learnerRepository: new LearnerRepository(pool),
  attendanceRepository: new AttendanceRepository(pool),
  escalationRepository: new SignOutEscalationRepository(pool),
  // Approving closes the queue entry and records the sign-out as one unit.
  runInTransaction: (work) =>
    withTransaction((client) =>
      work({
        escalationRepository: new SignOutEscalationRepository(client),
        signOutRepository: new SignOutRepository(client),
      }),
    ),
})

/**
 * GET /api/signout/today
 * Today's (SA date) collection list: learners marked present, who may
 * collect each one, and who has already gone.
 */
export async function getToday(req, res, next) {
  try {
    res.json(await signOutService.getDay({ userId: req.user.userId, role: actingRole(req.user), date: todayInSA() }))
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
    const { learnerId, guardianId } = req.validated.body
    const result = await signOutService.verifyGuardian({
      userId: req.user.userId,
      role: actingRole(req.user),
      learnerId,
      guardianId,
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
    // guardianId must be sent explicitly (the schema enforces it): an id, or null for walking home alone.
    const { learnerId, guardianId, timeOut } = req.validated.body
    // South African date/time, the same as attendance uses (the server runs
    // in UTC on Azure), so the "present today" check looks at the right day.
    const record = await signOutService.confirmSignOut({
      userId: req.user.userId,
      role: actingRole(req.user),
      learnerId,
      guardianId,
      timeOut: timeOut ?? nowInSA(),
      recordDate: todayInSA(),
    })
    res.status(201).json(record)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/signout/escalations
 * Sends a collection staff couldn't verify to the manager's queue.
 * collectorName: null means the learner wants to walk home without permission.
 */
export async function raiseEscalation(req, res, next) {
  try {
    const { learnerId, collectorName } = req.body ?? {}
    if (!learnerId || collectorName === undefined) {
      const err = new Error('learnerId and collectorName are required (collectorName: null for a learner walking home)')
      err.status = 400
      throw err
    }
    const entry = await signOutService.raiseEscalation({
      userId: req.user.userId,
      role: actingRole(req.user),
      learnerId: validate.parseId(learnerId, 'learnerId'),
      collectorName: collectorName === null
        ? null
        : validate.text(collectorName, 'collectorName', { max: validate.LIMITS.fullName }).trim(),
      date: todayInSA(),
    })
    res.status(201).json(entry)
  } catch (err) {
    next(err)
  }
}

/** GET /api/signout/escalations - today's queue, for the manager. */
export async function getEscalations(req, res, next) {
  try {
    res.json(await signOutService.getEscalations({ date: todayInSA() }))
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/signout/escalations/:escalationId
 * The manager's decision. action: 'approve' signs the learner out with the
 * named collector; 'dismiss' leaves them at the centre.
 */
export async function resolveEscalation(req, res, next) {
  try {
    const { action } = req.body ?? {}
    if (action !== 'approve' && action !== 'dismiss') {
      const err = new Error("action must be 'approve' or 'dismiss'")
      err.status = 400
      throw err
    }
    res.json(await signOutService.resolveEscalation({
      userId: req.user.userId,
      role: actingRole(req.user),
      escalationId: validate.parseId(req.params.escalationId, 'escalationId'),
      action,
      today: todayInSA(),
      timeOut: nowInSA(),
    }))
  } catch (err) {
    next(err)
  }
}

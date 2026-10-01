/**
 * Guardian controller
 *
 * Thin HTTP layer for the Parent/Guardian portal endpoints. Every method
 * here trusts GuardianService to enforce US25 (own children only) — the
 * controller itself does no authorisation logic.
 */
import { GuardianService } from '../services/GuardianService.js'
import GuardianRepository from '../repositories/GuardianRepository.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import AttendanceRepository from '../repositories/AttendanceRepository.js'
import ObservationRepository from '../repositories/ObservationRepository.js'
import { pool } from '../db/pool.js'

const guardianService = new GuardianService({
  guardianRepository: new GuardianRepository(pool),
  learnerRepository: new LearnerRepository(pool),
  attendanceRepository: new AttendanceRepository(pool),
  observationRepository: new ObservationRepository(pool),
})

/** GET /api/guardian/children — lists the logged-in guardian's own children. */
export async function getMyChildren(req, res, next) {
  try {
    const children = await guardianService.getMyChildren(req.user.userId)
    res.json(children)
  } catch (err) {
    next(err)
  }
}

/** GET /api/guardian/children/:learnerId — one child's profile. */
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

/** GET /api/guardian/children/:learnerId/observations — one child's development notes. */
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
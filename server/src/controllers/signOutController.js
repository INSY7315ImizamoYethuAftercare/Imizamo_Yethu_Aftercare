import { SignOutService } from '../services/SignOutService.js'
import SignOutRepository from '../repositories/SignOutRepository.js'
import PickupPermissionRepository from '../repositories/PickupPermissionRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import { pool } from '../db/pool.js'

const signOutService = new SignOutService({
  signOutRepository: new SignOutRepository(pool),
  pickupPermissionRepository: new PickupPermissionRepository(pool),
  teacherRepository: new TeacherRepository(pool),
  learnerRepository: new LearnerRepository(pool),
})

export async function verifyGuardian(req, res, next) {
  try {
    const { learnerId, guardianId } = req.body
    if (!learnerId || !guardianId) {
      const err = new Error('learnerId and guardianId are required')
      err.status = 400
      throw err
    }
    const result = await signOutService.verifyGuardian({
      userId: req.user.userId, learnerId, guardianId,
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function confirmSignOut(req, res, next) {
  try {
    const { learnerId, guardianId, timeOut } = req.body
    if (!learnerId || !guardianId) {
      const err = new Error('learnerId and guardianId are required')
      err.status = 400
      throw err
    }
    const recordDate = new Date().toISOString().slice(0, 10)
    const record = await signOutService.confirmSignOut({
      userId: req.user.userId,
      learnerId,
      guardianId,
      timeOut: timeOut || new Date().toTimeString().slice(0, 8),
      recordDate,
    })
    res.status(201).json(record)
  } catch (err) {
    next(err)
  }
}
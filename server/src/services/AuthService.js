import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const SALT_ROUNDS = 10

export class AuthService {

  constructor({ userRepository, guardianRepository, learnerRepository, pickupPermissionRepository }) {
    this.userRepository = userRepository
    this.guardianRepository = guardianRepository
    this.learnerRepository = learnerRepository
    this.pickupPermissionRepository = pickupPermissionRepository
  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async register({ email, password, role, fullName, contactNumber, relationship, claimedLearnerName, claimedLearnerDob }) {

    if (role === 'admin' || role === 'manager' || role === 'teacher') {
      const err = new Error('This role cannot self-register')
      err.status = 403
      throw err
    }

    const existing = await this.userRepository.findByEmail(email)
    if (existing) {
      const err = new Error('An account with this email already exists')
      err.status = 409
      throw err
    }

    let matchedLearner = null
    if (role === 'guardian') {
      if (!contactNumber || !relationship || !claimedLearnerName || !claimedLearnerDob) {
        const err = new Error('contactNumber, relationship, claimedLearnerName and claimedLearnerDob are required to register as a guardian')
        err.status = 400
        throw err
      }

      matchedLearner = await this.learnerRepository.findByFullNameAndDob(claimedLearnerName, claimedLearnerDob)
      if (!matchedLearner) {
        const err = new Error('No learner found matching that name and date of birth')
        err.status = 404
        throw err
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

     const user = await this.userRepository.createUser({ email, role, passwordHash, fullName, isActive: true })

    if (role === 'guardian') {
      const guardian = await this.guardianRepository.create({
        userId: user.user_id,
        fullName,
        contactNumber,
        relationship,
        claimedLearnerName,
        claimedLearnerDob,
      })

      await this.pickupPermissionRepository.create({
        learnerId: matchedLearner.learner_id,
        guardianId: guardian.guardian_id,
        isPrimaryContact: true,
        authorisedDate: new Date().toISOString().slice(0, 10),
      })
    }

    return user
  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async login({ email, password }) {

    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      const err = new Error('No account at all')
      err.status = 401
      throw err
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatches) {
      const err = new Error('Invalid email or password')
      err.status = 401
      return next(err)
    }

    if(!user.is_active) {
      const err = new Error('User not active')
      err.status = 403
      throw err
    }
    if (user.is_active === false) {
     const err = new Error('This account has been deactivated')
     err.status = 403
     throw err
    }
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      env.jwtSecret,
      { expiresIn: '8h' },
    )
    
    return {
      token,
      user: { userId: user.user_id, email: user.email, role: user.role, fullName: user.full_name },
    }
  }
}
    
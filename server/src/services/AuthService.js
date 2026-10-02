/**
 * AuthService
 *
 * Business logic for account creation and login.
 *
 *  - Only the Guardian role may use the public /auth/register endpoint.
 *    Staff roles (admin/manager/teacher) are created by their own
 *    service instead, so a Manager controls who gets staff-level access.
 *  - Guardian self-registration requires proof of a real link to an
 *    enrolled learner (name + date of birth match) before an account is
 *    created, and automatically grants that guardian pickup permission
 *    for the matched learner as the primary contact.
 *  - A deactivated account (is_active = false) cannot log in, even with
 *    the correct password, letting a Manager suspend access without
 *    deleting historical records.
 */
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
   * Creates a new Guardian account via public self-registration, after
   * verifying the claimed learner actually exists. Staff roles must be
   * created by a Manager/Admin through their own service, not here.
   *
   * @param {Object} params
   * @param {string} params.email
   * @param {string} params.password - Plaintext, hashed before storage.
   * @param {string} params.role - Must be 'guardian'.
   * @param {string} params.fullName
   * @param {string} params.contactNumber
   * @param {string} params.relationship
   * @param {string} params.claimedLearnerName - Used to verify a real link to an enrolled learner.
   * @param {string} params.claimedLearnerDob
   * @returns {Promise<Object>} The created user record.
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
        userId: user.user_id, fullName, contactNumber, relationship, claimedLearnerName, claimedLearnerDob,
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
   * Verifies credentials and issues a session token. Rejects unknown
   * emails, wrong passwords, and deactivated accounts.
   *
   * @param {Object} params
   * @param {string} params.email
   * @param {string} params.password
   * @returns {Promise<{ token: string, user: Object }>}
   */
  async login({ email, password }) {
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      const err = new Error('Invalid email or password')
      err.status = 401
      throw err
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatches) {
      const err = new Error('Invalid email or password')
      err.status = 401
      throw err
    }

    if (!user.is_active) {
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
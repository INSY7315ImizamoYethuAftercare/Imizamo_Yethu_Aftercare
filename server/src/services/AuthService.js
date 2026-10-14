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
  /**
   * runInTransaction is optional: when given (as it is in the controller) it
   * runs a callback with { userRepository, guardianRepository,
   * pickupPermissionRepository } bound to one transaction. Without it the
   * plain repositories are used (unit tests with mocks).
   */
  constructor({ userRepository, guardianRepository, learnerRepository, pickupPermissionRepository, adminRepository, runInTransaction }) {
    this.userRepository = userRepository
    this.adminRepository = adminRepository
    this.guardianRepository = guardianRepository
    this.learnerRepository = learnerRepository
    this.pickupPermissionRepository = pickupPermissionRepository
    this.runInTransaction = runInTransaction ?? ((work) => work(this))
  }

  /**
   * Creates a new Guardian account via public self-registration, after
   * verifying the claimed learner actually exists. Staff roles must be
   * created by a Manager/Admin through their own service, not here.
   */
  async register({ email, password, role, fullName, contactNumber, relationship, claimedLearnerName, claimedLearnerDob }) {
    if (role === 'admin' || role === 'manager' || role === 'teacher') {
      const err = new Error('This role cannot self-register')
      err.status = 403
      throw err
    }
    if (role !== 'guardian') {
      const err = new Error('role must be "guardian"')
      err.status = 400
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

    // All-or-nothing: a failure part-way must not leave an orphan user that
    // blocks the parent from ever retrying ("account already exists").
    try {
      return await this.runInTransaction(async ({ userRepository, guardianRepository, pickupPermissionRepository }) => {
        const user = await userRepository.createUser({ email, role, passwordHash, fullName, isActive: true })

        if (role === 'guardian') {
          const guardian = await guardianRepository.create({
            userId: user.user_id, fullName, contactNumber, relationship, claimedLearnerName, claimedLearnerDob,
          })

          await pickupPermissionRepository.create({
            learnerId: matchedLearner.learner_id,
            guardianId: guardian.guardian_id,
            isPrimaryContact: true,
            authorisedDate: new Date().toISOString().slice(0, 10),
          })
        }

        return user
      })
    } catch (err) {
      // Postgres unique_violation: the same email was registered concurrently.
      if (err.code === '23505') {
        const conflict = new Error('An account with this email already exists')
        conflict.status = 409
        throw conflict
      }
      throw err
    }
  }

  /**
   * Verifies credentials and issues a session token. Rejects unknown
   * emails, wrong passwords, and deactivated accounts. If `role` (the card
   * picked on the login screen) is given, it must match the account's role.
   */
  async login({ email, password, role }) {
    const user = await this.userRepository.findByEmail(email)

    // Same message for "no such account" and "wrong password" so the login
    // form can't be used to find out which emails are registered.
    const invalid = () => {
      const err = new Error('Invalid email or password')
      err.status = 401
      return err
    }

    if (!user) throw invalid()

    const passwordMatches = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatches) throw invalid()

    // `is_active` can be undefined on older rows/mocks; only an explicit
    // false means the account has been deactivated.
    if (user.is_active === false) {
      const err = new Error('This account has been deactivated')
      err.status = 403
      throw err
    }

    // Checked only after the password, so it can't reveal what role an email
    // has. A master admin's role is 'admin', so they pick the Admin card.
    if (role !== undefined && role !== user.role) {
      const err = new Error('Wrong account type for the role selected. Please choose the correct role and try again.')
      err.status = 403
      throw err
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      env.jwtSecret,
      { expiresIn: '8h' },
    )
    const profile = { userId: user.user_id, email: user.email, role: user.role, fullName: user.full_name }
    // Admins also get their access level: a master admin can do everything a
    // manager can, and create manager and admin accounts.
    if (user.role === 'admin' && this.adminRepository) {
      profile.accessLevel = (await this.adminRepository.findByUserId(user.user_id))?.access_level ?? 'standard'
    }
    return { token, user: profile }
  }
    }
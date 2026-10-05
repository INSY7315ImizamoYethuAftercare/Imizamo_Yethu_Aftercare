/**
 * Auth controller
 *
 * Thin HTTP layer for authentication endpoints. Owns cookie handling
 * (setting and clearing the session cookie) since that's an HTTP-specific
 * concern; the actual login/register logic lives in AuthService.js.
 */
import { AuthService } from '../services/AuthService.js'
import UserRepository from '../repositories/UserRepository.js'
import GuardianRepository from '../repositories/GuardianRepository.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import PickupPermissionRepository from '../repositories/PickupPermissionRepository.js'
import AdminRepository from '../repositories/AdminRepository.js'
import { pool } from '../db/pool.js'
import { withTransaction } from '../db/transaction.js'
import * as validate from '../utils/validation.js'
import { isProduction } from '../config/env.js'

const userRepository = new UserRepository(pool)

const authService = new AuthService({
  userRepository,
  guardianRepository: new GuardianRepository(pool),
  learnerRepository: new LearnerRepository(pool),
  pickupPermissionRepository: new PickupPermissionRepository(pool),
  adminRepository: new AdminRepository(pool),
  // Registration writes users + guardians + pickup_permissions as one unit.
  runInTransaction: (work) =>
    withTransaction((client) =>
      work({
        userRepository: new UserRepository(client),
        guardianRepository: new GuardianRepository(client),
        pickupPermissionRepository: new PickupPermissionRepository(client),
      }),
    ),
})

/**
 * Shared cookie settings for the session token.
 * httpOnly stops client-side JS reading it (mitigates XSS token theft).
 * sameSite: 'strict' stops it being sent on cross-site requests (mitigates CSRF).
 * secure is only enabled in production, since local HTTP dev has no TLS.
 */
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours, matches the JWT's own expiry
}

/** POST /api/auth/register */
export async function register(req, res, next) {
  try {

    const { email, password, role, fullName, contactNumber, relationship, claimedLearnerName, claimedLearnerDob  } = req.body ?? {}
    if (!email || !password || !role || !fullName) {
      const err = new Error('email, password, role and fullName are all required')
      err.status = 400
      throw err
    }
    const normalisedEmail = validate.email(email)
    validate.password(password)
    validate.text(role, 'role', { max: 20 })
    validate.text(fullName, 'fullName', { max: validate.LIMITS.fullName })
    // Guardian-only fields: AuthService decides whether they are required;
    // here we only check that whatever was sent is the right shape.
    validate.text(contactNumber, 'contactNumber', { max: validate.LIMITS.contactNumber, required: false })
    validate.text(relationship, 'relationship', { max: validate.LIMITS.relationship, required: false })
    validate.text(claimedLearnerName, 'claimedLearnerName', { max: validate.LIMITS.claimedLearnerName, required: false })
    validate.isoDate(claimedLearnerDob, 'claimedLearnerDob', { required: false })

    const user = await authService.register({ 
      email: normalisedEmail, password, role, fullName, contactNumber, relationship, claimedLearnerName, claimedLearnerDob, 
    })
    res.status(201).json({ userId: user.user_id, email: user.email, role: user.role })

  } catch (err) {
    next(err)
  }
}

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {

    const { email, password } = req.body ?? {}
    if (!email || !password) {
      const err = new Error('email and password are required')
      err.status = 400
      throw err
    }
    // Only the type is checked here: no length rules, so older accounts can still sign in.
    if (typeof email !== 'string' || typeof password !== 'string') {
      const err = new Error('email and password must be text')
      err.status = 400
      throw err
    }

    const { token, user } = await authService.login({ email, password })
    res.cookie('token', token, cookieOptions)
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

/** POST /api/auth/logout */
export function logout(req, res) {
  res.clearCookie('token', cookieOptions)
  res.json({ message: 'Logged out successfully' })
}

/**
 * GET /api/auth/me - returns the profile of whoever the session cookie belongs to.
 * The frontend calls this on page load to restore the session after a refresh.
 */
export async function me(req, res, next) {
  try {
    const user = await userRepository.findById(req.user.userId)
    if (!user || user.is_active === false) {
      res.clearCookie('token', cookieOptions)
      const err = new Error('Session is no longer valid')
      err.status = 401
      throw err
    }
    const profile = { userId: user.user_id, email: user.email, role: user.role, fullName: user.full_name }
    // authenticate() looked up the admin's access level.
    if (req.user.accessLevel) profile.accessLevel = req.user.accessLevel
    res.json({ user: profile })
  } catch (err) {
    next(err)
  }
}

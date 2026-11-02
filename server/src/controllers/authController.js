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
    // Guardian-only fields: AuthService decides whether they are required;
    // the schema has only checked that whatever was sent is the right shape.
    const { email, password, role, fullName, contactNumber, relationship, claimedLearnerName, claimedLearnerDob } =
      req.validated.body

    const user = await authService.register({
      email, password, role, fullName, contactNumber, relationship, claimedLearnerName, claimedLearnerDob,
    })
    res.status(201).json({ userId: user.user_id, email: user.email, role: user.role })

  } catch (err) {
    next(err)
  }
}

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    // Only the type is checked (see authSchemas): no length rules, so older accounts can still sign in.
    // role is optional: the role card picked on the login screen.
    const { email, password, role } = req.validated.body

    const { token, user } = await authService.login({ email, password, role })
    res.cookie('token', token, cookieOptions)
    res.json({ user })
  } catch (err) {
    next(err)
  }
}

/** POST /api/auth/change-password - the signed-in user changes their own password. */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.validated.body

    // Other sessions for this account end; this one gets a fresh token.
    const { token, user } = await authService.changePassword({ userId: req.user.userId, currentPassword, newPassword })
    res.cookie('token', token, cookieOptions)
    res.json({ message: 'Password updated', user })
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
    // After a master admin's reset, the app asks for a new password first.
    if (user.must_change_password) profile.mustChangePassword = true
    res.json({ user: profile })
  } catch (err) {
    next(err)
  }
}

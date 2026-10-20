/**
 * Authentication and authorisation middleware.
 *
 * authenticate() confirms the request carries a valid session and attaches
 * the logged-in user's identity to req.user. authorize() runs after it and
 * restricts a route to specific roles. Together these are the single place
 * access control is enforced for every protected route in the system.
 */
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { pool } from '../db/pool.js'
import UserRepository from '../repositories/UserRepository.js'
import AdminRepository from '../repositories/AdminRepository.js'
import { passwordVersion } from '../utils/sessionToken.js'

const unauthorised = (message) => {
  const err = new Error(message)
  err.status = 401
  return err
}

/**
 * Builds the authenticate middleware. The lookups are injected so unit
 * tests can supply fakes instead of a database.
 *
 * allowPendingPasswordChange: let through a user who must choose a new
 * password (after a master admin's reset). Only /auth/me and
 * /auth/change-password use it; every other route refuses them with 403.
 *
 * @param {{
 *   findUserById: (userId: number) => Promise<{ is_active: boolean, role: string,
 *     password_changed_at?: Date|null, must_change_password?: boolean } | null>,
 *   findAdminByUserId?: (userId: number) => Promise<{ access_level: string } | null>,
 *   allowPendingPasswordChange?: boolean,
 * }} deps
 */
export function createAuthenticate({ findUserById, findAdminByUserId = async () => null, allowPendingPasswordChange = false }) {
  /**
   * Verifies the JWT stored in the httpOnly "token" cookie and attaches the
   * decoded payload ({ userId, role }) to req.user, plus accessLevel
   * ('master' | 'standard') for admins. Must run before any
   * route or middleware that relies on req.user, including authorize().
   *
   * Responds with 401 if no token is present, if the token is expired or
   * has been tampered with, or if the account behind it has since been
   * deactivated, deleted or given a different role, or if its password has
   * changed since the token was issued. Checking the account on every
   * request means a manager's "deactivate" or a password change takes effect
   * immediately, instead of when the 8-hour token runs out.
   *
   * Responds with 403 if the user must choose a new password first (unless
   * allowPendingPasswordChange).
   */
  return async function authenticate(req, res, next) {
    const token = req.cookies?.token
    if (!token) return next(unauthorised('Not authenticated'))

    let payload
    try {
      payload = jwt.verify(token, env.jwtSecret) // { userId, role, pwv }
    } catch {
      return next(unauthorised('Invalid or expired session'))
    }

    let accessLevel
    let mustChangePassword = false
    try {
      const user = await findUserById(payload.userId)
      if (
        !user ||
        user.is_active === false ||
        user.role !== payload.role ||
        (payload.pwv ?? null) !== passwordVersion(user.password_changed_at)
      ) {
        return next(unauthorised('Session is no longer valid'))
      }
      mustChangePassword = user.must_change_password === true
      if (user.role === 'admin') {
        accessLevel = (await findAdminByUserId(payload.userId))?.access_level ?? 'standard'
      }
    } catch (err) {
      return next(err)
    }

    if (mustChangePassword && !allowPendingPasswordChange) {
      const err = new Error('Please choose a new password before continuing')
      err.status = 403
      return next(err)
    }

    req.user = { ...payload }
    if (accessLevel) req.user.accessLevel = accessLevel
    if (mustChangePassword) req.user.mustChangePassword = true
    next()
  }
}

const userRepository = new UserRepository(pool)
const adminRepository = new AdminRepository(pool)
const lookups = {
  findUserById: (id) => userRepository.findById(id),
  findAdminByUserId: (id) => adminRepository.findByUserId(id),
}
export const authenticate = createAuthenticate(lookups)
/** For /auth/me and /auth/change-password only: see allowPendingPasswordChange. */
export const authenticateAllowingPasswordChange = createAuthenticate({ ...lookups, allowPendingPasswordChange: true })

/** True for an admin whose access level is 'master'. */
export const isMasterAdmin = (user) => user?.role === 'admin' && user?.accessLevel === 'master'

/** The role a user acts as in services that branch on it: a master admin acts as a manager. */
export const actingRole = (user) => (isMasterAdmin(user) ? 'manager' : user?.role)

/**
 * Restricts a route to one or more roles. Must be used after authenticate(),
 * since it reads req.user.role.
 *
 * A master admin can do everything a manager can, so passes wherever
 * 'manager' is allowed. 'master_admin' allows master admins only (e.g.
 * creating manager and admin accounts).
 *
 * @param {...string} allowedRoles - Roles permitted to access this route,
 *   e.g. authorize('teacher', 'manager').
 * @returns {import('express').RequestHandler} Express middleware.
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error('Not authenticated')
      err.status = 401
      return next(err)
    }
    const master = isMasterAdmin(req.user)
    const allowed =
      allowedRoles.includes(req.user.role) ||
      (master && (allowedRoles.includes('manager') || allowedRoles.includes('master_admin')))
    if (!allowed) {
      const err = new Error('You do not have permission to perform this action')
      err.status = 403
      return next(err)
    }
    next()
  }
}
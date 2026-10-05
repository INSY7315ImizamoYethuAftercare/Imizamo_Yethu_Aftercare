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

const unauthorised = (message) => {
  const err = new Error(message)
  err.status = 401
  return err
}

/**
 * Builds the authenticate middleware. The lookups are injected so unit
 * tests can supply fakes instead of a database.
 *
 * @param {{
 *   findUserById: (userId: number) => Promise<{ is_active: boolean, role: string } | null>,
 *   findAdminByUserId?: (userId: number) => Promise<{ access_level: string } | null>,
 * }} deps
 */
export function createAuthenticate({ findUserById, findAdminByUserId = async () => null }) {
  /**
   * Verifies the JWT stored in the httpOnly "token" cookie and attaches the
   * decoded payload ({ userId, role }) to req.user, plus accessLevel
   * ('master' | 'standard') for admins. Must run before any
   * route or middleware that relies on req.user, including authorize().
   *
   * Responds with 401 if no token is present, if the token is expired or
   * has been tampered with, or if the account behind it has since been
   * deactivated, deleted or given a different role. Checking the account on
   * every request means a manager's "deactivate" takes effect immediately,
   * instead of when the 8-hour token runs out.
   */
  return async function authenticate(req, res, next) {
    const token = req.cookies?.token
    if (!token) return next(unauthorised('Not authenticated'))

    let payload
    try {
      payload = jwt.verify(token, env.jwtSecret) // { userId, role }
    } catch {
      return next(unauthorised('Invalid or expired session'))
    }

    let accessLevel
    try {
      const user = await findUserById(payload.userId)
      if (!user || user.is_active === false || user.role !== payload.role) {
        return next(unauthorised('Session is no longer valid'))
      }
      if (user.role === 'admin') {
        accessLevel = (await findAdminByUserId(payload.userId))?.access_level ?? 'standard'
      }
    } catch (err) {
      return next(err)
    }

    req.user = accessLevel ? { ...payload, accessLevel } : payload
    next()
  }
}

const userRepository = new UserRepository(pool)
const adminRepository = new AdminRepository(pool)
export const authenticate = createAuthenticate({
  findUserById: (id) => userRepository.findById(id),
  findAdminByUserId: (id) => adminRepository.findByUserId(id),
})

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
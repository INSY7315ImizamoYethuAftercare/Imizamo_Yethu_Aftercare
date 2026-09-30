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

/**
 * Verifies the JWT stored in the httpOnly "token" cookie and attaches the
 * decoded payload ({ userId, role }) to req.user. Must run before any
 * route or middleware that relies on req.user, including authorize().
 *
 * Responds with 401 if no token is present, or if the token is missing,
 * expired, or has been tampered with.
 */
export function authenticate(req, res, next) {
  const token = req.cookies?.token
  if (!token) {
    const err = new Error('Not authenticated')
    err.status = 401
    return next(err)
  }
  try {
    req.user = jwt.verify(token, env.jwtSecret) // { userId, role }
    next()
  } catch {
    const err = new Error('Invalid or expired session')
    err.status = 401
    next(err)
  }
}

/**
 * Restricts a route to one or more roles. Must be used after authenticate(),
 * since it reads req.user.role.
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
    if (!allowedRoles.includes(req.user.role)) {
      const err = new Error('You do not have permission to perform this action')
      err.status = 403
      return next(err)
    }
    next()
  }
}
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
const SALT_ROUNDS = 10

export class AuthService {

  constructor(userRepository) {
    this.userRepository = userRepository
  }

  /**
   * 
   * @param {*} param0 
   * @returns 
   */
  async register({ email, password, role, fullName }) {

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

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    return this.userRepository.createUser({ email, role, passwordHash, fullName, isActive: true })
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
    if (!allowedRoles.includes(req.user.role)) {
      const err = new Error('You do not have permission to perform this action')
      err.status = 403
      return next(err)

    if(!user.is_active) {
      const err = new Error('User not active')
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
    next()
  }
}
/**
 * Auth controller
 *
 * Thin HTTP layer for authentication endpoints. Owns cookie handling
 * (setting and clearing the session cookie) since that's an HTTP-specific
 * concern; the actual login/register logic lives in AuthService.js.
 */
import { AuthService } from '../services/AuthService.js'
import UserRepository from '../repositories/UserRepository.js'
import { pool } from '../db/postgresql/pool.js'
import { isProduction } from '../config/env.js'

const authService = new AuthService(new UserRepository(pool))

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
    const { email, password, role, fullName } = req.body
    if (!email || !password || !role || !fullName) {
      const err = new Error('email, password, role and fullName are all required')
      err.status = 400
      throw err
    }
    const user = await authService.register({ email, password, role, fullName })
    res.status(201).json({ userId: user.user_id, email: user.email, role: user.role })
  } catch (err) {
    next(err)
  }
}

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      const err = new Error('email and password are required')
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

/** GET /api/auth/me — returns the identity of whoever the session cookie belongs to. */
export function me(req, res) {
  res.json({ user: req.user })
}
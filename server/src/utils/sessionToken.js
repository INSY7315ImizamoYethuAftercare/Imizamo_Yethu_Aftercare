// Session tokens: signed here, verified by middleware/auth.js.
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

/**
 * The "password version" a session token carries: when the account's
 * password last changed, in ms (null if it never has). A token whose version
 * doesn't match the account was issued before the latest password change,
 * so it is no longer accepted.
 */
export const passwordVersion = (passwordChangedAt) =>
  passwordChangedAt ? new Date(passwordChangedAt).getTime() : null

/** Signs an 8-hour session token for a user row from UserRepository. */
export const signSessionToken = (user) =>
  jwt.sign(
    { userId: user.user_id, role: user.role, pwv: passwordVersion(user.password_changed_at) },
    env.jwtSecret,
    { expiresIn: '8h' },
  )

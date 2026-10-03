/**
 * Request validation helpers for the controllers.
 *
 * Every check throws an Error with status 400, which the central error
 * handler turns into a clean JSON response. Bad input must never reach
 * Postgres, where it would surface as a 500 with SQL in the message.
 * Length limits match the column sizes in db/schema.sql.
 */

export const LIMITS = {
  email: 255,
  fullName: 150,
  learnerName: 100,
  className: 100,
  gradeRange: 50,
  category: 100,
  contactNumber: 30,
  relationship: 50,
  claimedLearnerName: 200,
  notes: 2000,
}

export function badRequest(message) {
  const err = new Error(message)
  err.status = 400
  return err
}

/** A positive whole-number id, from a number or a digits-only string. */
export function parseId(value, name) {
  const n = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN
  if (!Number.isSafeInteger(n) || n <= 0) throw badRequest(`${name} must be a positive whole number`)
  return n
}

/** Like parseId, but undefined, null and '' come back as undefined. */
export function optionalId(value, name) {
  return value === undefined || value === null || value === '' ? undefined : parseId(value, name)
}

/**
 * Checks a text field. Missing values are allowed when required is false;
 * whatever is given must be a string with something in it, within max.
 */
export function text(value, name, { max, required = true } = {}) {
  if (value === undefined || value === null) {
    if (required) throw badRequest(`${name} is required`)
    return value
  }
  if (typeof value !== 'string') throw badRequest(`${name} must be text`)
  if (required && value.trim() === '') throw badRequest(`${name} is required`)
  if (max && value.length > max) throw badRequest(`${name} must be at most ${max} characters`)
  return value
}

/** A real calendar date in YYYY-MM-DD form (rejects 2026-02-30). */
export function isoDate(value, name, { required = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw badRequest(`${name} is required`)
    return undefined
  }
  const parsed = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null
  // Invalid months/days give an Invalid Date, or roll over (02-30 -> 03-02).
  const valid = parsed !== null && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  if (!valid) throw badRequest(`${name} must be a date in YYYY-MM-DD format`)
  return value
}

/** A time of day as HH:MM or HH:MM:SS (24-hour). Optional. */
export function timeOfDay(value, name) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)) {
    throw badRequest(`${name} must be a time in HH:MM or HH:MM:SS format`)
  }
  return value
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Checks an email address and returns it trimmed and in lower case. */
export function email(value, name = 'email') {
  text(value, name, { max: LIMITS.email })
  const normalised = value.trim().toLowerCase()
  if (!EMAIL.test(normalised)) throw badRequest(`${name} must be a valid email address`)
  return normalised
}

/** Passwords: 8+ characters (as for staff accounts), at most 72 (bcrypt's limit). */
export function password(value, name = 'password') {
  if (typeof value !== 'string') throw badRequest(`${name} must be text`)
  if (value.length < 8) throw badRequest(`${name} must be at least 8 characters`)
  if (value.length > 72) throw badRequest(`${name} must be at most 72 characters`)
  return value
}

/** Observation rating: a whole number from 1 to 10. */
export function rating(value) {
  if (!Number.isInteger(value) || value < 1 || value > 10) {
    throw badRequest('rating must be a whole number from 1 to 10')
  }
  return value
}

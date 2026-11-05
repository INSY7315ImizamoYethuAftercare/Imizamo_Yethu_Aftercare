/**
 * Shared Zod building blocks for request validation.
 *
 * Every schema in ./schemas is built from these, so one rule (what counts as
 * an id, a date, an email) lives in exactly one place. Messages are plain
 * sentences because the central error handler sends them to the client as
 * { message }, and the client shows only that field.
 *
 * Length limits match the column sizes in the migrations.
 */
import { z } from 'zod'

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

// undefined, null and '' all mean "the caller did not give a value".
const isBlank = (value) => value === undefined || value === null || value === ''
const isMissing = (value) => value === undefined || value === null

/** The request body. A missing body is treated as {}, so required fields report "is required". */
export const body = (shape) => z.object(shape, { error: 'The request body must be a JSON object' })

/** Route params that are positive whole-number ids, e.g. idParams('classId'). */
export const idParams = (...names) => z.object(Object.fromEntries(names.map((name) => [name, idField(name)])))

/** A positive whole-number id, from a number or a digits-only string. */
export function idField(name) {
  const required = `${name} is required`
  const invalid = `${name} must be a positive whole number`
  return z.preprocess(
    (value) => (typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value),
    z
      .number({ error: (issue) => (isBlank(issue.input) ? required : invalid) })
      .int(invalid)
      .positive(invalid),
  )
}

/** An id that may be left out. undefined, null and '' all come back as undefined. */
export const optionalIdField = (name) =>
  z.preprocess((value) => (isBlank(value) ? undefined : value), idField(name).optional())

/** An id for an update: left out means "no change", and null or '' means "clear it" (null). */
export const nullableIdField = (name) =>
  z.preprocess((value) => (value === '' ? null : value), idField(name).nullable().optional())

/**
 * A text field. Required text must have something in it (spaces alone do not
 * count) and is kept exactly as sent. With required: false, undefined and
 * null are allowed and pass through.
 */
export function textField(name, { max, required = true } = {}) {
  const missing = `${name} is required`
  let schema = z.string({ error: (issue) => (isMissing(issue.input) ? missing : `${name} must be text`) })
  if (required) schema = schema.refine((value) => value.trim() !== '', missing)
  if (max) schema = schema.max(max, `${name} must be at most ${max} characters`)
  return required ? schema : schema.nullish()
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** An email address, returned trimmed and in lower case. */
export function emailField(name = 'email') {
  return textField(name, { max: LIMITS.email })
    .transform((value) => value.trim().toLowerCase())
    .refine((value) => EMAIL.test(value), `${name} must be a valid email address`)
}

/** A new password: 8 or more characters, at most 72 (bcrypt's limit). */
export function passwordField(name = 'password') {
  return z
    .string({ error: (issue) => (isMissing(issue.input) ? `${name} is required` : `${name} must be text`) })
    .min(8, `${name} must be at least 8 characters`)
    .max(72, `${name} must be at most 72 characters`)
}

/**
 * Text typed on the sign-in or change-password screens (an email, or a current
 * password). Only the type is checked, with no length or format rules, so
 * older accounts can still sign in. The service normalises the value.
 */
export function signInTextField(name) {
  const missing = `${name} is required`
  return z
    .string({ error: (issue) => (isMissing(issue.input) ? missing : `${name} must be text`) })
    .min(1, missing)
}

const isRealDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  // 2026-13-01 gives an Invalid Date and 2026-02-30 rolls over to 03-02.
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

/** A real calendar date in YYYY-MM-DD form (rejects 2026-02-30). */
export function dateField(name) {
  const invalid = `${name} must be a date in YYYY-MM-DD format`
  return z
    .string({ error: (issue) => (isMissing(issue.input) ? `${name} is required` : invalid) })
    .min(1, `${name} is required`)
    .refine(isRealDate, invalid)
}

/** A date that may be left out. undefined, null and '' all come back as undefined. */
export const optionalDateField = (name) =>
  z.preprocess((value) => (isBlank(value) ? undefined : value), dateField(name).optional())

/** A date for an update: left out means "no change", and null or '' means "clear it" (null). */
export const nullableDateField = (name) =>
  z.preprocess((value) => (value === '' ? null : value), dateField(name).nullable().optional())

/** A time of day as HH:MM or HH:MM:SS (24-hour). Optional. */
export function timeField(name) {
  const invalid = `${name} must be a time in HH:MM or HH:MM:SS format`
  return z.preprocess(
    (value) => (isBlank(value) ? undefined : value),
    z
      .string({ error: invalid })
      .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, invalid)
      .optional(),
  )
}

/**
 * A colour as a hex code such as #FFD166, returned in upper case. Left out
 * means "no change"; null or '' means "no colour" (null).
 */
export function colourField(name = 'colour') {
  const invalid = `${name} must be a hex colour such as #FFD166`
  return z.preprocess(
    (value) => (value === '' ? null : value),
    z
      .string({ error: invalid })
      .regex(/^#[0-9A-Fa-f]{6}$/, invalid)
      .transform((value) => value.toUpperCase())
      .nullable()
      .optional(),
  )
}

/** An observation rating: a whole number from 1 to 10 (a string such as "7" is refused). */
export function ratingField() {
  const invalid = 'rating must be a whole number from 1 to 10'
  return z
    .number({ error: (issue) => (isMissing(issue.input) ? 'rating is required' : invalid) })
    .int(invalid)
    .min(1, invalid)
    .max(10, invalid)
}

// Only a real true (or the string "true" from a form or query string) counts as true.
// Boolean("false") is true, which would let a child walk home alone by mistake.
const toFlag = (value) => value === true || value === 'true'

/** A yes/no flag. Left out means false. */
export const flagField = () => z.preprocess(toFlag, z.boolean())

/** A yes/no flag for an update: left out means "no change". */
export const optionalFlagField = () =>
  z.preprocess((value) => (value === undefined ? undefined : toFlag(value)), z.boolean().optional())

/**
 * Renames the keys of a validated object to database column names, keeping
 * only the keys that were actually sent. Used by the PATCH schemas so the
 * controller can hand the result straight to the service as `fields`.
 */
export function toColumns(values, columns) {
  const fields = {}
  for (const [key, column] of Object.entries(columns)) {
    if (values[key] !== undefined) fields[column] = values[key]
  }
  return fields
}

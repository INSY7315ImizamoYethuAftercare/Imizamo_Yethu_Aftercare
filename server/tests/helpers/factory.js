// Test data factory: users of every role (with their profile row) and a
// ready-to-send session cookie, plus learners, guardians links and attendance.
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../../src/db/pool.js'
import { classIdByName } from './db.js'

export const TEST_PASSWORD = 'Test-Password-123!'
// Low cost factor keeps the suite fast; bcrypt.compare works with any cost.
const PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 4)

/** The 5 application roles. Both admin kinds have users.role = 'admin'. */
export const ROLES = ['admin_standard', 'admin_master', 'manager', 'teacher', 'guardian']

const DB_ROLE = {
  admin_standard: 'admin',
  admin_master: 'admin',
  manager: 'manager',
  teacher: 'teacher',
  guardian: 'guardian',
}

let counter = 0

/** Signs a session JWT exactly like AuthService.login does. */
export function signToken({ userId, role }, options = { expiresIn: '8h' }) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, options)
}

export const cookieFor = (token) => `token=${token}`

/**
 * Creates a user with the profile row for its role.
 * @param {string} role - One of ROLES.
 * @returns {Promise<{ user, profile, role, dbRole, email, password, token, cookie }>}
 */
export async function createUser(role, { email, fullName, isActive = true } = {}) {
  const dbRole = DB_ROLE[role]
  if (!dbRole) throw new Error(`Unknown test role: ${role}`)

  counter += 1
  const name = fullName ?? `Test ${role} ${counter}`
  const userEmail = email ?? `${role}.${counter}@test.iylh.org`

  const { rows } = await pool.query(
    `INSERT INTO users ("email", "role", "password_hash", "full_name", "is_active")
     VALUES ($1, $2, $3, $4, $5)
     RETURNING "user_id", "email", "role", "full_name", "is_active"`,
    [userEmail, dbRole, PASSWORD_HASH, name, isActive],
  )
  const user = rows[0]

  let profile
  if (dbRole === 'admin') {
    const accessLevel = role === 'admin_master' ? 'master' : 'standard'
    ;({ rows: [profile] } = await pool.query(
      `INSERT INTO admins ("user_id", "full_name", "access_level") VALUES ($1, $2, $3)
       RETURNING "admin_id", "user_id", "access_level"`,
      [user.user_id, name, accessLevel],
    ))
    // A master admin can do everything a manager can, so also has a
    // managers row (as seeds and the accounts API create; migration 004).
    if (accessLevel === 'master') {
      const { rows: [m] } = await pool.query(
        `INSERT INTO managers ("user_id", "full_name") VALUES ($1, $2) RETURNING "manager_id"`,
        [user.user_id, name],
      )
      profile.manager_id = m.manager_id
    }
  } else if (dbRole === 'manager') {
    ;({ rows: [profile] } = await pool.query(
      `INSERT INTO managers ("user_id", "full_name") VALUES ($1, $2) RETURNING "manager_id", "user_id"`,
      [user.user_id, name],
    ))
  } else if (dbRole === 'teacher') {
    ;({ rows: [profile] } = await pool.query(
      `INSERT INTO teachers ("user_id", "full_name", "contact_email") VALUES ($1, $2, $3)
       RETURNING "teacher_id", "user_id"`,
      [user.user_id, name, userEmail],
    ))
  } else {
    ;({ rows: [profile] } = await pool.query(
      `INSERT INTO guardians ("user_id", "full_name", "contact_number", "relationship")
       VALUES ($1, $2, $3, $4) RETURNING "guardian_id", "user_id"`,
      [user.user_id, name, '0820000000', 'Parent'],
    ))
  }

  const token = signToken({ userId: user.user_id, role: dbRole })
  return { user, profile, role, dbRole, email: userEmail, password: TEST_PASSWORD, token, cookie: cookieFor(token) }
}

/** Creates one user of every role, keyed by role name. */
export async function createAllRoles() {
  const out = {}
  for (const role of ROLES) out[role] = await createUser(role)
  return out
}

export async function createLearner({
  className = 'Yellow', firstName, lastName = 'Testlearner', dateOfBirth = '2018-03-14', canWalkHomeAlone = false,
} = {}) {
  counter += 1
  const classId = await classIdByName(className)
  const { rows } = await pool.query(
    `INSERT INTO learners ("class_id", "first_name", "last_name", "date_of_birth", "can_walk_home_alone")
     VALUES ($1, $2, $3, $4, $5)
     RETURNING "learner_id", "class_id", "first_name", "last_name", "date_of_birth", "can_walk_home_alone"`,
    [classId, firstName ?? `Learner${counter}`, lastName, dateOfBirth, canWalkHomeAlone],
  )
  return rows[0]
}

/** Adds a pickup permission linking a guardian profile to a learner. */
export async function linkGuardian(learner, guardian, { isPrimaryContact = true } = {}) {
  const { rows } = await pool.query(
    `INSERT INTO pickup_permissions ("learner_id", "guardian_id", "is_primary_contact")
     VALUES ($1, $2, $3) RETURNING "permission_id", "learner_id", "guardian_id"`,
    [learner.learner_id, guardian.profile.guardian_id, isPrimaryContact],
  )
  return rows[0]
}

/** Inserts an attendance row directly (bypassing the API). */
export async function markAttendance(learner, teacher, { status = 'present', recordDate, timeIn = '14:00:00' } = {}) {
  const { rows } = await pool.query(
    `INSERT INTO attendance_records ("learner_id", "teacher_id", "record_date", "time_in", "status")
     VALUES ($1, $2, COALESCE($3::date, (now() AT TIME ZONE 'Africa/Johannesburg')::date), $4, $5)
     RETURNING "record_id", "learner_id", "record_date", "status"`,
    [learner.learner_id, teacher.profile.teacher_id, recordDate ?? null, status === 'present' ? timeIn : null, status],
  )
  return rows[0]
}

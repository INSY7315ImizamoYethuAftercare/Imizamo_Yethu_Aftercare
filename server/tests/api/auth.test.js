// #50 — Auth endpoints: register, login, logout, /me and JWT handling.
import { beforeEach, describe, expect, it } from '@jest/globals'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { pool, resetDb, withFailingInsert } from '../helpers/db.js'
import { TEST_PASSWORD, cookieFor, createLearner, createUser, signToken } from '../helpers/factory.js'
import { findKeyDeep } from '../helpers/assertions.js'

const app = await loadApp()

const guardianRegistration = (overrides = {}) => ({
  email: 'new.parent@test.iylh.org',
  password: 'A-strong-password-1',
  role: 'guardian',
  fullName: 'Fatima Petersen',
  contactNumber: '0821234567',
  relationship: 'Mother',
  claimedLearnerName: 'Aisha Petersen',
  claimedLearnerDob: '2018-03-14',
  ...overrides,
})

const tokenCookie = (res) => (res.headers['set-cookie'] ?? []).find((c) => c.startsWith('token='))

beforeEach(resetDb)

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await createLearner({ firstName: 'Aisha', lastName: 'Petersen', dateOfBirth: '2018-03-14' })
  })

  it('registers a guardian whose claimed learner exists (201)', async () => {
    const res = await request(app).post('/api/auth/register').send(guardianRegistration())

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ userId: expect.any(Number), email: 'new.parent@test.iylh.org', role: 'guardian' })

    const { rows } = await pool.query(
      `SELECT g."guardian_id", p."is_primary_contact"
       FROM guardians g JOIN pickup_permissions p ON p."guardian_id" = g."guardian_id"
       WHERE g."user_id" = $1`,
      [res.body.userId],
    )
    expect(rows).toEqual([{ guardian_id: expect.any(Number), is_primary_contact: true }])
  })

  it('stores a bcrypt hash, never the plain password', async () => {
    await request(app).post('/api/auth/register').send(guardianRegistration())
    const { rows } = await pool.query(`SELECT "password_hash" FROM users WHERE "email" = $1`, ['new.parent@test.iylh.org'])
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/)
    expect(rows[0].password_hash).not.toContain('A-strong-password-1')
  })

  it.each(['email', 'password', 'role', 'fullName'])('rejects a missing %s with 400', async (field) => {
    const body = guardianRegistration()
    delete body[field]
    const res = await request(app).post('/api/auth/register').send(body)
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/required/)
  })

  it.each(['contactNumber', 'relationship', 'claimedLearnerName', 'claimedLearnerDob'])(
    'rejects a guardian registration missing %s with 400',
    async (field) => {
      const body = guardianRegistration()
      delete body[field]
      const res = await request(app).post('/api/auth/register').send(body)
      expect(res.status).toBe(400)
    },
  )

  it('rejects an empty body with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({})
    expect(res.status).toBe(400)
  })

  it.each(['admin', 'manager', 'teacher'])('refuses public self-registration as %s (403)', async (role) => {
    const res = await request(app).post('/api/auth/register').send(guardianRegistration({ role }))
    expect(res.status).toBe(403)
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM users')
    expect(rows[0].n).toBe(0)
  })

  it('rejects an unknown role with a 4xx, not a 500', async () => {
    const res = await request(app).post('/api/auth/register').send(guardianRegistration({ role: 'superuser' }))
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
  })

  it('returns 404 when the claimed learner does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(guardianRegistration({ claimedLearnerName: 'Nobody Here' }))
    expect(res.status).toBe(404)
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM users')
    expect(rows[0].n).toBe(0)
  })

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(guardianRegistration())
    const res = await request(app).post('/api/auth/register').send(guardianRegistration())
    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/already exists/)
  })

  it('rejects a duplicate email that differs only in letter case with 409', async () => {
    await request(app).post('/api/auth/register').send(guardianRegistration())
    const res = await request(app)
      .post('/api/auth/register')
      .send(guardianRegistration({ email: 'New.Parent@Test.IYLH.org' }))
    expect(res.status).toBe(409)
  })

  it('stores a new email in lower case', async () => {
    const res = await request(app).post('/api/auth/register').send(guardianRegistration({ email: '  New.Parent@Test.IYLH.org ' }))
    expect(res.status).toBe(201)
    expect(res.body.email).toBe('new.parent@test.iylh.org')
  })

  it('rejects an invalid email address with 400', async () => {
    const res = await request(app).post('/api/auth/register').send(guardianRegistration({ email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('rejects a password shorter than 8 characters with 400', async () => {
    const res = await request(app).post('/api/auth/register').send(guardianRegistration({ password: 'abc' }))
    expect(res.status).toBe(400)
  })

  it('never returns password_hash', async () => {
    const res = await request(app).post('/api/auth/register').send(guardianRegistration())
    expect(res.status).toBe(201)
    expect(findKeyDeep(res.body, /password/i)).toBeNull()
  })

  it('never returns password_hash on a failed registration', async () => {
    const res = await request(app).post('/api/auth/register').send(guardianRegistration({ role: 'teacher' }))
    expect(findKeyDeep(res.body, /password/i)).toBeNull()
  })

  it('leaves no partial account behind when registration fails part-way, so the parent can retry', async () => {
    // The users row is written, then the guardians insert fails inside
    // Postgres. The whole registration must roll back.
    const failed = await withFailingInsert('guardians', 'simulated failure', () =>
      request(app).post('/api/auth/register').send(guardianRegistration()),
    )
    expect(failed.status).toBe(500)
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM users')
    expect(rows[0].n).toBe(0)

    const retry = await request(app).post('/api/auth/register').send(guardianRegistration())
    expect(retry.status).toBe(201)
  })

  it('returns 409, not 500, when the same email is registered twice at once', async () => {
    const results = await Promise.all([
      request(app).post('/api/auth/register').send(guardianRegistration()),
      request(app).post('/api/auth/register').send(guardianRegistration()),
    ])
    expect(results.map((r) => r.status).sort()).toEqual([201, 409])
  })
})

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials and sets an httpOnly, SameSite=Strict cookie', async () => {
    const teacher = await createUser('teacher')
    const res = await request(app).post('/api/auth/login').send({ email: teacher.email, password: TEST_PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body.user).toEqual({
      userId: teacher.user.user_id, email: teacher.email, role: 'teacher', fullName: teacher.user.full_name,
    })
    const cookie = tokenCookie(res)
    expect(cookie).toBeDefined()
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/SameSite=Strict/i)
  })

  it('issues a token that /api/auth/me accepts and that carries userId and role', async () => {
    const manager = await createUser('manager')
    const login = await request(app).post('/api/auth/login').send({ email: manager.email, password: TEST_PASSWORD })
    const raw = tokenCookie(login).split(';')[0]

    const payload = jwt.decode(raw.replace('token=', ''))
    expect(payload).toMatchObject({ userId: manager.user.user_id, role: 'manager' })
    expect(payload.exp - payload.iat).toBe(8 * 60 * 60)

    const me = await request(app).get('/api/auth/me').set('Cookie', raw)
    expect(me.status).toBe(200)
    expect(me.body.user.role).toBe('manager')
  })

  it.each(['admin_standard', 'admin_master', 'manager', 'teacher', 'guardian'])(
    'logs in a %s and never returns password_hash',
    async (role) => {
      const u = await createUser(role)
      const res = await request(app).post('/api/auth/login').send({ email: u.email, password: TEST_PASSWORD })
      expect(res.status).toBe(200)
      expect(findKeyDeep(res.body, /password/i)).toBeNull()
      expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/)
    },
  )

  it('accepts the email in any letter case', async () => {
    const u = await createUser('teacher')
    const res = await request(app).post('/api/auth/login').send({ email: u.email.toUpperCase(), password: TEST_PASSWORD })
    expect(res.status).toBe(200)
    expect(res.body.user.userId).toBe(u.user.user_id)
  })

  it('rejects a wrong password with 401 and a generic message', async () => {
    const u = await createUser('teacher')
    const res = await request(app).post('/api/auth/login').send({ email: u.email, password: 'wrong-password' })
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid email or password')
    expect(tokenCookie(res)).toBeUndefined()
  })

  it('gives an unknown email exactly the same response as a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.iylh.org', password: 'whatever-1' })
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid email or password')
  })

  it.each([
    ['email', { password: TEST_PASSWORD }],
    ['password', { email: 'someone@test.iylh.org' }],
    ['both fields', {}],
  ])('rejects missing %s with 400', async (_label, body) => {
    const res = await request(app).post('/api/auth/login').send(body)
    expect(res.status).toBe(400)
  })

  it('rejects a deactivated account with 403 even with the right password', async () => {
    const u = await createUser('teacher', { isActive: false })
    const res = await request(app).post('/api/auth/login').send({ email: u.email, password: TEST_PASSWORD })
    expect(res.status).toBe(403)
    expect(tokenCookie(res)).toBeUndefined()
  })

  it('rejects a non-string password with a 4xx, not a 500', async () => {
    const u = await createUser('teacher')
    const res = await request(app).post('/api/auth/login').send({ email: u.email, password: { $ne: '' } })
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
  })

  it('treats an object email (NoSQL-style injection) as no match', async () => {
    await createUser('teacher')
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: TEST_PASSWORD })
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
    expect(tokenCookie(res)).toBeUndefined()
  })
})

describe('POST /api/auth/logout', () => {
  it('clears the session cookie', async () => {
    const u = await createUser('teacher')
    const res = await request(app).post('/api/auth/logout').set('Cookie', u.cookie)
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/Logged out/)
    const cleared = tokenCookie(res)
    expect(cleared).toMatch(/^token=;/)
    expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/)
  })

  it('succeeds without a session (idempotent)', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.status).toBe(200)
  })
})

describe('JWT handling on protected routes', () => {
  it('rejects a request with no cookie (401)', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Not authenticated')
  })

  it('rejects a malformed token (401)', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'token=not.a.jwt')
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid or expired session')
  })

  it('rejects an expired token (401)', async () => {
    const u = await createUser('teacher')
    const expired = signToken({ userId: u.user.user_id, role: 'teacher' }, { expiresIn: -10 })
    const res = await request(app).get('/api/auth/me').set('Cookie', cookieFor(expired))
    expect(res.status).toBe(401)
  })

  it('rejects a token signed with a different secret (401)', async () => {
    const u = await createUser('manager')
    const forged = jwt.sign({ userId: u.user.user_id, role: 'manager' }, 'attacker-secret')
    const res = await request(app).get('/api/learners').set('Cookie', cookieFor(forged))
    expect(res.status).toBe(401)
  })

  it('rejects an unsigned alg:none token claiming the manager role (401)', async () => {
    const u = await createUser('guardian')
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
    const body = Buffer.from(JSON.stringify({ userId: u.user.user_id, role: 'manager' })).toString('base64url')
    const res = await request(app).get('/api/learners').set('Cookie', `token=${header}.${body}.`)
    expect(res.status).toBe(401)
  })

  it('rejects a token whose role claim was edited (signature no longer matches)', async () => {
    const u = await createUser('guardian')
    const [h, , s] = u.token.split('.')
    const tampered = Buffer.from(JSON.stringify({ userId: u.user.user_id, role: 'manager' })).toString('base64url')
    const res = await request(app).get('/api/learners').set('Cookie', `token=${h}.${tampered}.${s}`)
    expect(res.status).toBe(401)
  })

  it('ignores a Bearer header: the session is cookie-only', async () => {
    const u = await createUser('teacher')
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${u.token}`)
    expect(res.status).toBe(401)
  })

  it('/me rejects a valid token for an account that has since been deactivated (401)', async () => {
    const u = await createUser('teacher')
    await pool.query('UPDATE users SET "is_active" = false WHERE "user_id" = $1', [u.user.user_id])
    const res = await request(app).get('/api/auth/me').set('Cookie', u.cookie)
    expect(res.status).toBe(401)
  })

  it("a manager deactivating a teacher cuts off that teacher's open session immediately", async () => {
    const manager = await createUser('manager')
    const teacher = await createUser('teacher')
    expect((await request(app).get('/api/classes').set('Cookie', teacher.cookie)).status).toBe(200)
    const off = await request(app).patch(`/api/teacher/${teacher.profile.teacher_id}/deactivate`).set('Cookie', manager.cookie)
    expect(off.status).toBe(200)
    const after = await request(app).get('/api/classes').set('Cookie', teacher.cookie)
    expect(after.status).toBe(401)
    expect(after.body.message).toBe('Session is no longer valid')
  })

  it('rejects a token whose role no longer matches the account (401)', async () => {
    const u = await createUser('teacher')
    await pool.query(`UPDATE users SET "role" = 'guardian' WHERE "user_id" = $1`, [u.user.user_id])
    const res = await request(app).get('/api/classes').set('Cookie', u.cookie)
    expect(res.status).toBe(401)
  })

  it('/me rejects a valid token for a user that no longer exists (401)', async () => {
    const u = await createUser('teacher')
    await pool.query('DELETE FROM users WHERE "user_id" = $1', [u.user.user_id])
    const res = await request(app).get('/api/auth/me').set('Cookie', u.cookie)
    expect(res.status).toBe(401)
  })

  it('other protected routes also reject a deactivated account that still holds a token', async () => {
    const u = await createUser('teacher')
    await pool.query('UPDATE users SET "is_active" = false WHERE "user_id" = $1', [u.user.user_id])
    const res = await request(app).get('/api/learners').set('Cookie', u.cookie)
    expect(res.status).toBe(401)
  })
})

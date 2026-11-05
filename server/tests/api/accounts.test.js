// The master admin: does everything a manager can, creates manager and
// standard admin accounts (GET/POST /api/accounts), and edits staff
// accounts (PATCH /api/accounts/:userId).
import { beforeEach, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { classIdByName, pool, resetDb, withFailingInsert, withFailingUpdate } from '../helpers/db.js'
import { createUser, TEST_PASSWORD } from '../helpers/factory.js'

const app = await loadApp()

let master
let standard
let manager

beforeEach(async () => {
  await resetDb()
  master = await createUser('admin_master', { fullName: 'Nomvula Dube' })
  standard = await createUser('admin_standard', { fullName: 'Pieter Jacobs' })
  manager = await createUser('manager', { fullName: 'Sarah Botha' })
})

const list = (user = master) => request(app).get('/api/accounts').set('Cookie', user.cookie)
const create = (body, user = master) => request(app).post('/api/accounts').set('Cookie', user.cookie).send(body)
const login = (email, password = TEST_PASSWORD) => request(app).post('/api/auth/login').send({ email, password })

const NEW_MANAGER = { type: 'manager', fullName: 'Thabo Manager', email: 'Thabo.Manager@iylh.test', password: 'Starting-pass-1' }
const NEW_ADMIN = { type: 'standard_admin', fullName: 'Lerato Admin', email: 'lerato.admin@iylh.test', password: 'Starting-pass-1' }

describe('Admin access level on the session', () => {
  it.each([
    ['admin_master', 'master'],
    ['admin_standard', 'standard'],
  ])('login and /auth/me return accessLevel for %s', async (role, level) => {
    const user = role === 'admin_master' ? master : standard
    const res = await login(user.email)
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ role: 'admin', accessLevel: level })

    const me = await request(app).get('/api/auth/me').set('Cookie', user.cookie)
    expect(me.body.user).toMatchObject({ role: 'admin', accessLevel: level })
  })

  it('managers and other roles get no accessLevel', async () => {
    const res = await login(manager.email)
    expect(res.body.user).not.toHaveProperty('accessLevel')
  })
})

describe('GET /api/accounts', () => {
  it('lists managers and admins with their type, and nobody else', async () => {
    await createUser('teacher')
    await createUser('guardian')
    const res = await list()
    expect(res.status).toBe(200)
    expect(res.body.map(({ fullName, type, isActive }) => ({ fullName, type, isActive }))).toEqual([
      { fullName: 'Nomvula Dube', type: 'master_admin', isActive: true },
      { fullName: 'Pieter Jacobs', type: 'standard_admin', isActive: true },
      { fullName: 'Sarah Botha', type: 'manager', isActive: true },
    ])
    expect(JSON.stringify(res.body)).not.toMatch(/password|\$2[aby]\$/)
  })

  it.each(['admin_standard', 'manager', 'teacher', 'guardian'])('is refused to a %s (403)', async (role) => {
    const user = { admin_standard: standard, manager }[role] ?? (await createUser(role))
    expect((await list(user)).status).toBe(403)
  })
})

// A new account signs in with the starting password, then picks its own; returns the fresh cookie.
async function chooseOwnPassword(signedIn, currentPassword) {
  const changed = await request(app).post('/api/auth/change-password').set('Cookie', signedIn.headers['set-cookie'])
    .send({ currentPassword, newPassword: 'Their-own-pass-1' })
  expect(changed.status).toBe(200)
  return changed.headers['set-cookie']
}

describe('POST /api/accounts', () => {
  it('creates a manager who can sign in and use manager features', async () => {
    const res = await create(NEW_MANAGER)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ fullName: 'Thabo Manager', email: 'thabo.manager@iylh.test', type: 'manager', isActive: true })

    const signedIn = await login('thabo.manager@iylh.test', 'Starting-pass-1')
    expect(signedIn.body.user).toMatchObject({ role: 'manager', fullName: 'Thabo Manager', mustChangePassword: true })
    // They must choose their own password before using the app.
    expect((await request(app).get('/api/teacher').set('Cookie', signedIn.headers['set-cookie'])).status).toBe(403)
    const cookie = await chooseOwnPassword(signedIn, 'Starting-pass-1')
    expect((await request(app).get('/api/teacher').set('Cookie', cookie)).status).toBe(200)
  })

  it('creates a standard admin who sees totals only', async () => {
    const res = await create(NEW_ADMIN)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ type: 'standard_admin' })

    const signedIn = await login('lerato.admin@iylh.test', 'Starting-pass-1')
    expect(signedIn.body.user).toMatchObject({ role: 'admin', accessLevel: 'standard', mustChangePassword: true })
    const cookie = await chooseOwnPassword(signedIn, 'Starting-pass-1')
    expect((await request(app).get('/api/reports/overview').set('Cookie', cookie)).status).toBe(200)
    expect((await request(app).get('/api/learners').set('Cookie', cookie)).status).toBe(403)
    expect((await request(app).get('/api/accounts').set('Cookie', cookie)).status).toBe(403)
  })

  it('cannot create a master admin, teacher or guardian (400)', async () => {
    for (const type of ['master_admin', 'admin', 'teacher', 'guardian']) {
      expect((await create({ ...NEW_ADMIN, type })).status).toBe(400)
    }
  })

  it('refuses an email that is already used, in any letter case (409)', async () => {
    expect((await create({ ...NEW_MANAGER, email: manager.email.toUpperCase() })).status).toBe(409)
  })

  it.each([
    [{ password: 'short' }, /at least 8/],
    [{ email: 'not-an-email' }, /valid email/],
    [{ fullName: '' }, /required/],
  ])('validates %o (400)', async (overrides, message) => {
    const res = await create({ ...NEW_MANAGER, ...overrides })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(message)
  })

  it('leaves no half-made account if the profile cannot be saved', async () => {
    await withFailingInsert('managers', 'simulated failure', async () => {
      expect((await create(NEW_MANAGER)).status).toBe(500)
    })
    const { rows } = await pool.query('SELECT 1 FROM users WHERE "email" = $1', ['thabo.manager@iylh.test'])
    expect(rows).toHaveLength(0)
  })

  it.each(['admin_standard', 'manager'])('is refused to a %s (403)', async (role) => {
    const user = role === 'manager' ? manager : standard
    expect((await create(NEW_MANAGER, user)).status).toBe(403)
  })
})

describe('PATCH /api/accounts/:userId', () => {
  const edit = (target, body, user = master) =>
    request(app).patch(`/api/accounts/${target.user.user_id}`).set('Cookie', user.cookie).send(body)
  const row = async (sql, id) => (await pool.query(sql, [id])).rows[0]

  let teacher
  beforeEach(async () => {
    teacher = await createUser('teacher', { fullName: 'Ms Nkosi' })
  })

  it("renames a teacher everywhere and moves their sign-in email", async () => {
    const res = await edit(teacher, { fullName: 'Thandeka Nkosi', email: 'Thandeka@IYLH.test' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      userId: teacher.user.user_id, fullName: 'Thandeka Nkosi', email: 'thandeka@iylh.test', role: 'teacher', isActive: true,
    })
    expect(await row('SELECT "full_name", "email" FROM users WHERE "user_id" = $1', teacher.user.user_id))
      .toEqual({ full_name: 'Thandeka Nkosi', email: 'thandeka@iylh.test' })
    expect(await row('SELECT "full_name", "contact_email" FROM teachers WHERE "user_id" = $1', teacher.user.user_id))
      .toEqual({ full_name: 'Thandeka Nkosi', contact_email: 'thandeka@iylh.test' })

    expect((await login('thandeka@iylh.test')).status).toBe(200)
    expect((await login(teacher.email)).status).toBe(401)
  })

  it('does not change passwords (that is reset-password)', async () => {
    const res = await edit(teacher, { password: 'Brand-new-pass-1' })
    expect(res.status).toBe(400)
    expect((await login(teacher.email)).status).toBe(200)
  })

  it('renames a manager and a standard admin in their profile rows too', async () => {
    expect((await edit(manager, { fullName: 'Sarah B' })).status).toBe(200)
    expect((await row('SELECT "full_name" FROM managers WHERE "user_id" = $1', manager.user.user_id)).full_name).toBe('Sarah B')
    expect((await edit(standard, { fullName: 'Pieter J' })).status).toBe(200)
    expect((await row('SELECT "full_name" FROM admins WHERE "user_id" = $1', standard.user.user_id)).full_name).toBe('Pieter J')
  })

  it('lets the master admin edit their own account (both admins and managers rows)', async () => {
    expect((await edit(master, { fullName: 'Nomvula D' })).status).toBe(200)
    expect((await row('SELECT "full_name" FROM admins WHERE "user_id" = $1', master.user.user_id)).full_name).toBe('Nomvula D')
    expect((await row('SELECT "full_name" FROM managers WHERE "user_id" = $1', master.user.user_id)).full_name).toBe('Nomvula D')
    // Their session stays valid after the change.
    expect((await list()).status).toBe(200)
  })

  it("cannot edit another master admin (403) or a parent's account (403)", async () => {
    const otherMaster = await createUser('admin_master')
    const parent = await createUser('guardian')
    expect((await edit(otherMaster, { fullName: 'X' })).status).toBe(403)
    expect((await edit(parent, { fullName: 'X' })).status).toBe(403)
    expect((await login(otherMaster.email)).status).toBe(200)
  })

  it.each(['admin_standard', 'manager', 'teacher', 'guardian'])('is refused to a %s (403) and changes nothing', async (role) => {
    const user = { admin_standard: standard, manager, teacher }[role] ?? (await createUser(role))
    const res = await edit(teacher, { email: 'hijacked@iylh.test' }, user)
    expect(res.status).toBe(403)
    expect((await login(teacher.email)).status).toBe(200)
  })

  it('refuses an email another account uses, in any letter case (409)', async () => {
    expect((await edit(teacher, { email: manager.email.toUpperCase() })).status).toBe(409)
  })

  it('allows saving a teacher with their own email unchanged', async () => {
    expect((await edit(teacher, { email: teacher.email, fullName: 'Ms N' })).status).toBe(200)
  })

  it('returns 404 for an account that does not exist', async () => {
    const res = await request(app).patch('/api/accounts/999999').set('Cookie', master.cookie).send({ fullName: 'X' })
    expect(res.status).toBe(404)
  })

  it.each([
    [{}, /At least one/],
    [{ email: 'not-an-email' }, /valid email/],
    [{ fullName: '' }, /required/],
  ])('validates %o (400)', async (body, message) => {
    const res = await edit(teacher, body)
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(message)
  })

  it('leaves the account unchanged if part of the edit cannot be saved', async () => {
    await withFailingUpdate('teachers', 'simulated failure', async () => {
      expect((await edit(teacher, { fullName: 'Half Saved', email: 'half.saved@iylh.test' })).status).toBe(500)
    })
    expect(await row('SELECT "full_name", "email" FROM users WHERE "user_id" = $1', teacher.user.user_id))
      .toEqual({ full_name: 'Ms Nkosi', email: teacher.email })
    expect((await login(teacher.email)).status).toBe(200)
  })
})

describe('POST /api/accounts/:userId/reset-password', () => {
  const reset = (target, password, user = master) =>
    request(app).post(`/api/accounts/${target.user.user_id}/reset-password`).set('Cookie', user.cookie).send({ password })

  let teacher
  beforeEach(async () => {
    teacher = await createUser('teacher')
  })

  it.each([
    ['teacher', () => teacher],
    ['manager', () => manager],
    ['standard admin', () => standard],
  ])('resets a %s: the new password signs in, the old one no longer does', async (_, target) => {
    expect((await reset(target(), 'Brand-new-pass-1')).status).toBe(200)
    expect((await login(target().email, 'Brand-new-pass-1')).status).toBe(200)
    expect((await login(target().email)).status).toBe(401)
    const { password_hash: hash } = (await pool.query('SELECT "password_hash" FROM users WHERE "user_id" = $1', [target().user.user_id])).rows[0]
    expect(hash).toMatch(/^\$2[aby]\$/)
  })

  it('signs them out everywhere, and they must choose their own password before using the app', async () => {
    expect((await request(app).get('/api/classes').set('Cookie', teacher.cookie)).status).toBe(200)
    expect((await reset(teacher, 'Temp-password-1')).status).toBe(200)

    // Their open session has ended.
    expect((await request(app).get('/api/classes').set('Cookie', teacher.cookie)).status).toBe(401)

    // Signing in with the temporary password works, but only to choose a new one.
    const signedIn = await login(teacher.email, 'Temp-password-1')
    expect(signedIn.status).toBe(200)
    expect(signedIn.body.user).toMatchObject({ mustChangePassword: true })
    const cookie = signedIn.headers['set-cookie']
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).body.user).toMatchObject({ mustChangePassword: true })
    const blocked = await request(app).get('/api/classes').set('Cookie', cookie)
    expect(blocked.status).toBe(403)
    expect(blocked.body.message).toBe('Please choose a new password before continuing')

    const changed = await request(app).post('/api/auth/change-password').set('Cookie', cookie)
      .send({ currentPassword: 'Temp-password-1', newPassword: 'Their-own-pass-1' })
    expect(changed.status).toBe(200)
    expect(changed.body.user).not.toHaveProperty('mustChangePassword')
    const fresh = changed.headers['set-cookie']
    expect((await request(app).get('/api/classes').set('Cookie', fresh)).status).toBe(200)
    expect((await login(teacher.email, 'Temp-password-1')).status).toBe(401)
  })

  it('cannot reset your own password (use Settings) (400)', async () => {
    const res = await reset(master, 'Brand-new-pass-1')
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/Settings/)
    expect((await login(master.email)).status).toBe(200)
  })

  it("cannot reset another master admin's or a parent's password (403)", async () => {
    const otherMaster = await createUser('admin_master')
    const parent = await createUser('guardian')
    expect((await reset(otherMaster, 'Brand-new-pass-1')).status).toBe(403)
    expect((await reset(parent, 'Brand-new-pass-1')).status).toBe(403)
    expect((await login(otherMaster.email)).status).toBe(200)
    expect((await login(parent.email)).status).toBe(200)
  })

  it.each(['admin_standard', 'manager', 'teacher', 'guardian'])('is refused to a %s (403) and changes nothing', async (role) => {
    const user = { admin_standard: standard, manager, teacher }[role] ?? (await createUser(role))
    expect((await reset(teacher, 'Hijacked-pass-1', user)).status).toBe(403)
    expect((await login(teacher.email)).status).toBe(200)
  })

  it.each([
    [undefined, /required/],
    ['short', /at least 8/],
  ])('validates the password %p (400)', async (password, message) => {
    const res = await reset(teacher, password)
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(message)
  })

  it('returns 404 for an account that does not exist', async () => {
    const res = await request(app).post('/api/accounts/999999/reset-password').set('Cookie', master.cookie).send({ password: 'Brand-new-pass-1' })
    expect(res.status).toBe(404)
  })
})

describe('The master admin can do everything a manager can', () => {
  const as = (method, path, body) => request(app)[method](path).set('Cookie', master.cookie).send(body)

  it('manages learners, classes and teachers', async () => {
    const yellowId = await classIdByName('Yellow')
    expect((await as('post', '/api/learners', { classId: yellowId, firstName: 'New', lastName: 'Learner' })).status).toBe(201)
    expect((await as('get', '/api/learners')).status).toBe(200)
    expect((await as('post', '/api/classes', { className: 'Brown', gradeRange: 'Gr 1-2' })).status).toBe(201)
    expect((await as('post', '/api/teacher', { email: 'new.t@iylh.test', password: 'Starting-pass-1', fullName: 'New T' })).status).toBe(201)
    expect((await as('get', `/api/attendance/class/${yellowId}`)).status).toBe(200)
    expect((await as('get', '/api/signout/today')).status).toBe(200)
  })

  it('but still cannot take attendance (teachers only) or use the guardian portal', async () => {
    expect((await as('post', '/api/attendance', { learnerId: 1, status: 'present' })).status).toBe(403)
    expect((await as('get', '/api/guardian/children')).status).toBe(403)
  })

  it('a standard admin still cannot use manager features (403)', async () => {
    const res = await request(app).get('/api/learners').set('Cookie', standard.cookie)
    expect(res.status).toBe(403)
  })
})

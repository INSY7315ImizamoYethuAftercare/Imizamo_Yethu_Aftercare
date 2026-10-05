// The master admin: does everything a manager can, and creates manager and
// standard admin accounts (GET/POST /api/accounts).
import { beforeEach, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import { loadApp } from '../helpers/app.js'
import { classIdByName, pool, resetDb, withFailingInsert } from '../helpers/db.js'
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

describe('POST /api/accounts', () => {
  it('creates a manager who can sign in and use manager features', async () => {
    const res = await create(NEW_MANAGER)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ fullName: 'Thabo Manager', email: 'thabo.manager@iylh.test', type: 'manager', isActive: true })

    const signedIn = await login('thabo.manager@iylh.test', 'Starting-pass-1')
    expect(signedIn.body.user).toMatchObject({ role: 'manager', fullName: 'Thabo Manager' })
    const cookie = signedIn.headers['set-cookie']
    expect((await request(app).get('/api/teacher').set('Cookie', cookie)).status).toBe(200)
  })

  it('creates a standard admin who sees totals only', async () => {
    const res = await create(NEW_ADMIN)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ type: 'standard_admin' })

    const signedIn = await login('lerato.admin@iylh.test', 'Starting-pass-1')
    expect(signedIn.body.user).toMatchObject({ role: 'admin', accessLevel: 'standard' })
    const cookie = signedIn.headers['set-cookie']
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

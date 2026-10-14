import { jest } from '@jest/globals'
import jwt from 'jsonwebtoken'
import { createAuthenticate, authorize } from './auth.js'

process.env.JWT_SECRET = 'test-secret-do-not-use-in-production'

// The account lookup is faked so these stay database-free.
const activeTeacher = { user_id: 1, role: 'teacher', is_active: true }
const authenticateWith = (user) => createAuthenticate({ findUserById: jest.fn(async () => user) })
const authenticate = authenticateWith(activeTeacher)
const tokenFor = (payload) => jwt.sign(payload, process.env.JWT_SECRET)

describe('authenticate', () => {
  it('rejects a request with no token', async () => {
    const next = jest.fn()
    await authenticate({ cookies: {} }, {}, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }))
  })

  it('rejects an invalid token', async () => {
    const next = jest.fn()
    await authenticate({ cookies: { token: 'nonsense' } }, {}, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }))
  })

  it('attaches the user for a valid token', async () => {
    const req = { cookies: { token: tokenFor({ userId: 1, role: 'teacher' }) } }
    const next = jest.fn()
    await authenticate(req, {}, next)
    expect(req.user).toMatchObject({ userId: 1, role: 'teacher' })
    expect(next).toHaveBeenCalledWith()
  })

  it.each([
    ['deactivated', { ...activeTeacher, is_active: false }],
    ['deleted', null],
    ['given a different role', { ...activeTeacher, role: 'guardian' }],
  ])('rejects a valid token whose account has been %s', async (_label, user) => {
    const req = { cookies: { token: tokenFor({ userId: 1, role: 'teacher' }) } }
    const next = jest.fn()
    await authenticateWith(user)(req, {}, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, message: 'Session is no longer valid' }))
    expect(req.user).toBeUndefined()
  })

  describe('after a password change', () => {
    const changedAt = new Date('2026-10-14T09:00:00.123Z')
    const changedTeacher = { ...activeTeacher, password_changed_at: changedAt }

    it('rejects a session started before the change (no password version)', async () => {
      const req = { cookies: { token: tokenFor({ userId: 1, role: 'teacher' }) } }
      const next = jest.fn()
      await authenticateWith(changedTeacher)(req, {}, next)
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401, message: 'Session is no longer valid' }))
    })

    it('rejects a session from an earlier change', async () => {
      const req = { cookies: { token: tokenFor({ userId: 1, role: 'teacher', pwv: changedAt.getTime() - 60_000 }) } }
      const next = jest.fn()
      await authenticateWith(changedTeacher)(req, {}, next)
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }))
    })

    it('accepts a session issued after the latest change', async () => {
      const req = { cookies: { token: tokenFor({ userId: 1, role: 'teacher', pwv: changedAt.getTime() }) } }
      const next = jest.fn()
      await authenticateWith(changedTeacher)(req, {}, next)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('when the user must choose a new password (after a reset)', () => {
    const resetTeacher = { ...activeTeacher, must_change_password: true }
    const req = () => ({ cookies: { token: tokenFor({ userId: 1, role: 'teacher' }) } })

    it('refuses them on ordinary routes (403)', async () => {
      const r = req()
      const next = jest.fn()
      await authenticateWith(resetTeacher)(r, {}, next)
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403, message: 'Please choose a new password before continuing' }))
      expect(r.user).toBeUndefined()
    })

    it('lets them through where allowed (/me, /change-password), flagged', async () => {
      const allowing = createAuthenticate({ findUserById: jest.fn(async () => resetTeacher), allowPendingPasswordChange: true })
      const r = req()
      const next = jest.fn()
      await allowing(r, {}, next)
      expect(next).toHaveBeenCalledWith()
      expect(r.user).toMatchObject({ userId: 1, mustChangePassword: true })
    })
  })

  it('passes a database error on (500), rather than letting the request through', async () => {
    const failing = createAuthenticate({ findUserById: jest.fn(async () => { throw new Error('db down') }) })
    const req = { cookies: { token: tokenFor({ userId: 1, role: 'teacher' }) } }
    const next = jest.fn()
    await failing(req, {}, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'db down' }))
    expect(req.user).toBeUndefined()
  })
})

describe('authorize', () => {
  it('blocks a role that is not allowed', () => {
    const next = jest.fn()
    authorize('teacher')({ user: { userId: 1, role: 'guardian' } }, {}, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }))
  })

  it('allows a role that is in the list', () => {
    const next = jest.fn()
    authorize('teacher', 'manager')({ user: { userId: 1, role: 'manager' } }, {}, next)
    expect(next).toHaveBeenCalledWith()
  })
})
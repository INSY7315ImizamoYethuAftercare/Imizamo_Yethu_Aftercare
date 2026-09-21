import { jest } from '@jest/globals'
import jwt from 'jsonwebtoken'
import { authenticate, authorize } from './auth.js'

process.env.JWT_SECRET = 'test-secret-do-not-use-in-production'

describe('authenticate', () => {
  it('rejects a request with no token', () => {
    const next = jest.fn()
    authenticate({ cookies: {} }, {}, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }))
  })

  it('rejects an invalid token', () => {
    const next = jest.fn()
    authenticate({ cookies: { token: 'nonsense' } }, {}, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }))
  })

  it('attaches the user for a valid token', () => {
    const token = jwt.sign({ userId: 1, role: 'teacher' }, process.env.JWT_SECRET)
    const req = { cookies: { token } }
    const next = jest.fn()
    authenticate(req, {}, next)
    expect(req.user).toMatchObject({ userId: 1, role: 'teacher' })
    expect(next).toHaveBeenCalledWith()
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
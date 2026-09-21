import { jest } from '@jest/globals'
import bcrypt from 'bcryptjs'
import { AuthService } from './AuthService.js'

describe('AuthService', () => {
  let userRepository
  let authService

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-do-not-use-in-production'
    userRepository = { findByEmail: jest.fn(), createUser: jest.fn() }
    authService = new AuthService(userRepository)
  })

  it('creates a user when the email is free', async () => {
    userRepository.findByEmail.mockResolvedValue(null)
    userRepository.createUser.mockResolvedValue({
      user_id: 1, email: 'teacher1@iylh.org', role: 'teacher', full_name: 'Test Teacher',
    })

    const user = await authService.register({
      email: 'teacher1@iylh.org', password: 'testpass123', role: 'teacher', fullName: 'Test Teacher',
    })

    expect(user.email).toBe('teacher1@iylh.org')
  })

  it('rejects a duplicate email', async () => {
    userRepository.findByEmail.mockResolvedValue({ user_id: 1 })
    await expect(
      authService.register({ email: 'a@b.org', password: 'x', role: 'teacher', fullName: 'X' }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('rejects login for an unknown email', async () => {
    userRepository.findByEmail.mockResolvedValue(null)
    await expect(
      authService.login({ email: 'nobody@iylh.org', password: 'whatever' }),
    ).rejects.toMatchObject({ status: 401 })
  })

  it('rejects login with a wrong password', async () => {
    const passwordHash = await bcrypt.hash('correctpassword', 10)
    userRepository.findByEmail.mockResolvedValue({
      user_id: 1, email: 'a@b.org', password_hash: passwordHash, role: 'teacher', full_name: 'T',
    })
    await expect(
      authService.login({ email: 'a@b.org', password: 'wrongpassword' }),
    ).rejects.toMatchObject({ status: 401 })
  })

  it('returns a token on correct credentials', async () => {
    const passwordHash = await bcrypt.hash('correctpassword', 10)
    userRepository.findByEmail.mockResolvedValue({
      user_id: 1, email: 'a@b.org', password_hash: passwordHash, role: 'teacher', full_name: 'T',
    })
    const result = await authService.login({ email: 'a@b.org', password: 'correctpassword' })
    expect(result.token).toBeDefined()
    expect(result.user.role).toBe('teacher')
  })
})
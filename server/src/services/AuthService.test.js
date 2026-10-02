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

  describe('register', () => {
    it('creates a guardian account when the email is free', async () => {
      userRepository.findByEmail.mockResolvedValue(null)
      userRepository.createUser.mockResolvedValue({
        user_id: 1, email: 'parent1@iylh.org', role: 'guardian', full_name: 'Test Guardian',
      })

      const user = await authService.register({
        email: 'parent1@iylh.org', password: 'testpass123', role: 'guardian', fullName: 'Test Guardian',
      })

      expect(user.email).toBe('parent1@iylh.org')
    })

    it('rejects a duplicate email', async () => {
      userRepository.findByEmail.mockResolvedValue({ user_id: 1 })
      await expect(
        authService.register({ email: 'a@b.org', password: 'x', role: 'guardian', fullName: 'X' }),
      ).rejects.toMatchObject({ status: 409 })
    })

    it('rejects self-registration as a staff role', async () => {
      await expect(
        authService.register({ email: 'a@b.org', password: 'x', role: 'teacher', fullName: 'X' }),
      ).rejects.toMatchObject({ status: 403 })
      // Staff roles are blocked before any database lookup even happens.
      expect(userRepository.findByEmail).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('rejects login for an unknown email', async () => {
      userRepository.findByEmail.mockResolvedValue(null)
      await expect(
        authService.login({ email: 'nobody@iylh.org', password: 'whatever' }),
      ).rejects.toMatchObject({ status: 401 })
    })

    it('rejects login with a wrong password', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 10)
      userRepository.findByEmail.mockResolvedValue({
        user_id: 1, email: 'a@b.org', password_hash: passwordHash, role: 'teacher', full_name: 'T', is_active: true,
      })
      await expect(
        authService.login({ email: 'a@b.org', password: 'wrongpassword' }),
      ).rejects.toMatchObject({ status: 401 })
    })

    it('rejects login for a deactivated account, even with the correct password', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 10)
      userRepository.findByEmail.mockResolvedValue({
        user_id: 1, email: 'a@b.org', password_hash: passwordHash, role: 'teacher', full_name: 'T', is_active: false,
      })
      await expect(
        authService.login({ email: 'a@b.org', password: 'correctpassword' }),
      ).rejects.toMatchObject({ status: 403 })
    })

    it('returns a token on correct credentials for an active account', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 10)
      userRepository.findByEmail.mockResolvedValue({
        user_id: 1, email: 'a@b.org', password_hash: passwordHash, role: 'teacher', full_name: 'T', is_active: true,
      })
      const result = await authService.login({ email: 'a@b.org', password: 'correctpassword' })
      expect(result.token).toBeDefined()
      expect(result.user.role).toBe('teacher')
    })
  })
})
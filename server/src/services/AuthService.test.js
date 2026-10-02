import { jest } from '@jest/globals'
import bcrypt from 'bcryptjs'
import { AuthService } from './AuthService.js'

describe('AuthService', () => {
  let deps
  let authService

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-do-not-use-in-production'
    deps = {
      userRepository: { findByEmail: jest.fn(), createUser: jest.fn() },
      guardianRepository: { create: jest.fn() },
      learnerRepository: { findByFullNameAndDob: jest.fn() },
      pickupPermissionRepository: { create: jest.fn() },
    }
    authService = new AuthService(deps)
  })

  describe('register', () => {
    it('rejects self-registration as a staff role, before any database call', async () => {
      await expect(
        authService.register({ email: 'a@b.org', password: 'x', role: 'teacher', fullName: 'X' }),
      ).rejects.toMatchObject({ status: 403 })
      expect(deps.userRepository.findByEmail).not.toHaveBeenCalled()
    })

    it('rejects a duplicate email', async () => {
      deps.userRepository.findByEmail.mockResolvedValue({ user_id: 1 })
      await expect(
        authService.register({ email: 'a@b.org', password: 'x', role: 'guardian', fullName: 'X' }),
      ).rejects.toMatchObject({ status: 409 })
    })

    it('rejects guardian registration missing required fields', async () => {
      deps.userRepository.findByEmail.mockResolvedValue(null)
      await expect(
        authService.register({ email: 'parent1@iylh.org', password: 'testpass123', role: 'guardian', fullName: 'Parent' }),
      ).rejects.toMatchObject({ status: 400 })
    })

    it('rejects guardian registration when no matching learner is found', async () => {
      deps.userRepository.findByEmail.mockResolvedValue(null)
      deps.learnerRepository.findByFullNameAndDob.mockResolvedValue(null)

      await expect(
        authService.register({
          email: 'parent1@iylh.org', password: 'testpass123', role: 'guardian', fullName: 'Parent',
          contactNumber: '0821234567', relationship: 'Mother',
          claimedLearnerName: 'Nonexistent Learner', claimedLearnerDob: '2018-01-01',
        }),
      ).rejects.toMatchObject({ status: 404 })
    })

    it('creates the guardian and links pickup permission when the learner matches', async () => {
      deps.userRepository.findByEmail.mockResolvedValue(null)
      deps.learnerRepository.findByFullNameAndDob.mockResolvedValue({ learner_id: 3 })
      deps.userRepository.createUser.mockResolvedValue({ user_id: 9, email: 'parent1@iylh.org' })
      deps.guardianRepository.create.mockResolvedValue({ guardian_id: 5 })

      const user = await authService.register({
        email: 'parent1@iylh.org', password: 'testpass123', role: 'guardian', fullName: 'Parent',
        contactNumber: '0821234567', relationship: 'Mother',
        claimedLearnerName: 'Test Learner', claimedLearnerDob: '2018-01-01',
      })

      expect(user.user_id).toBe(9)
      expect(deps.pickupPermissionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ learnerId: 3, guardianId: 5, isPrimaryContact: true }),
      )
    })
  })

  describe('login', () => {
    it('rejects login for an unknown email', async () => {
      deps.userRepository.findByEmail.mockResolvedValue(null)
      await expect(
        authService.login({ email: 'nobody@iylh.org', password: 'whatever' }),
      ).rejects.toMatchObject({ status: 401 })
    })

    it('rejects login with a wrong password, without crashing', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 10)
      deps.userRepository.findByEmail.mockResolvedValue({
        user_id: 1, email: 'a@b.org', password_hash: passwordHash, role: 'teacher', full_name: 'T', is_active: true,
      })
      await expect(
        authService.login({ email: 'a@b.org', password: 'wrongpassword' }),
      ).rejects.toMatchObject({ status: 401 })
    })

    it('rejects login for a deactivated account, even with the correct password', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 10)
      deps.userRepository.findByEmail.mockResolvedValue({
        user_id: 1, email: 'a@b.org', password_hash: passwordHash, role: 'teacher', full_name: 'T', is_active: false,
      })
      await expect(
        authService.login({ email: 'a@b.org', password: 'correctpassword' }),
      ).rejects.toMatchObject({ status: 403 })
    })

    it('returns a token on correct credentials for an active account', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 10)
      deps.userRepository.findByEmail.mockResolvedValue({
        user_id: 1, email: 'a@b.org', password_hash: passwordHash, role: 'teacher', full_name: 'T', is_active: true,
      })
      const result = await authService.login({ email: 'a@b.org', password: 'correctpassword' })
      expect(result.token).toBeDefined()
      expect(result.user.role).toBe('teacher')
    })
  })
})
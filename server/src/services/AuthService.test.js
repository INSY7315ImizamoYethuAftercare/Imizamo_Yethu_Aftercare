import { jest } from '@jest/globals'
import bcrypt from 'bcryptjs'
import { AuthService } from './AuthService.js'

describe('AuthService', () => {
  let userRepository
  let guardianRepository
  let learnerRepository
  let pickupPermissionRepository
  let authService

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-do-not-use-in-production'
    userRepository = { findByEmail: jest.fn(), createUser: jest.fn() }
    guardianRepository = { create: jest.fn() }
    learnerRepository = { findByFullNameAndDob: jest.fn() }
    pickupPermissionRepository = { create: jest.fn() }
    authService = new AuthService({
      userRepository, guardianRepository, learnerRepository, pickupPermissionRepository,
    })
  })

  const guardianSignup = {
    email: 'parent@example.org', password: 'testpass123', role: 'guardian', fullName: 'Test Parent',
    contactNumber: '0721234567', relationship: 'Mother',
    claimedLearnerName: 'Anisha Nerwande', claimedLearnerDob: '2016-03-01',
  }

  it('creates a guardian and links them to the matching learner', async () => {
    userRepository.findByEmail.mockResolvedValue(null)
    learnerRepository.findByFullNameAndDob.mockResolvedValue({ learner_id: 7 })
    userRepository.createUser.mockResolvedValue({ user_id: 1, email: guardianSignup.email, role: 'guardian' })
    guardianRepository.create.mockResolvedValue({ guardian_id: 3 })

    const user = await authService.register(guardianSignup)

    expect(user.email).toBe(guardianSignup.email)
    expect(pickupPermissionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ learnerId: 7, guardianId: 3 }),
    )
  })

  it.each(['teacher', 'manager', 'admin'])('does not let a %s self-register', async (role) => {
    await expect(
      authService.register({ email: 'a@b.org', password: 'testpass123', role, fullName: 'X' }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('rejects a duplicate email', async () => {
    userRepository.findByEmail.mockResolvedValue({ user_id: 1 })
    await expect(authService.register(guardianSignup)).rejects.toMatchObject({ status: 409 })
  })

  it('rejects login for an unknown email', async () => {
    userRepository.findByEmail.mockResolvedValue(null)
    await expect(
      authService.login({ email: 'nobody@iylh.org', password: 'whatever' }),
    ).rejects.toMatchObject({ status: 401, message: 'Invalid email or password' })
  })

  it('rejects login with a wrong password using the same message as an unknown email', async () => {
    const passwordHash = await bcrypt.hash('correctpassword', 10)
    userRepository.findByEmail.mockResolvedValue({
      user_id: 1, email: 'a@b.org', password_hash: passwordHash, role: 'teacher', full_name: 'T', is_active: true,
    })
    await expect(
      authService.login({ email: 'a@b.org', password: 'wrongpassword' }),
    ).rejects.toMatchObject({ status: 401, message: 'Invalid email or password' })
  })

  it('rejects login for a deactivated account', async () => {
    const passwordHash = await bcrypt.hash('correctpassword', 10)
    userRepository.findByEmail.mockResolvedValue({
      user_id: 1, email: 'a@b.org', password_hash: passwordHash, role: 'teacher', full_name: 'T', is_active: false,
    })
    await expect(
      authService.login({ email: 'a@b.org', password: 'correctpassword' }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('returns a token and the user profile on correct credentials', async () => {
    const passwordHash = await bcrypt.hash('correctpassword', 10)
    userRepository.findByEmail.mockResolvedValue({
      user_id: 1, email: 'a@b.org', password_hash: passwordHash, role: 'teacher', full_name: 'T', is_active: true,
    })
    const result = await authService.login({ email: 'a@b.org', password: 'correctpassword' })
    expect(result.token).toBeDefined()
    expect(result.user).toMatchObject({ role: 'teacher', fullName: 'T' })
  })
})

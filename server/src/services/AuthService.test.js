import { jest } from '@jest/globals'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
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
      userRepository,
      guardianRepository,
      learnerRepository,
      pickupPermissionRepository,
    })
  })

  const guardianSignup = {
    email: 'parent@example.org',
    password: 'testpass123',
    role: 'guardian',
    fullName: 'Test Parent',
    contactNumber: '0721234567',
    relationship: 'Mother',
    claimedLearnerName: 'Anisha Nerwande',
    claimedLearnerDob: '2016-03-01',
  }

  describe('register', () => {
    it.each(['teacher', 'manager', 'admin'])('rejects self-registration for staff role: %s', async (role) => {
      await expect(
        authService.register({ email: 'a@b.org', password: 'x', role, fullName: 'X' }),
      ).rejects.toMatchObject({ status: 403 })
      expect(userRepository.findByEmail).not.toHaveBeenCalled()
    })

    it('rejects a duplicate email', async () => {
      userRepository.findByEmail.mockResolvedValue({ user_id: 1 })
      await expect(authService.register(guardianSignup)).rejects.toMatchObject({ status: 409 })
    })

    it('rejects guardian registration missing required fields', async () => {
      userRepository.findByEmail.mockResolvedValue(null)
      await expect(
        authService.register({ email: 'parent1@iylh.org', password: 'testpass123', role: 'guardian', fullName: 'Parent' }),
      ).rejects.toMatchObject({ status: 400 })
    })

    it('rejects guardian registration when no matching learner is found', async () => {
      userRepository.findByEmail.mockResolvedValue(null)
      learnerRepository.findByFullNameAndDob.mockResolvedValue(null)

      await expect(
        authService.register(guardianSignup),
      ).rejects.toMatchObject({ status: 404 })
    })

    it('creates a guardian and links them to the matching learner', async () => {
      userRepository.findByEmail.mockResolvedValue(null)
      learnerRepository.findByFullNameAndDob.mockResolvedValue({ learner_id: 7 })
      userRepository.createUser.mockResolvedValue({ user_id: 1, email: guardianSignup.email, role: 'guardian' })
      guardianRepository.create.mockResolvedValue({ guardian_id: 3 })

      const user = await authService.register(guardianSignup)

      expect(user.email).toBe(guardianSignup.email)
      expect(pickupPermissionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ learnerId: 7, guardianId: 3, isPrimaryContact: true }),
      )
    })
  })

  describe('login', () => {
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

    describe('changePassword', () => {
      beforeEach(async () => {
        const account = { user_id: 1, email: 'a@b.org', role: 'teacher', full_name: 'T', is_active: true }
        userRepository.findById = jest.fn().mockResolvedValue(account)
        userRepository.findByEmail.mockResolvedValue({ ...account, password_hash: await bcrypt.hash('current-pass', 4) })
        userRepository.setPassword = jest.fn(async (_id, _hash, { changedAt, mustChangePassword }) => ({
          ...account, password_changed_at: changedAt, must_change_password: mustChangePassword,
        }))
      })

      it('saves a hash of the new password and returns a fresh session for this device', async () => {
        const result = await authService.changePassword({ userId: 1, currentPassword: 'current-pass', newPassword: 'brand-new-pass' })
        const [id, hash, options] = userRepository.setPassword.mock.calls[0]
        expect(id).toBe(1)
        expect(await bcrypt.compare('brand-new-pass', hash)).toBe(true)
        expect(options.mustChangePassword).toBe(false)
        // The new token carries the new password version, so only it stays valid.
        expect(jwt.decode(result.token)).toMatchObject({ userId: 1, role: 'teacher', pwv: options.changedAt.getTime() })
        expect(result.user).toEqual({ userId: 1, email: 'a@b.org', role: 'teacher', fullName: 'T' })
      })

      it('clears "must change password" after a reset', async () => {
        userRepository.findById.mockResolvedValue({ user_id: 1, email: 'a@b.org', role: 'teacher', must_change_password: true })
        const result = await authService.changePassword({ userId: 1, currentPassword: 'current-pass', newPassword: 'brand-new-pass' })
        expect(userRepository.setPassword.mock.calls[0][2].mustChangePassword).toBe(false)
        expect(result.user).not.toHaveProperty('mustChangePassword')
      })

      it('refuses a wrong current password with 400 (not 401, which would sign them out)', async () => {
        await expect(
          authService.changePassword({ userId: 1, currentPassword: 'wrong', newPassword: 'brand-new-pass' }),
        ).rejects.toMatchObject({ status: 400, message: 'Your current password is incorrect' })
        expect(userRepository.setPassword).not.toHaveBeenCalled()
      })

      it('refuses a new password that is the same as the current one', async () => {
        await expect(
          authService.changePassword({ userId: 1, currentPassword: 'current-pass', newPassword: 'current-pass' }),
        ).rejects.toMatchObject({ status: 400 })
        expect(userRepository.setPassword).not.toHaveBeenCalled()
      })
    })

    it('tells the app when a user must choose a new password (after a reset)', async () => {
      userRepository.findByEmail.mockResolvedValue({
        user_id: 1, email: 'a@b.org', password_hash: await bcrypt.hash('temp-password', 4), role: 'teacher',
        full_name: 'T', is_active: true, must_change_password: true, password_changed_at: new Date('2026-10-14T09:00:00Z'),
      })
      const result = await authService.login({ email: 'a@b.org', password: 'temp-password' })
      expect(result.user).toMatchObject({ mustChangePassword: true })
      expect(jwt.decode(result.token).pwv).toBe(new Date('2026-10-14T09:00:00Z').getTime())
    })

    describe('with the role card picked on the login screen', () => {
      const signInAs = async (accountRole, pickedRole, password = 'correctpassword') => {
        userRepository.findByEmail.mockResolvedValue({
          user_id: 1, email: 'a@b.org', password_hash: await bcrypt.hash('correctpassword', 10),
          role: accountRole, full_name: 'T', is_active: true,
        })
        return authService.login({ email: 'a@b.org', password, role: pickedRole })
      }

      it('signs in when the picked role matches the account', async () => {
        const result = await signInAs('guardian', 'guardian')
        expect(result.token).toBeDefined()
        expect(result.user).toMatchObject({ role: 'guardian' })
      })

      it.each([
        ['admin', 'guardian'],
        ['guardian', 'teacher'],
        ['teacher', 'manager'],
        ['manager', 'admin'],
      ])('rejects a %s account signing in as %s', async (accountRole, pickedRole) => {
        await expect(signInAs(accountRole, pickedRole)).rejects.toMatchObject({
          status: 403,
          message: expect.stringMatching(/Wrong account type/),
        })
      })

      it('reports a wrong password before a wrong role, so roles are not revealed', async () => {
        await expect(signInAs('admin', 'guardian', 'wrongpassword')).rejects.toMatchObject({
          status: 401, message: 'Invalid email or password',
        })
      })

      it('lets a master admin sign in with the Admin card only', async () => {
        authService = new AuthService({
          userRepository,
          adminRepository: { findByUserId: jest.fn().mockResolvedValue({ access_level: 'master' }) },
        })
        expect((await signInAs('admin', 'admin')).user).toMatchObject({ role: 'admin', accessLevel: 'master' })
        await expect(signInAs('admin', 'manager')).rejects.toMatchObject({ status: 403 })
      })
    })
  })
})
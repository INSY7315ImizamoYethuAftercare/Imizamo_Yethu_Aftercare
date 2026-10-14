import { jest } from '@jest/globals'
import bcrypt from 'bcryptjs'
import { AccountService } from './AccountService.js'

describe('AccountService.updateAccount', () => {
  const MASTER = 5
  let users
  let admins
  let tx
  let service

  beforeEach(() => {
    users = {
      5: { user_id: 5, email: 'master@iylh.org', role: 'admin', full_name: 'Nomvula Dube', is_active: true },
      7: { user_id: 7, email: 'other.master@iylh.org', role: 'admin', full_name: 'Other Master', is_active: true },
      3: { user_id: 3, email: 'admin@iylh.org', role: 'admin', full_name: 'Pieter Jacobs', is_active: true },
      31: { user_id: 31, email: 'nkosi@iylh.org', role: 'teacher', full_name: 'Ms Nkosi', is_active: true },
      40: { user_id: 40, email: 'parent@example.org', role: 'guardian', full_name: 'A Parent', is_active: true },
    }
    admins = {
      5: { admin_id: 1, access_level: 'master' },
      7: { admin_id: 2, access_level: 'master' },
      3: { admin_id: 3, access_level: 'standard' },
    }
    const userRepository = {
      findById: jest.fn(async (id) => users[id] ?? null),
      findByEmail: jest.fn(async (email) => Object.values(users).find((u) => u.email === email) ?? null),
    }
    const adminRepository = { findByUserId: jest.fn(async (id) => admins[id] ?? null) }
    tx = {
      userRepository: { updateById: jest.fn(async (id, fields) => ({ ...users[id], ...fields })) },
      teacherRepository: {
        findByUserId: jest.fn(async (id) => (id === 31 ? { teacher_id: 21 } : null)),
        update: jest.fn(),
      },
      managerRepository: {
        findByUserId: jest.fn(async (id) => (id === 5 ? { manager_id: 9 } : null)),
        updateFullName: jest.fn(),
      },
      adminRepository: { findByUserId: adminRepository.findByUserId, update: jest.fn() },
    }
    service = new AccountService({ userRepository, adminRepository, runInTransaction: (work) => work(tx) })
  })

  it('only lets a master admin edit accounts', async () => {
    await expect(
      service.updateAccount({ userId: 3, targetUserId: 31, changes: { fullName: 'X' } }),
    ).rejects.toMatchObject({ status: 403 })
    expect(tx.userRepository.updateById).not.toHaveBeenCalled()
  })

  it("edits a teacher and keeps the teachers row's name and contact email in step", async () => {
    const result = await service.updateAccount({
      userId: MASTER, targetUserId: 31, changes: { fullName: 'Thandeka Nkosi', email: 'thandeka@iylh.org' },
    })
    expect(tx.userRepository.updateById).toHaveBeenCalledWith(31, { full_name: 'Thandeka Nkosi', email: 'thandeka@iylh.org' })
    expect(tx.teacherRepository.update).toHaveBeenCalledWith(21, { full_name: 'Thandeka Nkosi', contact_email: 'thandeka@iylh.org' })
    expect(result).toMatchObject({ userId: 31, fullName: 'Thandeka Nkosi', email: 'thandeka@iylh.org', role: 'teacher' })
  })

  it('ignores a password passed to the ordinary edit', async () => {
    await service.updateAccount({ userId: MASTER, targetUserId: 3, changes: { fullName: 'P J', password: 'New-password-1' } })
    expect(tx.userRepository.updateById).toHaveBeenCalledWith(3, { full_name: 'P J' })
  })

  it('renames a master admin in both their admins and managers rows', async () => {
    await service.updateAccount({ userId: MASTER, targetUserId: MASTER, changes: { fullName: 'Nomvula D' } })
    expect(tx.adminRepository.update).toHaveBeenCalledWith(1, { full_name: 'Nomvula D' })
    expect(tx.managerRepository.updateFullName).toHaveBeenCalledWith(9, 'Nomvula D')
  })

  it("refuses to edit another master admin's account", async () => {
    await expect(
      service.updateAccount({ userId: MASTER, targetUserId: 7, changes: { fullName: 'X' } }),
    ).rejects.toMatchObject({ status: 403 })
    expect(tx.userRepository.updateById).not.toHaveBeenCalled()
  })

  it('refuses to edit a parent account', async () => {
    await expect(
      service.updateAccount({ userId: MASTER, targetUserId: 40, changes: { fullName: 'X' } }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('returns 404 for an unknown account', async () => {
    await expect(
      service.updateAccount({ userId: MASTER, targetUserId: 999, changes: { fullName: 'X' } }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it("rejects an email that belongs to someone else, but allows keeping your own", async () => {
    await expect(
      service.updateAccount({ userId: MASTER, targetUserId: 31, changes: { email: 'admin@iylh.org' } }),
    ).rejects.toMatchObject({ status: 409 })
    await expect(
      service.updateAccount({ userId: MASTER, targetUserId: 31, changes: { email: 'nkosi@iylh.org' } }),
    ).resolves.toMatchObject({ email: 'nkosi@iylh.org' })
  })

  it('turns a unique-email clash during the write into a 409', async () => {
    tx.userRepository.updateById.mockRejectedValue(Object.assign(new Error('duplicate'), { code: '23505' }))
    await expect(
      service.updateAccount({ userId: MASTER, targetUserId: 31, changes: { email: 'new@iylh.org' } }),
    ).rejects.toMatchObject({ status: 409 })
  })

  describe('resetPassword', () => {
    beforeEach(() => {
      service.userRepository.setPassword = jest.fn(async () => ({}))
    })

    it('stores a bcrypt hash, and makes them choose their own password and sign in again', async () => {
      const before = Date.now()
      await service.resetPassword({ userId: MASTER, targetUserId: 31, password: 'New-password-1' })
      const [id, hash, options] = service.userRepository.setPassword.mock.calls[0]
      expect(id).toBe(31)
      expect(await bcrypt.compare('New-password-1', hash)).toBe(true)
      expect(options.mustChangePassword).toBe(true)
      expect(options.changedAt.getTime()).toBeGreaterThanOrEqual(before)
    })

    it('is not for your own account (use Settings)', async () => {
      await expect(
        service.resetPassword({ userId: MASTER, targetUserId: MASTER, password: 'New-password-1' }),
      ).rejects.toMatchObject({ status: 400, message: expect.stringMatching(/Settings/) })
      expect(service.userRepository.setPassword).not.toHaveBeenCalled()
    })

    it.each([
      [7, 403, 'another master admin'],
      [40, 403, 'a parent'],
      [999, 404, 'an unknown account'],
    ])('refuses user %i (%i, %s)', async (targetUserId, status) => {
      await expect(
        service.resetPassword({ userId: MASTER, targetUserId, password: 'New-password-1' }),
      ).rejects.toMatchObject({ status })
      expect(service.userRepository.setPassword).not.toHaveBeenCalled()
    })

    it('only a master admin can reset passwords', async () => {
      await expect(
        service.resetPassword({ userId: 3, targetUserId: 31, password: 'New-password-1' }),
      ).rejects.toMatchObject({ status: 403 })
    })
  })
})

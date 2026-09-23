import { jest } from '@jest/globals'
import { SignOutService } from './SignOutService.js'

describe('SignOutService', () => {
  let deps
  let service

  beforeEach(() => {
    deps = {
      signOutRepository: { create: jest.fn() },
      pickupPermissionRepository: { verifyGuardian: jest.fn() },
      teacherRepository: { findByUserId: jest.fn().mockResolvedValue({ teacher_id: 7 }) },
      learnerRepository: { findById: jest.fn().mockResolvedValue({ learner_id: 3, can_walk_home_alone: false }) },
    }
    service = new SignOutService(deps)
  })

  it('reports an authorised guardian', async () => {
    deps.pickupPermissionRepository.verifyGuardian.mockResolvedValue(true)
    const result = await service.verifyGuardian({ userId: 1, learnerId: 3, guardianId: 9 })
    expect(result.authorised).toBe(true)
  })

  it('reports an unauthorised guardian', async () => {
    deps.pickupPermissionRepository.verifyGuardian.mockResolvedValue(false)
    const result = await service.verifyGuardian({ userId: 1, learnerId: 3, guardianId: 9 })
    expect(result.authorised).toBe(false)
  })

  it('blocks a sign-out for an unauthorised guardian', async () => {
    deps.pickupPermissionRepository.verifyGuardian.mockResolvedValue(false)
    await expect(
      service.confirmSignOut({ userId: 1, learnerId: 3, guardianId: 9, timeOut: '16:00:00', recordDate: '2026-09-21' }),
    ).rejects.toMatchObject({ status: 403 })
    expect(deps.signOutRepository.create).not.toHaveBeenCalled()
  })

  it('records a sign-out for an authorised guardian', async () => {
    deps.pickupPermissionRepository.verifyGuardian.mockResolvedValue(true)
    deps.signOutRepository.create.mockResolvedValue({ record_id: 55 })
    const record = await service.confirmSignOut({
      userId: 1, learnerId: 3, guardianId: 9, timeOut: '16:00:00', recordDate: '2026-09-21',
    })
    expect(record.record_id).toBe(55)
  })

  it('rejects a non-teacher user', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue(null)
    await expect(
      service.verifyGuardian({ userId: 99, learnerId: 3, guardianId: 9 }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
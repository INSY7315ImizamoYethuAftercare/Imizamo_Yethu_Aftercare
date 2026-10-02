import { jest } from '@jest/globals'
import { GuardianService } from './GuardianService.js'

describe('GuardianService', () => {
  let deps
  let service

  beforeEach(() => {
    deps = {
      guardianRepository: { findByUserId: jest.fn().mockResolvedValue({ guardian_id: 4 }) },
      learnerRepository: {
        findByGuardianId: jest.fn().mockResolvedValue([{ learner_id: 3 }]),
        findById: jest.fn().mockResolvedValue({ learner_id: 3, first_name: 'Test' }),
      },
      attendanceRepository: {},
      observationRepository: { findByLearnerId: jest.fn().mockResolvedValue([]) },
    }
    service = new GuardianService(deps)
  })

  it('returns only the guardian own children', async () => {
    const children = await service.getMyChildren(1)
    expect(children).toHaveLength(1)
    expect(children[0].learner_id).toBe(3)
  })

  it('allows access to the guardian own child', async () => {
    const profile = await service.getChildProfile({ userId: 1, learnerId: 3 })
    expect(profile.learner_id).toBe(3)
  })

  it('blocks access to another family child', async () => {
    await expect(
      service.getChildProfile({ userId: 1, learnerId: 99 }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('blocks a non-guardian user', async () => {
    deps.guardianRepository.findByUserId.mockResolvedValue(null)
    await expect(service.getMyChildren(1)).rejects.toMatchObject({ status: 403 })
  })
})
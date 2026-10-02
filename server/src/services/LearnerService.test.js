import { jest } from '@jest/globals'
import { LearnerService } from './LearnerService.js'

describe('LearnerService', () => {
  let deps
  let service

  beforeEach(() => {
    deps = {
      learnerRepository: { findAll: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      schoolClassRepository: { findById: jest.fn() },
      managerRepository: { findByUserId: jest.fn() },
    }
    service = new LearnerService(deps)
  })

  it('blocks a non-manager from listing learners', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue(null)
    await expect(service.listLearners({ userId: 1 })).rejects.toMatchObject({ status: 403 })
  })

  it('creates a learner when the target class exists', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    deps.schoolClassRepository.findById.mockResolvedValue({ class_id: 5 })
    deps.learnerRepository.create.mockResolvedValue({ learner_id: 10 })

    const result = await service.createLearner({
      userId: 1, classId: 5, firstName: 'Test', lastName: 'Learner', dateOfBirth: '2018-01-01', canWalkHomeAlone: false,
    })

    expect(result.learner_id).toBe(10)
  })

  it('rejects creating a learner in a class that does not exist', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    deps.schoolClassRepository.findById.mockResolvedValue(null)
    await expect(
      service.createLearner({ userId: 1, classId: 999, firstName: 'Test', lastName: 'Learner' }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('rejects moving a learner to a class that does not exist', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    deps.schoolClassRepository.findById.mockResolvedValue(null)
    await expect(
      service.updateLearner({ userId: 1, learnerId: 3, fields: { class_id: 999 } }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('returns 409 when deleting a learner with dependent records', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    const dbError = new Error('foreign key violation'); dbError.code = '23503'
    deps.learnerRepository.delete.mockRejectedValue(dbError)

    await expect(service.deleteLearner({ userId: 1, learnerId: 3 })).rejects.toMatchObject({ status: 409 })
  })
})
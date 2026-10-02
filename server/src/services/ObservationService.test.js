import { jest } from '@jest/globals'
import { ObservationService } from './ObservationService.js'

describe('ObservationService', () => {
  let deps
  let service

  beforeEach(() => {
    deps = {
      observationRepository: { create: jest.fn(), findByLearnerId: jest.fn(), update: jest.fn(), delete: jest.fn() },
      learnerRepository: { findById: jest.fn() },
      schoolClassRepository: { findById: jest.fn() },
      teacherRepository: { findByUserId: jest.fn() },
    }
    service = new ObservationService(deps)
  })

  it('adds an observation for any learner, for any teacher', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
    deps.learnerRepository.findById.mockResolvedValue({ learner_id: 3, class_id: 5 })
    deps.observationRepository.create.mockResolvedValue({ observation_id: 1 })

    const result = await service.addObservation({
      userId: 1, learnerId: 3, category: 'Maths', rating: 8, notes: 'Doing well', recordDate: '2026-09-30',
    })

    expect(result.observation_id).toBe(1)
  })

  it('blocks a non-teacher user', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue(null)
    await expect(
      service.addObservation({ userId: 1, learnerId: 3, category: 'Maths', rating: 8, recordDate: '2026-09-30' }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('rejects a learner that does not exist', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
    deps.learnerRepository.findById.mockResolvedValue(null)
    await expect(
      service.addObservation({ userId: 1, learnerId: 999, category: 'Maths', rating: 8, recordDate: '2026-09-30' }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('lists a learner\'s observations', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
    deps.learnerRepository.findById.mockResolvedValue({ learner_id: 3 })
    deps.observationRepository.findByLearnerId.mockResolvedValue([{ observation_id: 1 }])

    const result = await service.getLearnerObservations({ userId: 1, learnerId: 3 })
    expect(result).toHaveLength(1)
  })

  it('returns 404 when updating an observation that does not exist', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
    deps.observationRepository.update.mockResolvedValue(null)
    await expect(
      service.updateObservation({ userId: 1, observationId: 999, fields: { rating: 5 } }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('returns 404 when deleting an observation that does not exist', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
    deps.observationRepository.delete.mockResolvedValue(false)
    await expect(
      service.deleteObservation({ userId: 1, observationId: 999 }),
    ).rejects.toMatchObject({ status: 404 })
  })
})
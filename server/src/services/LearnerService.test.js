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

describe('LearnerService.getLearnerOverview (staff learner profile)', () => {
  let deps
  let service

  beforeEach(() => {
    deps = {
      learnerRepository: { findById: jest.fn().mockResolvedValue({ learner_id: 3, can_walk_home_alone: false }) },
      managerRepository: { findByUserId: jest.fn().mockResolvedValue(null) },
      teacherRepository: { findByUserId: jest.fn().mockResolvedValue({ teacher_id: 7 }) },
      attendanceRepository: {
        findByLearnerSince: jest.fn().mockResolvedValue([
          { record_date: '2026-10-29', status: 'present', time_in: '14:05:00' },
          { record_date: '2026-10-28', status: 'absent', time_in: null },
          { record_date: '2026-10-27', status: 'present', time_in: '14:10:00' },
          { record_date: '2026-10-26', status: 'present', time_in: '14:00:00' },
        ]),
      },
      signOutRepository: {
        findByLearnerSince: jest.fn().mockResolvedValue([
          { record_date: '2026-10-29', time_out: '16:42:10', guardian_name: 'Fatima Petersen' },
          { record_date: '2026-10-27', time_out: '16:00:00', guardian_name: null },
        ]),
      },
      pickupPermissionRepository: {
        findActiveByLearnerIds: jest.fn().mockResolvedValue([
          { learner_id: 3, guardian_id: 1, full_name: 'Fatima Petersen', relationship: 'Mother', is_primary_contact: true },
        ]),
      },
      observationRepository: {
        findByLearnerIdWithTeacher: jest.fn().mockResolvedValue([
          { observation_id: 9, record_date: '2026-10-20', category: 'Social', rating: 8, notes: 'Kind to others', teacher_name: 'Thandeka Nkosi' },
        ]),
      },
    }
    service = new LearnerService(deps)
  })

  it("returns the learner's real attendance, recent days, pickups and observations", async () => {
    const result = await service.getLearnerOverview({ userId: 1, learnerId: 3, today: '2026-10-29' })

    // The last 30 days, counting today.
    expect(deps.attendanceRepository.findByLearnerSince).toHaveBeenCalledWith(3, '2026-09-30')
    expect(result.attendance).toEqual({ periodDays: 30, presentDays: 3, markedDays: 4, percent: 75 })
    expect(result.recent[0]).toEqual({
      date: '2026-10-29', status: 'present', timeIn: '14:05',
      signedOut: { timeOut: '16:42', collectedBy: 'Fatima Petersen' },
    })
    expect(result.recent[1]).toMatchObject({ date: '2026-10-28', status: 'absent', signedOut: null })
    expect(result.recent[2].signedOut).toEqual({ timeOut: '16:00', collectedBy: 'Walked home alone' })
    expect(result.pickups).toEqual([{ guardianId: 1, fullName: 'Fatima Petersen', relationship: 'Mother', isPrimaryContact: true }])
    expect(result.observations).toEqual([
      { observationId: 9, date: '2026-10-20', category: 'Social', rating: 8, notes: 'Kind to others', teacherName: 'Thandeka Nkosi' },
    ])
  })

  it('gives a null percentage (not 0%) when nothing has been marked yet', async () => {
    deps.attendanceRepository.findByLearnerSince.mockResolvedValue([])
    deps.signOutRepository.findByLearnerSince.mockResolvedValue([])
    const result = await service.getLearnerOverview({ userId: 1, learnerId: 3, today: '2026-10-29' })
    expect(result.attendance.percent).toBeNull()
    expect(result.recent).toEqual([])
  })

  it('is for teachers and managers only', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue(null)
    await expect(service.getLearnerOverview({ userId: 1, learnerId: 3, today: '2026-10-29' }))
      .rejects.toMatchObject({ status: 403 })
    expect(deps.attendanceRepository.findByLearnerSince).not.toHaveBeenCalled()
  })

  it('returns 404 for a learner that does not exist', async () => {
    deps.learnerRepository.findById.mockResolvedValue(null)
    await expect(service.getLearnerOverview({ userId: 1, learnerId: 99, today: '2026-10-29' }))
      .rejects.toMatchObject({ status: 404 })
  })
})
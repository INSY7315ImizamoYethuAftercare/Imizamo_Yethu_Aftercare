import { jest } from '@jest/globals'
import { SchoolClassService } from './SchoolClassService.js'

describe('SchoolClassService', () => {
  let deps
  let service

  beforeEach(() => {
    deps = {
      schoolClassRepository: { findById: jest.fn(), findAll: jest.fn(), create: jest.fn(), update: jest.fn(), setActive: jest.fn() },
      managerRepository: { findByUserId: jest.fn() },
      teacherRepository: { findByUserId: jest.fn(), findById: jest.fn() },
      learnerRepository: { findByClassId: jest.fn(), countActiveByClassId: jest.fn() },
    }
    service = new SchoolClassService(deps)
  })

  it('allows a teacher (not just a manager) to view a class', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
    deps.managerRepository.findByUserId.mockResolvedValue(null)
    deps.schoolClassRepository.findById.mockResolvedValue({ class_id: 5 })

    const result = await service.getClass({ userId: 1, classId: 5 })
    expect(result.class_id).toBe(5)
  })

  it('blocks a user who is neither teacher nor manager', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue(null)
    deps.managerRepository.findByUserId.mockResolvedValue(null)
    await expect(service.getClass({ userId: 1, classId: 5 })).rejects.toMatchObject({ status: 403 })
  })

  it('rejects creating a class with an assigned teacher that does not exist', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    deps.teacherRepository.findById.mockResolvedValue(null)
    await expect(
      service.createClass({ userId: 1, teacherId: 999, className: 'Blue Group', gradeRange: 'Grade R' }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('returns 409 when creating a class with a name already in use', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    const dbError = new Error('duplicate key'); dbError.code = '23505'
    deps.schoolClassRepository.create.mockRejectedValue(dbError)
    await expect(
      service.createClass({ userId: 1, className: 'Blue Group', gradeRange: 'Grade R' }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('blocks deactivating a class that still has active learners', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    deps.schoolClassRepository.findById.mockResolvedValue({ class_id: 5 })
    deps.learnerRepository.countActiveByClassId.mockResolvedValue(3)

    await expect(service.deactivateClass({ userId: 1, classId: 5 })).rejects.toMatchObject({ status: 409 })
  })

  it('allows deactivating a class with no active learners', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    deps.schoolClassRepository.findById.mockResolvedValue({ class_id: 5 })
    deps.learnerRepository.countActiveByClassId.mockResolvedValue(0)
    deps.schoolClassRepository.setActive.mockResolvedValue({ class_id: 5, is_active: false })

    const result = await service.deactivateClass({ userId: 1, classId: 5 })
    expect(result.is_active).toBe(false)
  })

  it('returns 409 when reactivating a class whose name conflicts with another active class', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    const dbError = new Error('duplicate key'); dbError.code = '23505'
    deps.schoolClassRepository.setActive.mockRejectedValue(dbError)
    await expect(service.activateClass({ userId: 1, classId: 5 })).rejects.toMatchObject({ status: 409 })
  })
})
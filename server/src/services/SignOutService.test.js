import { jest } from '@jest/globals'
import { SignOutService } from './SignOutService.js'

describe('SignOutService', () => {
  let deps
  let service

  beforeEach(() => {
    deps = {
      signOutRepository: { create: jest.fn(), findByLearnerAndDate: jest.fn().mockResolvedValue(null) },
      pickupPermissionRepository: { verifyGuardian: jest.fn() },
      teacherRepository: { findByUserId: jest.fn().mockResolvedValue({ teacher_id: 7 }) },
      managerRepository: { findByUserId: jest.fn().mockResolvedValue({ manager_id: 4 }) },
      learnerRepository: { findById: jest.fn().mockResolvedValue({ learner_id: 3, can_walk_home_alone: false }) },
      attendanceRepository: { findByLearnerAndDate: jest.fn().mockResolvedValue({ record_id: 1, status: 'present' }) },
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

  it.each([
    ['not marked at all', null, /not been marked present/],
    ['marked absent', { record_id: 1, status: 'absent' }, /marked absent/],
  ])('blocks a sign-out for a learner %s today (409)', async (_label, attendance, message) => {
    deps.pickupPermissionRepository.verifyGuardian.mockResolvedValue(true)
    deps.attendanceRepository.findByLearnerAndDate.mockResolvedValue(attendance)
    await expect(
      service.confirmSignOut({ userId: 1, learnerId: 3, guardianId: 9, timeOut: '16:00:00', recordDate: '2026-09-21' }),
    ).rejects.toMatchObject({ status: 409, message: expect.stringMatching(message) })
    expect(deps.attendanceRepository.findByLearnerAndDate).toHaveBeenCalledWith(3, '2026-09-21')
    expect(deps.signOutRepository.create).not.toHaveBeenCalled()
  })

  it('blocks a second sign-out for the same learner on the same day (409)', async () => {
    deps.pickupPermissionRepository.verifyGuardian.mockResolvedValue(true)
    deps.signOutRepository.findByLearnerAndDate.mockResolvedValue({ record_id: 55, time_out: '16:05:00' })
    await expect(
      service.confirmSignOut({ userId: 1, learnerId: 3, guardianId: 9, timeOut: '16:30:00', recordDate: '2026-09-21' }),
    ).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/already signed out today at 16:05/) })
    expect(deps.signOutRepository.findByLearnerAndDate).toHaveBeenCalledWith(3, '2026-09-21')
    expect(deps.signOutRepository.create).not.toHaveBeenCalled()
  })

  it('records a manager as the person who signed the learner out', async () => {
    deps.pickupPermissionRepository.verifyGuardian.mockResolvedValue(true)
    deps.signOutRepository.create.mockResolvedValue({ record_id: 56 })
    await service.confirmSignOut({
      userId: 2, role: 'manager', learnerId: 3, guardianId: 9, timeOut: '16:00:00', recordDate: '2026-09-21',
    })
    expect(deps.managerRepository.findByUserId).toHaveBeenCalledWith(2)
    expect(deps.signOutRepository.create).toHaveBeenCalledWith(expect.objectContaining({ managerId: 4, teacherId: null }))
  })

  it('rejects a manager-role token with no manager profile', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue(null)
    await expect(
      service.confirmSignOut({ userId: 2, role: 'manager', learnerId: 3, guardianId: 9, timeOut: '16:00:00', recordDate: '2026-09-21' }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('signs out a learner walking home alone (guardianId null) only when allowed', async () => {
    deps.signOutRepository.create.mockResolvedValue({ record_id: 57 })
    deps.learnerRepository.findById.mockResolvedValue({ learner_id: 3, can_walk_home_alone: true })
    await service.confirmSignOut({ userId: 1, learnerId: 3, guardianId: null, timeOut: '16:00:00', recordDate: '2026-09-21' })
    expect(deps.signOutRepository.create).toHaveBeenCalledWith(expect.objectContaining({ guardianId: null, teacherId: 7 }))
    expect(deps.pickupPermissionRepository.verifyGuardian).not.toHaveBeenCalled()

    deps.signOutRepository.create.mockClear()
    deps.learnerRepository.findById.mockResolvedValue({ learner_id: 3, can_walk_home_alone: false })
    await expect(
      service.confirmSignOut({ userId: 1, learnerId: 3, guardianId: null, timeOut: '16:00:00', recordDate: '2026-09-21' }),
    ).rejects.toMatchObject({ status: 403 })
    expect(deps.signOutRepository.create).not.toHaveBeenCalled()
  })

  it("builds the day's list: present learners, their pickups and who has gone", async () => {
    deps.attendanceRepository.findPresentByDate = jest.fn().mockResolvedValue([
      { learner_id: 3, first_name: 'Aisha', last_name: 'Petersen', class_name: 'Yellow', grade_range: 'Gr 1-2', can_walk_home_alone: false },
      { learner_id: 5, first_name: 'Bongani', last_name: 'Khumalo', class_name: 'Blue', grade_range: 'Gr 7', can_walk_home_alone: true },
    ])
    deps.pickupPermissionRepository.findActiveByLearnerIds = jest.fn().mockResolvedValue([
      { learner_id: 3, guardian_id: 9, full_name: 'Fatima Petersen', relationship: 'Mother', is_primary_contact: true },
    ])
    deps.signOutRepository.findByDate = jest.fn().mockResolvedValue([
      { learner_id: 5, guardian_id: null, guardian_name: null, time_out: '16:10:00', recorded_by_name: 'Ms Nkosi' },
    ])
    const day = await service.getDay({ userId: 1, date: '2026-09-21' })
    expect(deps.pickupPermissionRepository.findActiveByLearnerIds).toHaveBeenCalledWith([3, 5])
    expect(day).toEqual({
      date: '2026-09-21',
      learners: [
        {
          learnerId: 3, name: 'Aisha Petersen', className: 'Yellow', gradeRange: 'Gr 1-2', canWalkHomeAlone: false,
          pickups: [{ guardianId: 9, fullName: 'Fatima Petersen', relationship: 'Mother', isPrimaryContact: true }],
          signedOut: null,
        },
        {
          learnerId: 5, name: 'Bongani Khumalo', className: 'Blue', gradeRange: 'Gr 7', canWalkHomeAlone: true,
          pickups: [], signedOut: { timeOut: '16:10', collectedBy: 'Walked home alone', recordedBy: 'Ms Nkosi' },
        },
      ],
    })
  })

  it('rejects a non-teacher user', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue(null)
    await expect(
      service.verifyGuardian({ userId: 99, learnerId: 3, guardianId: 9 }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
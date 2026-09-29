// server/src/services/AttendanceService.test.js
import { jest } from '@jest/globals'
import { AttendanceService } from './AttendanceService.js'

describe('AttendanceService', () => {
  let deps
  let service

  beforeEach(() => {
    deps = {
      attendanceRepository: { markPresent: jest.fn(), markAbsent: jest.fn(), findByClassAndDate: jest.fn() },
      schoolClassRepository: { findById: jest.fn() },
      teacherRepository: { findByUserId: jest.fn() },
    }
    service = new AttendanceService(deps)
  })

it('allows a teacher to mark attendance for a class they do not own', async () => {
    deps.schoolClassRepository.findById.mockResolvedValue({ class_id: 5, teacher_id: 99 })

    await service.recordAttendance({
      userId: 1, classId: 5, learnerId: 3, status: 'present', recordDate: '2026-09-21',
    })
    expect(deps.attendanceRepository.markPresent).toHaveBeenCalled()
  })

  it('blocks a teacher from marking attendance for another class', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
    deps.schoolClassRepository.findById.mockResolvedValue({ class_id: 5, teacher_id: 99 })

    await expect(
      service.recordAttendance({ userId: 1, classId: 5, learnerId: 3, status: 'present', recordDate: '2026-09-21' }),
    ).rejects.toMatchObject({ status: 403 })
    expect(deps.attendanceRepository.markPresent).not.toHaveBeenCalled()
  })

  it('blocks a non-teacher user', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue(null)
    await expect(
      service.recordAttendance({ userId: 1, classId: 5, learnerId: 3, status: 'present', recordDate: '2026-09-21' }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
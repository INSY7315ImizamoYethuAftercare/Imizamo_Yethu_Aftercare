import { jest } from '@jest/globals'
import { AttendanceService } from './AttendanceService.js'

describe('AttendanceService', () => {
  let deps
  let service

  beforeEach(() => {
    deps = {
      attendanceRepository: { markPresent: jest.fn(), markAbsent: jest.fn(), findByClassAndDate: jest.fn() },
      teacherRepository: { findByUserId: jest.fn() },
    }
    service = new AttendanceService(deps)
  })

  it('allows a teacher to mark attendance for any class', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
    deps.attendanceRepository.markPresent.mockResolvedValue({ record_id: 1 })

    const record = await service.recordAttendance({
      userId: 1, learnerId: 3, status: 'present', timeIn: '08:00', recordDate: '2026-09-29',
    })

    expect(record.record_id).toBe(1)
    expect(deps.attendanceRepository.markPresent).toHaveBeenCalledWith(
      expect.objectContaining({ learnerId: 3, teacherId: 7 }),
    )
  })

  it('rejects an unrecognised status', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
    await expect(
      service.recordAttendance({ userId: 1, learnerId: 3, status: 'late', recordDate: '2026-09-29' }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('blocks a non-teacher user', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue(null)
    await expect(
      service.recordAttendance({ userId: 1, learnerId: 3, status: 'present', recordDate: '2026-09-29' }),
    ).rejects.toMatchObject({ status: 403 })
    expect(deps.attendanceRepository.markPresent).not.toHaveBeenCalled()
  })

  it('retrieves attendance for any class', async () => {
    deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
    deps.attendanceRepository.findByClassAndDate.mockResolvedValue([{ record_id: 1 }])

    const records = await service.getClassAttendance({ userId: 1, classId: 5, date: '2026-09-29' })

    expect(records).toHaveLength(1)
    expect(deps.attendanceRepository.findByClassAndDate).toHaveBeenCalledWith(5, '2026-09-29')
  })
})
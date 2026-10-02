import { jest } from '@jest/globals'
import { AttendanceService } from './AttendanceService.js'

describe('AttendanceService', () => {
  let deps
  let service

  beforeEach(() => {
    deps = {
      attendanceRepository: { markPresent: jest.fn(), markAbsent: jest.fn(), findByClassAndDate: jest.fn(), findById: jest.fn(), updateStatus: jest.fn() },
      schoolClassRepository: { findById: jest.fn() },
      teacherRepository: { findByUserId: jest.fn() },
      learnerRepository: { findById: jest.fn() },
    }
    service = new AttendanceService(deps)
  })

  describe('recordAttendance', () => {
    it('records a present learner when class and learner both check out', async () => {
      deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
      deps.schoolClassRepository.findById.mockResolvedValue({ class_id: 5 })
      deps.learnerRepository.findById.mockResolvedValue({ learner_id: 3, class_id: 5 })
      deps.attendanceRepository.markPresent.mockResolvedValue({ record_id: 1 })

      const record = await service.recordAttendance({
        userId: 1, classId: 5, learnerId: 3, status: 'present', recordDate: '2026-09-30',
      })

      expect(record.record_id).toBe(1)
    })

    it('rejects a non-teacher user', async () => {
      deps.teacherRepository.findByUserId.mockResolvedValue(null)
      await expect(
        service.recordAttendance({ userId: 1, classId: 5, learnerId: 3, status: 'present', recordDate: '2026-09-30' }),
      ).rejects.toMatchObject({ status: 403 })
    })

    it('rejects a class that does not exist', async () => {
      deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
      deps.schoolClassRepository.findById.mockResolvedValue(null)
      await expect(
        service.recordAttendance({ userId: 1, classId: 999, learnerId: 3, status: 'present', recordDate: '2026-09-30' }),
      ).rejects.toMatchObject({ status: 404 })
    })

    it('rejects a learner who does not belong to the given class', async () => {
      deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
      deps.schoolClassRepository.findById.mockResolvedValue({ class_id: 5 })
      deps.learnerRepository.findById.mockResolvedValue({ learner_id: 3, class_id: 999 })
      await expect(
        service.recordAttendance({ userId: 1, classId: 5, learnerId: 3, status: 'present', recordDate: '2026-09-30' }),
      ).rejects.toMatchObject({ status: 400 })
    })

    it('converts a duplicate-record database error into a 409', async () => {
      deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
      deps.schoolClassRepository.findById.mockResolvedValue({ class_id: 5 })
      deps.learnerRepository.findById.mockResolvedValue({ learner_id: 3, class_id: 5 })
      const dbError = new Error('duplicate key'); dbError.code = '23505'
      deps.attendanceRepository.markPresent.mockRejectedValue(dbError)

      await expect(
        service.recordAttendance({ userId: 1, classId: 5, learnerId: 3, status: 'present', recordDate: '2026-09-30' }),
      ).rejects.toMatchObject({ status: 409 })
    })
  })

  describe('updateAttendanceStatus', () => {
    it('updates an existing record', async () => {
      deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
      deps.attendanceRepository.findById.mockResolvedValue({ record_id: 1, time_in: '08:00:00' })
      deps.attendanceRepository.updateStatus.mockResolvedValue({ record_id: 1, status: 'absent' })

      const result = await service.updateAttendanceStatus({ userId: 1, recordId: 1, status: 'absent' })
      expect(result.status).toBe('absent')
    })

    it('rejects a record that does not exist', async () => {
      deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
      deps.attendanceRepository.findById.mockResolvedValue(null)
      await expect(
        service.updateAttendanceStatus({ userId: 1, recordId: 999, status: 'absent' }),
      ).rejects.toMatchObject({ status: 404 })
    })
  })

  describe('getClassAttendance', () => {
    it('retrieves attendance for any class', async () => {
      deps.teacherRepository.findByUserId.mockResolvedValue({ teacher_id: 7 })
      deps.schoolClassRepository.findById.mockResolvedValue({ class_id: 5 })
      deps.attendanceRepository.findByClassAndDate.mockResolvedValue([{ record_id: 1 }])

      const records = await service.getClassAttendance({ userId: 1, classId: 5, date: '2026-09-30' })
      expect(records).toHaveLength(1)
    })
  })
})
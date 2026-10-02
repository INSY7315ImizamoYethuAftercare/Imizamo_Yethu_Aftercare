import { jest } from '@jest/globals'
import { ReportService } from './ReportService.js'

describe('ReportService', () => {
  let deps
  let service

  beforeEach(() => {
    deps = {
      attendanceRepository: { getAggregateByDateRange: jest.fn() },
      observationRepository: { getAggregateByDateRange: jest.fn() },
      managerRepository: { findByUserId: jest.fn() },
      adminRepository: { findByUserId: jest.fn() },
    }
    service = new ReportService(deps)
  })

  it('blocks a user who is neither manager nor admin', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue(null)
    deps.adminRepository.findByUserId.mockResolvedValue(null)
    await expect(
      service.getDonorReportData({ userId: 1, periodStart: '2026-01-01', periodEnd: '2026-01-31' }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('allows an admin (not just a manager) to request a report', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue(null)
    deps.adminRepository.findByUserId.mockResolvedValue({ admin_id: 1 })
    deps.attendanceRepository.getAggregateByDateRange.mockResolvedValue({ total_present: 10, total_absent: 2, unique_learners: 6 })
    deps.observationRepository.getAggregateByDateRange.mockResolvedValue([])

    const result = await service.getDonorReportData({ userId: 1, periodStart: '2026-01-01', periodEnd: '2026-01-31' })
    expect(result.attendance.totalPresent).toBe(10)
  })

  it('rejects a badly formatted date', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    await expect(
      service.getDonorReportData({ userId: 1, periodStart: '01-01-2026', periodEnd: '2026-01-31' }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('rejects a period where the start date is after the end date', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    await expect(
      service.getDonorReportData({ userId: 1, periodStart: '2026-02-01', periodEnd: '2026-01-01' }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('converts numeric-string aggregates from Postgres into real numbers', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    deps.attendanceRepository.getAggregateByDateRange.mockResolvedValue({ total_present: '10', total_absent: '2', unique_learners: '6' })
    deps.observationRepository.getAggregateByDateRange.mockResolvedValue([
      { category: 'Maths', observation_count: '4', average_rating: '7.5' },
    ])

    const result = await service.getDonorReportData({ userId: 1, periodStart: '2026-01-01', periodEnd: '2026-01-31' })

    expect(result.attendance.totalPresent).toBe(10)
    expect(typeof result.attendance.totalPresent).toBe('number')
    expect(result.observationsByCategory[0].averageRating).toBe(7.5)
  })
})
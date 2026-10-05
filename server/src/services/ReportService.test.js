import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { ReportService } from './ReportService.js'

function buildDeps() {
  return {
    attendanceRepository: {
      getAggregateByDateRange: jest.fn(),
      getDailyPresentCounts: jest.fn(),
      getAttendanceByClass: jest.fn(),
      getAttendanceRate: jest.fn(),
      getDaysWithAttendance: jest.fn(),
    },
    observationRepository: {
      getAggregateByDateRange: jest.fn(),
    },
    managerRepository: { findByUserId: jest.fn() },
    adminRepository: { findByUserId: jest.fn() },
    learnerRepository: { findAll: jest.fn() },
    schoolClassRepository: { findAll: jest.fn() },
    teacherRepository: { findAll: jest.fn() },
    signOutRepository: { countByDateRange: jest.fn() },
  }
}

/** Default happy-path mocks for getOverviewData */
function stubOverviewRepos(deps) {
  deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
  deps.adminRepository.findByUserId.mockResolvedValue(null)
  deps.learnerRepository.findAll.mockResolvedValue([
    { learner_id: 1, is_active: true },
    { learner_id: 2, is_active: true },
    { learner_id: 3, is_active: false },
  ])
  deps.schoolClassRepository.findAll.mockResolvedValue([
    { class_id: 1, class_name: 'Yellow', active_learner_count: 2 },
    { class_id: 2, class_name: 'Green', active_learner_count: 1 },
  ])
  deps.teacherRepository.findAll.mockResolvedValue([
    { teacher_id: 1, is_active: true },
    { teacher_id: 2, is_active: false },
  ])
  deps.attendanceRepository.getAggregateByDateRange.mockResolvedValue({
    total_present: '20',
    total_absent: '5',
    unique_learners: '2',
  })
  deps.observationRepository.getAggregateByDateRange.mockResolvedValue([
    { category: 'Academic', observation_count: '3', average_rating: '8.0' },
    { category: 'Social', observation_count: '1', average_rating: '7.0' },
  ])
  deps.attendanceRepository.getDailyPresentCounts.mockResolvedValue([
    { record_date: '2026-03-02', present_count: '4' },
    { record_date: '2026-03-03', present_count: '5' },
  ])
  deps.attendanceRepository.getAttendanceByClass.mockResolvedValue([
    {
      class_name: 'Yellow',
      learner_count: '2',
      present_count: '8',
      total_count: '10',
    },
  ])
  deps.attendanceRepository.getAttendanceRate.mockResolvedValue(80)
  deps.attendanceRepository.getDaysWithAttendance.mockResolvedValue(12)
  deps.signOutRepository.countByDateRange.mockResolvedValue(48)
}

describe('ReportService', () => {
  let deps
  let service

  beforeEach(() => {
    deps = buildDeps()
    service = new ReportService(deps)
  })

  // ── getDonorReportData (existing behaviour) ───────────────────────────

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
    deps.attendanceRepository.getAggregateByDateRange.mockResolvedValue({
      total_present: 10,
      total_absent: 2,
      unique_learners: 6,
    })
    deps.observationRepository.getAggregateByDateRange.mockResolvedValue([])

    const result = await service.getDonorReportData({
      userId: 1,
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
    })
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
    deps.attendanceRepository.getAggregateByDateRange.mockResolvedValue({
      total_present: '10',
      total_absent: '2',
      unique_learners: '6',
    })
    deps.observationRepository.getAggregateByDateRange.mockResolvedValue([
      { category: 'Maths', observation_count: '4', average_rating: '7.5' },
    ])

    const result = await service.getDonorReportData({
      userId: 1,
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
    })

    expect(result.attendance.totalPresent).toBe(10)
    expect(typeof result.attendance.totalPresent).toBe('number')
    expect(result.observationsByCategory[0].averageRating).toBe(7.5)
  })

  // ── getOverviewData (live dashboard) ──────────────────────────────────

  it('getOverviewData blocks non-manager non-admin users', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue(null)
    deps.adminRepository.findByUserId.mockResolvedValue(null)
    await expect(service.getOverviewData({ userId: 9 })).rejects.toMatchObject({ status: 403 })
  })

  it('getOverviewData rejects an inverted explicit period', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    await expect(
      service.getOverviewData({
        userId: 1,
        periodStart: '2026-06-01',
        periodEnd: '2026-01-01',
      }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('getOverviewData returns live totals, weekly days, class rates and trends', async () => {
    stubOverviewRepos(deps)

    const result = await service.getOverviewData({
      userId: 1,
      periodStart: '2026-01-01',
      periodEnd: '2026-03-06', // a Friday so week math is stable
    })

    expect(result.periodStart).toBe('2026-01-01')
    expect(result.periodEnd).toBe('2026-03-06')

    // Active only
    expect(result.totals.activeLearners).toBe(2)
    expect(result.totals.classes).toBe(2)
    expect(result.totals.teachers).toBe(1)
    expect(result.totals.observations).toBe(4) // 3 + 1
    expect(result.totals.avgAttendance).toBe(80)
    expect(result.totals.signOutsThisMonth).toBe(48)
    expect(result.totals.daysDelivered).toBe(12)
    expect(result.totals.uniqueLearnersServed).toBe(2)

    // Mon–Fri of the week containing periodEnd
    expect(result.weeklyDays).toHaveLength(5)
    expect(result.weeklyDays[0]).toMatchObject({ day: 'Mon' })
    expect(result.weeklyDays[4]).toMatchObject({ day: 'Fri' })
    // Present counts merged from getDailyPresentCounts (only some days had data)
    const byDate = Object.fromEntries(result.weeklyDays.map((d) => [d.date, d.value]))
    expect(byDate['2026-03-02']).toBe(4)
    expect(byDate['2026-03-03']).toBe(5)

    // Class rates: Yellow 80%, Green filled in with 0 (no attendance rows)
    const yellow = result.attendanceByClass.find((c) => c.name === 'Yellow')
    expect(yellow).toMatchObject({ rate: 80, learners: 2 })
    expect(result.attendanceByClass.some((c) => c.name === 'Green')).toBe(true)

    expect(result.observationsByCategory).toEqual([
      { category: 'Academic', observationCount: 3, averageRating: 8 },
      { category: 'Social', observationCount: 1, averageRating: 7 },
    ])

    expect(result.classTrends).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Yellow' }),
        expect.objectContaining({ name: 'Green' }),
      ]),
    )

    expect(result.orgTrend).toHaveLength(4)
    expect(result.orgTrend[0]).toMatchObject({ week: 'W1', rate: 80 })

    expect(result.rates).toMatchObject({ thisWeek: 80, lastWeek: 80, period: 80 })
  })

  it('getOverviewData defaults the period when dates are omitted', async () => {
    stubOverviewRepos(deps)

    const result = await service.getOverviewData({ userId: 1 })

    expect(result.periodStart).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.periodEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.periodStart <= result.periodEnd).toBe(true)
    expect(result.totals.activeLearners).toBe(2)
  })

  it('getOverviewData allows an admin', async () => {
    stubOverviewRepos(deps)
    deps.managerRepository.findByUserId.mockResolvedValue(null)
    deps.adminRepository.findByUserId.mockResolvedValue({ admin_id: 1 })

    const result = await service.getOverviewData({
      userId: 3,
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
    })
    expect(result.totals.classes).toBe(2)
  })
})

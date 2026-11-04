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
    attended_learners: '1',
  })
  deps.observationRepository.getAggregateByDateRange.mockResolvedValue([
    { category: 'Academic', observation_count: '3', average_rating: '8.0' },
    { category: 'Social', observation_count: '1', average_rating: '7.0' },
  ])
  deps.attendanceRepository.getDailyPresentCounts.mockResolvedValue([
    { record_date: '2026-03-02', present_count: '4', absent_count: '1' },
    { record_date: '2026-03-03', present_count: '5', absent_count: '0' },
  ])
  deps.attendanceRepository.getAttendanceByClass.mockResolvedValue([
    {
      class_name: 'Yellow',
      learner_count: '2',
      attended_learners: '2',
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
    expect(result.totals.learnersAttended).toBe(1) // 2 had records, only 1 was ever present

    // Mon–Fri of the week containing periodEnd
    expect(result.weeklyDays).toHaveLength(5)
    expect(result.weeklyDays[0]).toMatchObject({ day: 'Mon' })
    expect(result.weeklyDays[4]).toMatchObject({ day: 'Fri' })
    // Present counts merged from getDailyPresentCounts (only some days had data)
    const byDate = Object.fromEntries(result.weeklyDays.map((d) => [d.date, d.value]))
    expect(byDate['2026-03-02']).toBe(4)
    expect(byDate['2026-03-03']).toBe(5)
    // Absences and whether a register was taken, per day
    const days = Object.fromEntries(result.weeklyDays.map((d) => [d.date, d]))
    expect(days['2026-03-02']).toMatchObject({ value: 4, absent: 1, recorded: true })
    expect(days['2026-03-04']).toMatchObject({ value: 0, absent: 0, recorded: false })

    // Class rates: Yellow 80%, Green filled in with no rate (no attendance rows)
    const yellow = result.attendanceByClass.find((c) => c.name === 'Yellow')
    expect(yellow).toMatchObject({ rate: 80, learners: 2 })
    expect(result.attendanceByClass.find((c) => c.name === 'Green')).toMatchObject({ rate: null })

    // Donor report: Green has no register this month, so null rather than 0
    expect(result.classesThisMonth).toEqual([
      { name: 'Yellow', colour: null, activeLearners: 2, attendedLearners: 2 },
      { name: 'Green', colour: null, activeLearners: 1, attendedLearners: null },
    ])

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

    // Only one week has a register in the stub, so the trend is day by day.
    expect(result.orgTrendView).toBe('daily')
    expect(result.orgTrend).toEqual([
      { label: 'Mon 02', rate: 80 },
      { label: 'Tue 03', rate: 100 },
      { label: 'Wed 04', rate: null },
      { label: 'Thu 05', rate: null },
      { label: 'Fri 06', rate: null },
    ])

    expect(result.rates).toMatchObject({ thisWeek: 80, lastWeek: 80, period: 80 })
  })

  describe('organisation trend', () => {
    const overviewWith = (rows, periodStart = '2026-01-01') => {
      stubOverviewRepos(deps)
      deps.attendanceRepository.getDailyPresentCounts.mockResolvedValue(rows)
      return service.getOverviewData({ userId: 1, periodStart, periodEnd: '2026-03-06' })
    }

    it('reads up to the last 8 weeks of attendance', async () => {
      await overviewWith([])
      expect(deps.attendanceRepository.getDailyPresentCounts).toHaveBeenCalledWith('2026-01-12', '2026-03-06')
    })

    it('shows real weeks from the first recorded week, with a gap for an empty week', async () => {
      const result = await overviewWith([
        { record_date: '2026-02-16', present_count: '3', absent_count: '1' },
        { record_date: '2026-03-02', present_count: '4', absent_count: '1' },
        { record_date: '2026-03-03', present_count: '5', absent_count: '0' },
      ])
      expect(result.orgTrendView).toBe('weekly')
      expect(result.orgTrend).toEqual([
        { label: '16 Feb', rate: 75 },
        { label: '23 Feb', rate: null },
        { label: '2 Mar', rate: 90 },
      ])
    })

    it('leaves weekend records out, matching the this-week and last-week rates', async () => {
      const result = await overviewWith([
        { record_date: '2026-02-23', present_count: '1', absent_count: '1' },
        { record_date: '2026-02-28', present_count: '0', absent_count: '8' },
        { record_date: '2026-03-02', present_count: '1', absent_count: '0' },
      ])
      expect(result.orgTrend).toEqual([
        { label: '23 Feb', rate: 50 },
        { label: '2 Mar', rate: 100 },
      ])
    })

    it('starts the day-by-day view at the first day with a register', async () => {
      const result = await overviewWith([{ record_date: '2026-03-04', present_count: '3', absent_count: '1' }])
      expect(result.orgTrendView).toBe('daily')
      expect(result.orgTrend).toEqual([
        { label: 'Wed 04', rate: 75 },
        { label: 'Thu 05', rate: null },
        { label: 'Fri 06', rate: null },
      ])
    })

    it('looks back 8 weeks from the end of a chosen month, past the start of the month', async () => {
      const result = await overviewWith(
        [
          { record_date: '2026-02-23', present_count: '1', absent_count: '1' },
          { record_date: '2026-03-05', present_count: '1', absent_count: '0' },
        ],
        '2026-03-01',
      )
      expect(deps.attendanceRepository.getDailyPresentCounts).toHaveBeenCalledWith('2026-01-12', '2026-03-06')
      expect(result.orgTrend).toEqual([
        { label: '23 Feb', rate: 50 },
        { label: '2 Mar', rate: 100 },
      ])
    })

    it('leaves out the days after a past month that ends mid-week', async () => {
      stubOverviewRepos(deps)
      const result = await service.getOverviewData({ userId: 1, periodStart: '2026-08-01', periodEnd: '2026-08-31' }) // a Monday
      expect(deps.attendanceRepository.getAttendanceRate).toHaveBeenCalledWith('2026-08-31', '2026-08-31')
      expect(result.weeklyDays.map((d) => d.date)).toEqual(['2026-08-31'])
    })

    it('is empty when nothing was recorded', async () => {
      const result = await overviewWith([])
      expect(result.orgTrendView).toBe('weekly')
      expect(result.orgTrend).toEqual([])
    })
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

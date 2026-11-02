import { todayInSA } from './AttendanceService.js'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function toYmd(date) {
  return date.toISOString().slice(0, 10)
}

/** Monday of the week containing `date` (local calendar via UTC date parts). */
function startOfWeekMonday(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d
}

function addDays(date, days) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

export class ReportService {
  constructor({
    attendanceRepository,
    observationRepository,
    managerRepository,
    adminRepository,
    learnerRepository,
    schoolClassRepository,
    teacherRepository,
    signOutRepository,
  }) {
    this.attendanceRepository = attendanceRepository
    this.observationRepository = observationRepository
    this.managerRepository = managerRepository
    this.adminRepository = adminRepository
    this.learnerRepository = learnerRepository
    this.schoolClassRepository = schoolClassRepository
    this.teacherRepository = teacherRepository
    this.signOutRepository = signOutRepository
  }

  async #assertIsManagerOrAdmin(userId) {
    const manager = await this.managerRepository.findByUserId(userId)
    const admin = await this.adminRepository.findByUserId(userId)
    if (!manager && !admin) {
      throw httpError(403, 'Only managers and admins can access reports')
    }
  }

  #validatePeriod(periodStart, periodEnd) {
    if (!DATE_PATTERN.test(periodStart) || !DATE_PATTERN.test(periodEnd)) {
      throw httpError(400, 'periodStart and periodEnd must be dates in YYYY-MM-DD format')
    }
    if (periodStart > periodEnd) {
      throw httpError(400, 'periodStart must not be after periodEnd')
    }
  }

  /**
   * Aggregates attendance and observation data for a donor-facing report
   * covering the given period. Read-only — does not write to donor_reports.
   */
  async getDonorReportData({ userId, periodStart, periodEnd }) {
    await this.#assertIsManagerOrAdmin(userId)
    this.#validatePeriod(periodStart, periodEnd)

    const attendance = await this.attendanceRepository.getAggregateByDateRange(periodStart, periodEnd)
    const observationsByCategory = await this.observationRepository.getAggregateByDateRange(periodStart, periodEnd)

    return {
      periodStart,
      periodEnd,
      attendance: {
        totalPresent: Number(attendance.total_present),
        totalAbsent: Number(attendance.total_absent),
        uniqueLearners: Number(attendance.unique_learners),
      },
      observationsByCategory: observationsByCategory.map((row) => ({
        category: row.category,
        observationCount: Number(row.observation_count),
        averageRating: row.average_rating === null ? null : Number(row.average_rating),
      })),
    }
  }

  /**
   * Full dashboard payload for the Reports page (overview, trends, donor, board).
   * If periodStart/periodEnd are omitted, uses the last ~90 days ending today (UTC).
   */
  async getOverviewData({ userId, periodStart, periodEnd }) {
    await this.#assertIsManagerOrAdmin(userId)

    // "Today" is the South African date, the same one attendance is recorded
    // under, so the week doesn't flip two hours early.
    const end = periodEnd && DATE_PATTERN.test(periodEnd) ? periodEnd : todayInSA()
    const start =
      periodStart && DATE_PATTERN.test(periodStart)
        ? periodStart
        : toYmd(addDays(new Date(`${end}T00:00:00Z`), -89))

    this.#validatePeriod(start, end)

    const weekStart = startOfWeekMonday(new Date(`${end}T00:00:00Z`))
    const thisWeekStart = toYmd(weekStart)
    const thisWeekEnd = toYmd(addDays(weekStart, 4)) // Mon–Fri
    const lastWeekStart = toYmd(addDays(weekStart, -7))
    const lastWeekEnd = toYmd(addDays(weekStart, -3))

    const monthStart = end.slice(0, 8) + '01'

    const [
      learners,
      classes,
      teachers,
      attendancePeriod,
      observationsByCategory,
      dailyPresent,
      byClassThisPeriod,
      rateThisWeek,
      rateLastWeek,
      byClassThisWeek,
      byClassLastWeek,
      signOutsThisMonth,
      daysDelivered,
      ratePeriod,
      signedOutToday,
    ] = await Promise.all([
      this.learnerRepository.findAll(),
      this.schoolClassRepository.findAll({ includeInactive: false }),
      this.teacherRepository.findAll(),
      this.attendanceRepository.getAggregateByDateRange(start, end),
      this.observationRepository.getAggregateByDateRange(start, end),
      this.attendanceRepository.getDailyPresentCounts(thisWeekStart, thisWeekEnd),
      this.attendanceRepository.getAttendanceByClass(start, end),
      this.attendanceRepository.getAttendanceRate(thisWeekStart, thisWeekEnd),
      this.attendanceRepository.getAttendanceRate(lastWeekStart, lastWeekEnd),
      this.attendanceRepository.getAttendanceByClass(thisWeekStart, thisWeekEnd),
      this.attendanceRepository.getAttendanceByClass(lastWeekStart, lastWeekEnd),
      this.signOutRepository.countByDateRange(monthStart, end),
      this.attendanceRepository.getDaysWithAttendance(start, end),
      this.attendanceRepository.getAttendanceRate(start, end),
      this.signOutRepository.countByDateRange(todayInSA(), todayInSA()),
    ])

    const activeLearners = learners.filter((l) => l.is_active)
    const activeTeachers = teachers.filter((t) => t.is_active !== false)
    const observationTotal = observationsByCategory.reduce(
      (sum, row) => sum + Number(row.observation_count),
      0,
    )

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dailyMap = new Map(
      dailyPresent.map((r) => [
        String(r.record_date).slice(0, 10),
        { present: Number(r.present_count), absent: Number(r.absent_count ?? 0) },
      ]),
    )
    const weeklyDays = []
    for (let i = 0; i < 5; i++) {
      const d = addDays(weekStart, i)
      const ymd = toYmd(d)
      const label = `${dayNames[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, '0')}`
      const counts = dailyMap.get(ymd)
      weeklyDays.push({
        label,
        day: dayNames[d.getUTCDay()],
        date: ymd,
        value: counts?.present ?? 0, // present
        absent: counts?.absent ?? 0,
        recorded: counts !== undefined, // false when nobody took a register that day
      })
    }

    const rateFor = (rows, className) => {
      const row = rows.find((r) => r.class_name === className)
      if (!row || Number(row.total_count) === 0) return null
      return Math.round((Number(row.present_count) / Number(row.total_count)) * 100)
    }

    // A class's saved colour (null for the original five, which take the
    // colour of their name), so every page draws a class the same way.
    const colourOf = (name) => classes.find((c) => c.class_name === name)?.colour ?? null

    const attendanceByClass = byClassThisPeriod.map((row) => {
      const total = Number(row.total_count)
      const present = Number(row.present_count)
      return {
        name: row.class_name,
        colour: colourOf(row.class_name),
        learners: Number(row.learner_count),
        // null (not 0) when nothing was recorded, so the page can say "no data".
        rate: total === 0 ? null : Math.round((present / total) * 100),
      }
    })

    // Include active classes that had no attendance rows yet
    for (const c of classes) {
      if (!attendanceByClass.some((r) => r.name === c.class_name)) {
        attendanceByClass.push({ name: c.class_name, colour: c.colour ?? null, learners: Number(c.active_learner_count) || 0, rate: null })
      }
    }

    const classTrends = classes.map((c) => ({
      name: c.class_name,
      colour: c.colour ?? null,
      thisWeek: rateFor(byClassThisWeek, c.class_name),
      lastWeek: rateFor(byClassLastWeek, c.class_name),
    }))

    // Simple 4-bucket trend: split the period into 4 equal windows
    const startDate = new Date(`${start}T00:00:00Z`)
    const endDate = new Date(`${end}T00:00:00Z`)
    const spanMs = Math.max(1, endDate - startDate)
    const orgTrend = []
    for (let i = 0; i < 4; i++) {
      const wStart = toYmd(new Date(startDate.getTime() + (spanMs * i) / 4))
      const wEnd = toYmd(new Date(startDate.getTime() + (spanMs * (i + 1)) / 4))
      // eslint-disable-next-line no-await-in-loop
      const rate = await this.attendanceRepository.getAttendanceRate(wStart, wEnd)
      orgTrend.push({ week: `W${i + 1}`, rate })
    }

    // null when no attendance was recorded in the period.
    const avgAttendance = ratePeriod

    return {
      periodStart: start,
      periodEnd: end,
      thisWeekStart,
      thisWeekEnd,
      monthStart,
      totals: {
        activeLearners: activeLearners.length,
        classes: classes.length,
        teachers: activeTeachers.length,
        observations: observationTotal,
        avgAttendance,
        signOutsThisMonth,
        daysDelivered,
        uniqueLearnersServed: Number(attendancePeriod.unique_learners),
        // Learners marked present on at least one day in the period.
        learnersAttended: Number(attendancePeriod.attended_learners ?? 0),
        // Attendance records in the period, for the present/absent split.
        presentRecords: Number(attendancePeriod.total_present),
        absentRecords: Number(attendancePeriod.total_absent),
      },
      weeklyDays,
      attendanceByClass,
      observationsByCategory: observationsByCategory.map((row) => ({
        category: row.category,
        observationCount: Number(row.observation_count),
        averageRating: row.average_rating === null ? null : Number(row.average_rating),
      })),
      classTrends,
      orgTrend,
      // Today's numbers (South African date), per class and in total. Counts
      // only, no learner names, so admins can see them too (POPIA).
      today: {
        date: todayInSA(),
        present: classes.reduce((sum, c) => sum + Number(c.present_today), 0),
        activeLearners: activeLearners.length,
        signedOut: Number(signedOutToday) || 0,
        classes: classes.map((c) => ({
          name: c.class_name,
          colour: c.colour ?? null,
          present: Number(c.present_today),
          activeLearners: Number(c.active_learner_count),
        })),
      },
      rates: {
        thisWeek: rateThisWeek,
        lastWeek: rateLastWeek,
        period: ratePeriod,
      },
    }
  }
}

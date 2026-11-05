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

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const TREND_WEEKS = 8

/**
 * The organisation attendance trend: one point per Monday-Friday week, starting
 * at the first week with a register. With fewer than two such weeks there is no
 * line to draw, so it shows that week day by day instead. A week or day with no
 * register has a null rate (a gap), never 0%.
 * @returns {{ view: 'weekly'|'daily', points: Array<{ label: string, rate: number|null }> }}
 */
function buildOrgTrend(rows, start, end, lastMonday) {
  const counts = new Map(
    rows.map((r) => [
      String(r.record_date).slice(0, 10),
      { present: Number(r.present_count), absent: Number(r.absent_count ?? 0) },
    ]),
  )
  const rateFor = (days) => {
    let present = 0
    let absent = 0
    for (const day of days) {
      const c = counts.get(toYmd(day))
      present += c?.present ?? 0
      absent += c?.absent ?? 0
    }
    const total = present + absent
    return total === 0 ? null : Math.round((present / total) * 100)
  }
  const withoutLeadingGaps = (points) => points.slice(points.findIndex((p) => p.rate !== null))

  const weeks = []
  for (let i = TREND_WEEKS - 1; i >= 0; i--) {
    const monday = addDays(lastMonday, -7 * i)
    const days = [0, 1, 2, 3, 4]
      .map((n) => addDays(monday, n))
      .filter((d) => toYmd(d) >= start && toYmd(d) <= end)
    if (days.length > 0) weeks.push({ monday, days, rate: rateFor(days) })
  }

  const recorded = weeks.filter((w) => w.rate !== null)
  if (recorded.length === 0) return { view: 'weekly', points: [] }
  if (recorded.length === 1) {
    const points = recorded[0].days.map((d) => ({
      label: `${DAY_NAMES[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, '0')}`,
      rate: rateFor([d]),
    }))
    return { view: 'daily', points: withoutLeadingGaps(points) }
  }
  const points = weeks.map((w) => ({
    label: `${w.monday.getUTCDate()} ${MONTH_NAMES[w.monday.getUTCMonth()]}`,
    rate: w.rate,
  }))
  return { view: 'weekly', points: withoutLeadingGaps(points) }
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
    const friday = toYmd(addDays(weekStart, 4)) // Mon–Fri
    // A chosen month can end mid-week: don't count the next month's days.
    const thisWeekEnd = friday < end ? friday : end
    const lastWeekStart = toYmd(addDays(weekStart, -7))
    const lastWeekEnd = toYmd(addDays(weekStart, -3))

    const monthStart = end.slice(0, 8) + '01'

    // The trend looks back from the end of the period, even past its start, so
    // choosing a single month still has earlier weeks to compare it with.
    const trendStart = toYmd(addDays(weekStart, -7 * (TREND_WEEKS - 1)))

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
      trendDays,
      byClassThisMonth,
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
      this.attendanceRepository.getDailyPresentCounts(trendStart, end),
      this.attendanceRepository.getAttendanceByClass(monthStart, end),
    ])

    const activeLearners = learners.filter((l) => l.is_active)
    const activeTeachers = teachers.filter((t) => t.is_active !== false)
    const observationTotal = observationsByCategory.reduce(
      (sum, row) => sum + Number(row.observation_count),
      0,
    )

    const dailyMap = new Map(
      dailyPresent.map((r) => [
        String(r.record_date).slice(0, 10),
        { present: Number(r.present_count), absent: Number(r.absent_count ?? 0) },
      ]),
    )
    // This week shows all five days; a past month stops where the month ends.
    const isPastPeriod = end < todayInSA()
    const weeklyDays = []
    for (let i = 0; i < 5; i++) {
      const d = addDays(weekStart, i)
      const ymd = toYmd(d)
      if (isPastPeriod && ymd > end) break
      const label = `${DAY_NAMES[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, '0')}`
      const counts = dailyMap.get(ymd)
      weeklyDays.push({
        label,
        day: DAY_NAMES[d.getUTCDay()],
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

    // Donor report: each class's active learners and how many of them came this
    // month. attendedLearners is null (not 0) when the class has no register
    // this month, so the page can show that nothing was recorded.
    const classesThisMonth = classes.map((c) => {
      const row = byClassThisMonth.find((r) => r.class_name === c.class_name)
      return {
        name: c.class_name,
        colour: c.colour ?? null,
        activeLearners: Number(c.active_learner_count) || 0,
        attendedLearners: row ? Number(row.attended_learners ?? 0) : null,
      }
    })

    const orgTrend = buildOrgTrend(trendDays, trendStart, end, weekStart)

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
      classesThisMonth,
      orgTrend: orgTrend.points,
      orgTrendView: orgTrend.view,
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

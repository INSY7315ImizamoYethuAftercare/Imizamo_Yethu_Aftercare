
function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export class ReportService {
  constructor({ attendanceRepository, observationRepository, managerRepository, adminRepository }) {
    this.attendanceRepository = attendanceRepository
    this.observationRepository = observationRepository
    this.managerRepository = managerRepository
    this.adminRepository = adminRepository
  }

  async #assertIsManagerOrAdmin(userId) {
    const manager = await this.managerRepository.findByUserId(userId)
    const admin = await this.adminRepository.findByUserId(userId)
    if (!manager && !admin) {
      throw httpError(403, 'Only managers and admins can access reports')
    }
  }

  /**
   * Aggregates attendance and observation data for a donor-facing report
   * covering the given period. Read-only — does not write to donor_reports.
   *
   * @param {Object} params
   * @param {number} params.userId
   * @param {string} params.periodStart - YYYY-MM-DD
   * @param {string} params.periodEnd - YYYY-MM-DD
   * @returns {Promise<Object>} Combined attendance + observation aggregates.
   */
  async getDonorReportData({ userId, periodStart, periodEnd }) {
    await this.#assertIsManagerOrAdmin(userId)

    if (!DATE_PATTERN.test(periodStart) || !DATE_PATTERN.test(periodEnd)) {
      throw httpError(400, 'periodStart and periodEnd must be dates in YYYY-MM-DD format')
    }
    if (periodStart > periodEnd) {
      throw httpError(400, 'periodStart must not be after periodEnd')
    }

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
}
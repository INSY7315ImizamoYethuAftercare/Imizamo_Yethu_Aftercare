import { ReportService } from '../services/ReportService.js'
import AttendanceRepository from '../repositories/AttendanceRepository.js'
import ObservationRepository from '../repositories/ObservationRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import AdminRepository from '../repositories/AdminRepository.js'
import { pool } from '../db/pool.js'

const reportService = new ReportService({
  attendanceRepository: new AttendanceRepository(pool),
  observationRepository: new ObservationRepository(pool),
  managerRepository: new ManagerRepository(pool),
  adminRepository: new AdminRepository(pool),
})

export async function getDonorReport(req, res, next) {
  try {
    const { periodStart, periodEnd } = req.query
    if (!periodStart || !periodEnd) {
      const err = new Error('periodStart and periodEnd query parameters are required')
      err.status = 400
      throw err
    }
    const report = await reportService.getDonorReportData({
      userId: req.user.userId,
      periodStart,
      periodEnd,
    })
    res.json(report)
  } catch (err) {
    next(err)
  }
}
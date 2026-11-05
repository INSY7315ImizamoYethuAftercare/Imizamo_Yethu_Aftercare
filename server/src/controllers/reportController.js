import { ReportService } from '../services/ReportService.js'
import AttendanceRepository from '../repositories/AttendanceRepository.js'
import ObservationRepository from '../repositories/ObservationRepository.js'
import ManagerRepository from '../repositories/ManagerRepository.js'
import AdminRepository from '../repositories/AdminRepository.js'
import LearnerRepository from '../repositories/LearnerRepository.js'
import SchoolClassRepository from '../repositories/SchoolClassRepository.js'
import TeacherRepository from '../repositories/TeacherRepository.js'
import SignOutRepository from '../repositories/SignOutRepository.js'
import { pool } from '../db/pool.js'

const reportService = new ReportService({
  attendanceRepository: new AttendanceRepository(pool),
  observationRepository: new ObservationRepository(pool),
  managerRepository: new ManagerRepository(pool),
  adminRepository: new AdminRepository(pool),
  learnerRepository: new LearnerRepository(pool),
  schoolClassRepository: new SchoolClassRepository(pool),
  teacherRepository: new TeacherRepository(pool),
  signOutRepository: new SignOutRepository(pool),
})

export async function getDonorReport(req, res, next) {
  try {
    const { periodStart, periodEnd } = req.validated.query
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

/**
 * GET /api/reports/overview
 * Optional query: periodStart, periodEnd (YYYY-MM-DD). Defaults to last ~90 days.
 */
export async function getOverview(req, res, next) {
  try {
    const { periodStart, periodEnd } = req.validated.query
    const report = await reportService.getOverviewData({
      userId: req.user.userId,
      periodStart,
      periodEnd,
    })
    res.json(report)
  } catch (err) {
    next(err)
  }
}
import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { getDonorReport, getOverview } from '../controllers/reportController.js'

export const reportRouter = Router()

reportRouter.use(authenticate, authorize('manager', 'admin'))
reportRouter.get('/overview', getOverview)
reportRouter.get('/donor', getDonorReport)
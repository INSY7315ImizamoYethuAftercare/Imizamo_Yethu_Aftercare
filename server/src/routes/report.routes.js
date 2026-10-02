import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { getDonorReport } from '../controllers/reportController.js'

export const reportRouter = Router()

reportRouter.use(authenticate, authorize('manager', 'admin'))
reportRouter.get('/donor', getDonorReport)
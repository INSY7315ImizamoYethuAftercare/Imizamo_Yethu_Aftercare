import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import * as schemas from '../validation/schemas/reportSchemas.js'
import { getDonorReport, getOverview } from '../controllers/reportController.js'

export const reportRouter = Router()

reportRouter.use(authenticate, authorize('manager', 'admin'))
reportRouter.get('/overview', validate(schemas.overviewReport), getOverview)
reportRouter.get('/donor', validate(schemas.donorReport), getDonorReport)
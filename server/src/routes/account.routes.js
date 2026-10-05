// account.routes.js: manager and admin accounts (master admin only).

import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { listAccounts, createAccount } from '../controllers/accountController.js'

export const accountRouter = Router()
accountRouter.use(authenticate, authorize('master_admin'))
accountRouter.get('/', listAccounts)
accountRouter.post('/', createAccount)

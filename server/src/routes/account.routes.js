// account.routes.js: manager and admin accounts, and editing any staff
// account (master admin only).

import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { listAccounts, createAccount, updateAccount, resetPassword } from '../controllers/accountController.js'

export const accountRouter = Router()
accountRouter.use(authenticate, authorize('master_admin'))
accountRouter.get('/', listAccounts)
accountRouter.post('/', createAccount)
accountRouter.patch('/:userId', updateAccount)
accountRouter.post('/:userId/reset-password', resetPassword)

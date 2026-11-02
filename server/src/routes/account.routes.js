// account.routes.js: manager and admin accounts, and editing any staff
// account (master admin only).

import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { createAccount as createAccountSchema, updateAccount as updateAccountSchema, resetPassword as resetPasswordSchema } from '../validation/schemas/accountSchemas.js'
import { listAccounts, createAccount, updateAccount, resetPassword } from '../controllers/accountController.js'

export const accountRouter = Router()
accountRouter.use(authenticate, authorize('master_admin'))
accountRouter.get('/', listAccounts)
accountRouter.post('/', validate(createAccountSchema), createAccount)
accountRouter.patch('/:userId', validate(updateAccountSchema), updateAccount)
accountRouter.post('/:userId/reset-password', validate(resetPasswordSchema), resetPassword)

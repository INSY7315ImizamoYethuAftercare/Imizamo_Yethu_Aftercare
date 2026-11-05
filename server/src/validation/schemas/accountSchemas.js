// Validation for /api/accounts (the master admin's manager and admin accounts).
import { z } from 'zod'
import { LIMITS, body, emailField, idParams, passwordField, textField } from '../fields.js'

export const createAccount = {
  body: body({
    type: textField('type', { max: 20 }),
    fullName: textField('fullName', { max: LIMITS.fullName }),
    email: emailField(),
    password: passwordField(),
  }),
}

export const updateAccount = {
  params: idParams('userId'),
  body: body({
    // Listed first so this is the message when a password is sent along with other changes.
    password: z.undefined({ error: 'Passwords are not changed here: use reset-password' }).optional(),
    fullName: textField('fullName', { max: LIMITS.fullName }).optional(),
    email: emailField().optional(),
  }).refine((values) => values.fullName !== undefined || values.email !== undefined, {
    error: 'At least one of fullName or email is required',
  }),
}

export const resetPassword = {
  params: idParams('userId'),
  body: body({ password: passwordField() }),
}

// Validation for /api/auth.
import { z } from 'zod'
import { LIMITS, body, dateField, emailField, passwordField, signInTextField, textField } from '../fields.js'

export const register = {
  body: body({
    email: emailField(),
    password: passwordField(),
    role: textField('role', { max: 20 }),
    fullName: textField('fullName', { max: LIMITS.fullName }),
    // Guardian-only fields: AuthService decides whether they are required;
    // here we only check that whatever was sent is the right shape.
    contactNumber: textField('contactNumber', { max: LIMITS.contactNumber, required: false }),
    relationship: textField('relationship', { max: LIMITS.relationship, required: false }),
    claimedLearnerName: textField('claimedLearnerName', { max: LIMITS.claimedLearnerName, required: false }),
    claimedLearnerDob: z.preprocess((value) => (value === '' ? undefined : value), dateField('claimedLearnerDob').nullish()),
  }),
}

export const login = {
  body: body({
    // Only the type is checked: no length rules, so older accounts can still sign in.
    email: signInTextField('email'),
    password: signInTextField('password'),
    // Optional: the role card picked on the login screen.
    role: textField('role', { max: 20 }).optional(),
  }),
}

export const changePassword = {
  body: body({
    currentPassword: signInTextField('currentPassword'),
    newPassword: passwordField('newPassword'),
  }),
}

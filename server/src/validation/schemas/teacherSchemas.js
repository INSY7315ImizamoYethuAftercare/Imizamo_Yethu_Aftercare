// Validation for /api/teacher.
import { LIMITS, body, emailField, idParams, passwordField, textField, toColumns } from '../fields.js'

export const teacherParams = { params: idParams('teacherId') }

export const createTeacher = {
  body: body({
    email: emailField(),
    password: passwordField(),
    fullName: textField('fullName', { max: LIMITS.fullName }),
    contactEmail: emailField('contactEmail').optional(),
  }).transform((values) => ({ ...values, contactEmail: values.contactEmail ?? values.email })),
}

export const updateTeacher = {
  params: idParams('teacherId'),
  body: body({
    fullName: textField('fullName', { max: LIMITS.fullName }).optional(),
    contactEmail: emailField('contactEmail').optional(),
  })
    .refine((values) => values.fullName !== undefined || values.contactEmail !== undefined, {
      error: 'At least one of fullName or contactEmail is required',
    })
    .transform((values) => toColumns(values, { fullName: 'full_name', contactEmail: 'contact_email' })),
}

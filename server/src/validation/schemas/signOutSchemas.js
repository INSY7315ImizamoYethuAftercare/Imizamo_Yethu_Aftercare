// Validation for /api/signout.
import { z } from 'zod'
import { LIMITS, body, idField, idParams, textField, timeField } from '../fields.js'

export const verifyGuardian = {
  body: body({
    learnerId: idField('learnerId'),
    guardianId: idField('guardianId'),
  }),
}

export const confirmSignOut = {
  body: body({
    learnerId: idField('learnerId'),
    // Must be sent explicitly: an id, or null for a learner walking home alone.
    guardianId: idField('guardianId').nullable(),
    timeOut: timeField('timeOut'),
  }),
}

export const raiseEscalation = {
  body: body({
    learnerId: idField('learnerId'),
    // Must be sent explicitly: the collector's name, or null for a learner walking home without permission.
    collectorName: textField('collectorName', { max: LIMITS.fullName })
      .transform((value) => value.trim())
      .nullable(),
  }),
}

export const resolveEscalation = {
  params: idParams('escalationId'),
  body: body({
    action: z.enum(['approve', 'dismiss'], { error: "action must be 'approve' or 'dismiss'" }),
  }),
}

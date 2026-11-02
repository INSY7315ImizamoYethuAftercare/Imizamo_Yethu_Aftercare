// Validation for /api/signout.
import { body, idField, timeField } from '../fields.js'

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

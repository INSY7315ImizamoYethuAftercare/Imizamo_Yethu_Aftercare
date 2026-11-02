// Validation for /api/guardian.
import { LIMITS, body, flagField, idParams, textField } from '../fields.js'

export const childParams = { params: idParams('learnerId') }

export const addChildPickup = {
  params: idParams('learnerId'),
  body: body({
    fullName: textField('fullName', { max: LIMITS.fullName }),
    relationship: textField('relationship', { max: LIMITS.relationship }),
    contactNumber: textField('contactNumber', { max: LIMITS.contactNumber }),
    canWalkHomeAlone: flagField(),
  }),
}

export const guardianParams = { params: idParams('guardianId') }

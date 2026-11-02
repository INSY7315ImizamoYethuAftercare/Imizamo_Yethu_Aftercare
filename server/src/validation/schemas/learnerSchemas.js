// Validation for /api/learners.
import {
  LIMITS, body, flagField, idField, idParams, nullableDateField, optionalDateField, optionalFlagField, textField, toColumns,
} from '../fields.js'

export const learnerParams = { params: idParams('learnerId') }

export const createLearner = {
  body: body({
    classId: idField('classId'),
    firstName: textField('firstName', { max: LIMITS.learnerName }),
    lastName: textField('lastName', { max: LIMITS.learnerName }),
    // Optional: learners imported from the Hub list have no date of birth yet.
    dateOfBirth: optionalDateField('dateOfBirth'),
    canWalkHomeAlone: flagField(),
  }),
}

export const updateLearner = {
  params: idParams('learnerId'),
  body: body({
    firstName: textField('firstName', { max: LIMITS.learnerName }).optional(),
    lastName: textField('lastName', { max: LIMITS.learnerName }).optional(),
    // null or '' clears the date of birth.
    dateOfBirth: nullableDateField('dateOfBirth'),
    canWalkHomeAlone: optionalFlagField(),
    classId: idField('classId').optional(),
    isActive: optionalFlagField(),
  }).transform((values) =>
    toColumns(values, {
      firstName: 'first_name',
      lastName: 'last_name',
      dateOfBirth: 'date_of_birth',
      canWalkHomeAlone: 'can_walk_home_alone',
      classId: 'class_id',
      isActive: 'is_active',
    }),
  ),
}

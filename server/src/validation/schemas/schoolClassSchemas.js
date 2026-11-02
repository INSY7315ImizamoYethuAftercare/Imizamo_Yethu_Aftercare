// Validation for /api/classes.
import { z } from 'zod'
import {
  LIMITS, body, colourField, idParams, nullableIdField, optionalFlagField, optionalIdField, textField, toColumns,
} from '../fields.js'

export const classParams = { params: idParams('classId') }

export const listClasses = {
  query: z.object({ includeInactive: optionalFlagField() }),
}

export const createClass = {
  body: body({
    teacherId: optionalIdField('teacherId'),
    className: textField('className', { max: LIMITS.className }),
    gradeRange: textField('gradeRange', { max: LIMITS.gradeRange }),
    colour: colourField(),
  }),
}

export const updateClass = {
  params: idParams('classId'),
  body: body({
    className: textField('className', { max: LIMITS.className }).optional(),
    gradeRange: textField('gradeRange', { max: LIMITS.gradeRange }).optional(),
    // null unassigns the teacher.
    teacherId: nullableIdField('teacherId'),
    // null clears it (the class then uses the colour matching its name).
    colour: colourField(),
  }).transform((values) =>
    toColumns(values, { className: 'class_name', gradeRange: 'grade_range', teacherId: 'teacher_id', colour: 'colour' }),
  ),
}

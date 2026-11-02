// Validation for /api/attendance.
import { z } from 'zod'
import { body, idField, idParams, optionalDateField, optionalIdField, textField, timeField } from '../fields.js'

export const recordAttendance = {
  body: body({
    learnerId: idField('learnerId'),
    classId: optionalIdField('classId'),
    status: textField('status', { max: 10 }),
    timeIn: timeField('timeIn'),
  }),
}

export const updateAttendance = {
  params: idParams('recordId'),
  body: body({
    status: textField('status', { max: 10 }),
    timeIn: timeField('timeIn'),
  }),
}

export const getClassAttendance = {
  params: idParams('classId'),
  query: z.object({ date: optionalDateField('date') }),
}

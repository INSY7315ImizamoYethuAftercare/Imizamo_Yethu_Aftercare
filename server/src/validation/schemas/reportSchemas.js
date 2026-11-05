// Validation for /api/reports.
import { z } from 'zod'
import { dateField, optionalDateField } from '../fields.js'

export const donorReport = {
  query: z
    .object({
      periodStart: dateField('periodStart'),
      periodEnd: dateField('periodEnd'),
    })
    .refine((query) => query.periodStart <= query.periodEnd, { error: 'periodStart must not be after periodEnd' }),
}

// Both dates are optional: without them the report covers roughly the last 90 days.
export const overviewReport = {
  query: z.object({
    periodStart: optionalDateField('periodStart'),
    periodEnd: optionalDateField('periodEnd'),
  }),
}

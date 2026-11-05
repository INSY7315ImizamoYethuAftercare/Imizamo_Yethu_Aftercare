// The Reports month picker's dates, and the wording used for a past month.
import { describe, expect, it } from 'vitest'
import { monthRange, reportMonths } from '../utils/dates'
import { trendsInsight, weekInsight } from '../utils/insights'

describe('reportMonths', () => {
  it('lists months newest first, across a new year', () => {
    const months = reportMonths('2026-02-14', 3)
    expect(months).toEqual([
      { start: '2026-02-01', label: 'February 2026' },
      { start: '2026-01-01', label: 'January 2026' },
      { start: '2025-12-01', label: 'December 2025' },
    ])
  })
})

describe('monthRange', () => {
  it('runs to the last day of a past month, including a leap February', () => {
    expect(monthRange('2028-02-01', '2028-06-10')).toEqual({ start: '2028-02-01', end: '2028-02-29' })
  })

  it('stops at today for the current month', () => {
    expect(monthRange('2026-11-01', '2026-11-04')).toEqual({ start: '2026-11-01', end: '2026-11-04' })
  })
})

describe('insights for a past month', () => {
  const month = 'October 2026'

  it('talks about the final week, in the past tense', () => {
    expect(weekInsight({ thisWeek: 90, lastWeek: 85 }, month).text).toBe('Attendance finished October 2026 up 5 points on the week before, at 90%.')
    expect(weekInsight({ thisWeek: 80, lastWeek: 85 }, month).text).toBe('Attendance finished October 2026 down 5 points on the week before, at 80%.')
    expect(weekInsight({ thisWeek: 85, lastWeek: 85 }, month).text).toBe('Attendance finished October 2026 steady at 85%, the same as the week before.')
    expect(weekInsight({ thisWeek: 85, lastWeek: null }, month).text).toBe('Attendance was 85% in the final week of October 2026, with no earlier week to compare against.')
    expect(weekInsight({ thisWeek: null, lastWeek: null }, month).text).toBe('No attendance was recorded in the final week of October 2026.')
  })

  it('names the strongest and weakest class in the past tense', () => {
    const classes = [{ name: 'Yellow', thisWeek: 95 }, { name: 'Green', thisWeek: 70 }]
    expect(trendsInsight({ thisWeek: 85, lastWeek: 85 }, classes, month).text).toContain('Yellow led at 95%; Green was lowest at 70%.')
  })
})

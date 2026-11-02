import { describe, expect, it } from 'vitest'
import { boardInsight, changeLabel, donorInsight, pointsChange, trendsInsight, weekInsight } from '../utils/insights'

describe('weekInsight', () => {
  it.each([
    [{ thisWeek: 94, lastWeek: 90 }, 'up', 'Attendance is up 4 points on last week, at 94%.'],
    [{ thisWeek: 89, lastWeek: 90 }, 'down', 'Attendance is down 1 point on last week, at 89%.'],
    [{ thisWeek: 90, lastWeek: 90 }, 'flat', 'Attendance is steady at 90%, the same as last week.'],
    [{ thisWeek: 90, lastWeek: null }, 'none', 'Attendance is 90% this week, with no earlier week to compare against.'],
    [{ thisWeek: null, lastWeek: 90 }, 'none', 'No attendance has been recorded this week yet.'],
    [undefined, 'none', 'No attendance has been recorded this week yet.'],
  ])('%j', (rates, tone, text) => {
    expect(weekInsight(rates)).toEqual({ tone, text })
  })
})

describe('trendsInsight', () => {
  it('adds the strongest and weakest class', () => {
    const rows = [{ name: 'Yellow', thisWeek: 97 }, { name: 'Green', thisWeek: 90 }, { name: 'Red', thisWeek: null }]
    expect(trendsInsight({ thisWeek: 94, lastWeek: 90 }, rows).text).toBe(
      'Attendance is up 4 points on last week, at 94%. Yellow leads at 97%; Green is lowest at 90%.',
    )
  })

  it('stays with the week comparison when classes tie or there is only one', () => {
    const base = weekInsight({ thisWeek: 94, lastWeek: 90 })
    expect(trendsInsight({ thisWeek: 94, lastWeek: 90 }, [{ name: 'A', thisWeek: 90 }, { name: 'B', thisWeek: 90 }])).toEqual(base)
    expect(trendsInsight({ thisWeek: 94, lastWeek: 90 }, [{ name: 'A', thisWeek: 90 }])).toEqual(base)
  })
})

describe('change helpers', () => {
  it('works out and labels a change in points', () => {
    expect(pointsChange(94, 90)).toBe(4)
    expect(pointsChange(null, 90)).toBeNull()
    expect([4, -2, 0, null].map(changeLabel)).toEqual(['▲ 4', '▼ 2', '= 0', '–'])
  })
})

describe('donor and board headlines', () => {
  const totals = { activeLearners: 6, uniqueLearnersServed: 5, classes: 4, teachers: 1, daysDelivered: 22, avgAttendance: 92 }
  it('summarises the donor numbers, leaving out the rate when there is none', () => {
    expect(donorInsight(totals).text).toBe('5 learners reached across 22 days of aftercare with 92% average attendance.')
    expect(donorInsight({ ...totals, avgAttendance: null }).text).toBe('5 learners reached across 22 days of aftercare.')
  })
  it('summarises the programme for the board', () => {
    expect(boardInsight(totals).text).toBe('6 active learners across 4 class groups, looked after by 1 active teacher.')
  })
})

// Reports page: loads /reports/overview and renders live stats (not hardcoded samples).
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Reports from '../pages/Reports'
import { exportPagePdf } from '../utils/pdf'
import { monthRange, monthYear, reportMonths, todayInSA } from '../utils/dates'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

// jsdom + recharts is noisy; stub charts so we only assert page data.
vi.mock('../components/WeeklyChart', () => ({
  default: ({ data }) => (
    <div data-testid="weekly-chart">{(data ?? []).map((d) => `${d.present}/${d.absent}`).join(',')}</div>
  ),
}))
vi.mock('../components/TrendChart', () => ({
  default: ({ data }) => (
    <div data-testid="trend-chart">{(data ?? []).map((d) => d.rate).join(',')}</div>
  ),
}))
vi.mock('../utils/pdf', () => ({
  exportPagePdf: vi.fn(),
}))

const OVERVIEW = {
  periodStart: '2026-01-01',
  periodEnd: '2026-03-31',
  totals: {
    activeLearners: 6,
    classes: 4,
    teachers: 3,
    observations: 8,
    avgAttendance: 92,
    signOutsThisMonth: 48,
    daysDelivered: 22,
    uniqueLearnersServed: 6,
    learnersAttended: 5,
    presentRecords: 110,
    absentRecords: 10,
  },
  weeklyDays: [
    { label: 'Mon 02', day: 'Mon', date: '2026-03-02', value: 5, absent: 1, recorded: true },
    { label: 'Tue 03', day: 'Tue', date: '2026-03-03', value: 4, absent: 0, recorded: true },
    { label: 'Wed 04', day: 'Wed', date: '2026-03-04', value: 5, absent: 2, recorded: true },
    { label: 'Thu 05', day: 'Thu', date: '2026-03-05', value: 3, absent: 0, recorded: true },
    { label: 'Fri 06', day: 'Fri', date: '2026-03-06', value: 0, absent: 0, recorded: false },
  ],
  attendanceByClass: [
    { name: 'Yellow', rate: 97, learners: 2 },
    { name: 'Green', rate: 90, learners: 2 },
  ],
  observationsByCategory: [
    { category: 'Academic', observationCount: 3, averageRating: 8 },
    { category: 'Social', observationCount: 2, averageRating: 7 },
  ],
  classTrends: [
    { name: 'Yellow', thisWeek: 97, lastWeek: 94 },
    { name: 'Green', thisWeek: 90, lastWeek: 88 },
  ],
  orgTrend: [
    { label: '13 Oct', rate: 88 },
    { label: '20 Oct', rate: 90 },
    { label: '27 Oct', rate: 91 },
    { label: '3 Nov', rate: 92 },
  ],
  orgTrendView: 'weekly',
  monthStart: '2026-03-01',
  classesThisMonth: [
    { name: 'Yellow', colour: null, activeLearners: 4, attendedLearners: 3 },
    { name: 'Green', colour: null, activeLearners: 2, attendedLearners: null },
  ],
  rates: { thisWeek: 94, lastWeek: 90, period: 92 },
}

/** Stat card value next to a known label (avoids ambiguous numbers like "4"). */
function statValue(label) {
  const labelEl = screen.getByText(label)
  const card = labelEl.closest('div.bg-white')
  return within(card).getByText(/^\d+%?$/)
}

async function renderReports(role = 'manager') {
  await signInAs(role)
  render(
    <MemoryRouter>
      <Reports role={role === 'admin' ? 'Admin' : 'Manager'} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  resetApi()
  onApi('GET', '/reports/overview', OVERVIEW)
  // useHeader → useClasses may request classes; keep it quiet
  onApi('GET', '/classes', [])
})

describe('Reports', () => {
  it('shows loading then live overview stats from the API', async () => {
    await renderReports('manager')
    expect(screen.getByText(/loading report data/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Total Learners')).toBeInTheDocument()
    })

    // Values from OVERVIEW.totals — scoped to each card so "4" is not ambiguous
    expect(statValue('Total Learners')).toHaveTextContent('6')
    expect(statValue('Avg Attendance')).toHaveTextContent('92%')
    expect(statValue('Observations')).toHaveTextContent('8')
    expect(statValue('Classes')).toHaveTextContent('4')

    expect(screen.getByText('Yellow')).toBeInTheDocument()
    expect(screen.getByText(/97% · 2 learners/)).toBeInTheDocument()
    expect(screen.getByText('Academic')).toBeInTheDocument()

    expect(screen.getByTestId('weekly-chart')).toHaveTextContent('5/1,4/0,5/2,3/0,0/0')
  })

  it('renders trends from API classTrends and orgTrend', async () => {
    await renderReports('manager')
    await screen.findByText('Total Learners')

    await userEvent.click(screen.getByRole('button', { name: /Trends/i }))
    expect(await screen.findByText('Organisation trend')).toBeInTheDocument()
    expect(screen.getByTestId('trend-chart')).toHaveTextContent('88,90,91,92')
    expect(screen.getByText('Attendance each week, Monday to Friday.')).toBeInTheDocument()
    expect(screen.getByText('97%')).toBeInTheDocument()
    expect(screen.getByText('94%')).toBeInTheDocument()
  })

  it('explains the day-by-day trend while only one week is recorded', async () => {
    onApi('GET', '/reports/overview', {
      ...OVERVIEW,
      orgTrend: [{ label: 'Mon 02', rate: 80 }, { label: 'Tue 03', rate: 100 }],
      orgTrendView: 'daily',
    })
    await renderReports('manager')
    await screen.findByText('Total Learners')

    await userEvent.click(screen.getByRole('button', { name: /Trends/i }))
    expect(await screen.findByTestId('trend-chart')).toHaveTextContent('80,100')
    expect(screen.getByText(/Attendance day by day/)).toBeInTheDocument()
  })

  it('opens each tab with a plain-English takeaway', async () => {
    await renderReports('manager')
    expect(await screen.findByText('Attendance is up 4 points on last week, at 94%.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Trends/i }))
    expect(await screen.findByText(/Yellow leads at 97%; Green is lowest at 90%/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Donor Report/i }))
    expect(await screen.findByText(/5 of 6 enrolled learners attended, with 92% average attendance/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Board Report/i }))
    expect(await screen.findByText(/6 active learners across 4 class groups, looked after by 3 active teachers/)).toBeInTheDocument()
  })

  it('shows present against absent and the change on last week for each class', async () => {
    await renderReports('manager')
    await screen.findByText('Present vs Absent')
    expect(screen.getByRole('img', { name: '92% present' })).toBeInTheDocument()
    expect(screen.getByText('110')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('▲ 3')).toBeInTheDocument() // Yellow 94 -> 97
    expect(screen.getByText('▲ 2')).toBeInTheDocument() // Green 88 -> 90
  })

  it('shows the change per class on the Trends table', async () => {
    await renderReports('manager')
    await screen.findByText('Total Learners')
    await userEvent.click(screen.getByRole('button', { name: /Trends/i }))
    expect(await screen.findByText('Change')).toBeInTheDocument()
    expect(screen.getByText('▲ 3')).toBeInTheDocument()
  })

  it('passes a summary and charts to the Overview PDF', async () => {
    await renderReports('manager')
    await screen.findByText('Total Learners')
    await userEvent.click(screen.getByRole('button', { name: /Export as PDF/i }))
    expect(exportPagePdf).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Overview Report', filename: 'overview-report' }))
    // It captures what is on screen, leaving the export button out
    const { root } = exportPagePdf.mock.lastCall[0]
    expect(root).toHaveTextContent('Total Learners')
    expect(screen.getByRole('button', { name: /Export as PDF/i })).toHaveAttribute('data-pdf-skip')
  })

  it('shows absences as well as present learners for each day, and a dash where no register was taken', async () => {
    await renderReports('manager')
    await screen.findByText('Weekly Attendance')

    const day = (label) => document.querySelector(`[data-day="${label}"]`)
    expect(within(day('Mon 02')).getByLabelText('5 present')).toBeInTheDocument()
    expect(within(day('Mon 02')).getByLabelText('1 absent')).toBeInTheDocument()
    expect(within(day('Wed 04')).getByLabelText('2 absent')).toBeInTheDocument()
    expect(within(day('Fri 06')).queryByLabelText(/present|absent/)).not.toBeInTheDocument()
    expect(within(day('Fri 06')).getAllByText('–')).toHaveLength(2)
  })

  it('shows the average rating beside each development category', async () => {
    onApi('GET', '/reports/overview', {
      ...OVERVIEW,
      observationsByCategory: [
        { category: 'Academic', observationCount: 3, averageRating: 7.666666 },
        { category: 'Social', observationCount: 2, averageRating: null },
      ],
    })
    await renderReports('manager')
    expect(await screen.findByText('avg 7.7/10')).toBeInTheDocument()
    expect(screen.getByText('no rating')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Export as PDF/i }))
  })

  it('reloads the numbers when the manager comes back to the tab', async () => {
    await renderReports('manager')
    await screen.findByText('Total Learners')
    expect(statValue('Observations')).toHaveTextContent('8')

    onApi('GET', '/reports/overview', { ...OVERVIEW, totals: { ...OVERVIEW.totals, observations: 9 } })
    window.dispatchEvent(new Event('focus'))
    await waitFor(() => expect(statValue('Observations')).toHaveTextContent('9'))
    expect(screen.queryByText(/loading report data/i)).not.toBeInTheDocument()
  })

  it('exports the organisation trend chart as a PDF', async () => {
    await renderReports('manager')
    await screen.findByText('Total Learners')
    await userEvent.click(screen.getByRole('button', { name: /Trends/i }))

    await userEvent.click(await screen.findByRole('button', { name: 'Export chart as PDF' }))
    const { title, root, onlySelector } = exportPagePdf.mock.lastCall[0]
    expect(title).toBe('Organisation Trend')
    expect(root.querySelector(onlySelector)).toHaveTextContent('Organisation trend')
    expect(screen.getByRole('button', { name: 'Export chart as PDF' })).toHaveAttribute('data-pdf-skip')
  })

  it('renders donor metrics from live totals', async () => {
    await renderReports('manager')
    await screen.findByText('Total Learners')

    await userEvent.click(screen.getByRole('button', { name: /Donor Report/i }))
    expect(await screen.findByRole('heading', { name: 'Donor Impact Report' })).toBeInTheDocument()
    expect(screen.getByText('Learners enrolled')).toBeInTheDocument()
    expect(screen.getByText('Learners who attended')).toBeInTheDocument()
    expect(screen.queryByText('Learners served this period')).not.toBeInTheDocument()
    expect(screen.getByText('Sign outs')).toBeInTheDocument()
    expect(screen.getByText('48')).toBeInTheDocument()
    expect(screen.getByText(/had 6 enrolled learners across 4 class groups, of whom 5 attended aftercare/)).toBeInTheDocument()
  })

  it('shows a dash for learners who attended until attendance has been taken', async () => {
    onApi('GET', '/reports/overview', {
      ...OVERVIEW,
      totals: { ...OVERVIEW.totals, avgAttendance: null, presentRecords: 0, absentRecords: 0, learnersAttended: 0 },
    })
    await renderReports('manager')
    await screen.findByText('Total Learners')
    await userEvent.click(screen.getByRole('button', { name: /Donor Report/i }))

    const card = (await screen.findByText('Learners who attended')).closest('div.bg-white')
    expect(card).toHaveTextContent('–')
    expect(screen.getByText(/6 learners are enrolled; no attendance has been recorded in this period yet/)).toBeInTheDocument()
    expect(screen.getByText('Learners enrolled').closest('div.bg-white')).toHaveTextContent('6')
  })

  it('shows active learners and who came this month for each class', async () => {
    await renderReports('admin')
    await screen.findByText('Total Learners')
    await userEvent.click(screen.getByRole('button', { name: /Donor Report/i }))
    await screen.findByRole('heading', { name: 'Learners by Class' })

    const cells = (name) => within(screen.getByText(name).closest('tr')).getAllByRole('cell').map((c) => c.textContent)
    expect(cells('Yellow')).toEqual(['Yellow', '4', '3'])
    // No register for Green this month: a dash, not 0, and left out of the total
    expect(cells('Green')).toEqual(['Green', '2', '–'])
    expect(cells('Total')).toEqual(['Total', '6', '3'])

  })

  it('shows the same class table on the Board report', async () => {
    await renderReports('admin')
    await screen.findByText('Total Learners')
    await userEvent.click(screen.getByRole('button', { name: /Board Report/i }))
    await screen.findByRole('heading', { name: 'Learners by Class' })

    const cells = (name) => within(screen.getByText(name).closest('tr')).getAllByRole('cell').map((c) => c.textContent)
    expect(cells('Yellow')).toEqual(['Yellow', '4', '3'])
    expect(cells('Total')).toEqual(['Total', '6', '3'])

  })

  it('says so if the PDF cannot be made, and puts the page back', async () => {
    exportPagePdf.mockRejectedValueOnce(new Error('canvas failed'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await renderReports('admin')
    await screen.findByText('Total Learners')
    await userEvent.click(screen.getByRole('button', { name: /Export as PDF/i }))
    expect(await screen.findByText(/Couldn't create the PDF/)).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    console.error.mockRestore()
  })

  describe('month picker', () => {
    const requestFor = (start) => {
      const { end } = monthRange(start)
      return `/reports/overview?periodStart=${start}&periodEnd=${end}`
    }

    it('opens on the current month', async () => {
      await renderReports('admin')
      await screen.findByText('Total Learners')
      expect(screen.getByLabelText('Month')).toHaveValue(reportMonths()[0].start)
      expect(apiClient.get).toHaveBeenCalledWith(requestFor(reportMonths()[0].start))
    })

    it('loads a past month, and words its weeks as past', async () => {
      const past = reportMonths()[1]
      await renderReports('admin')
      await screen.findByText('Total Learners')

      await userEvent.selectOptions(screen.getByLabelText('Month'), past.start)
      await waitFor(() => expect(apiClient.get).toHaveBeenLastCalledWith(requestFor(past.start)))
      expect(await screen.findByRole('heading', { name: new RegExp(`Final Week of ${past.label}`) })).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: /Trends/ }))
      expect(screen.getByRole('columnheader', { name: 'Final week' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Week before' })).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: /Board Report/i }))
      expect(screen.getByText(`48 sign outs in ${past.label}`)).toBeInTheDocument()
    })

    it("doesn't show the old month's numbers while the new month loads", async () => {
      const past = reportMonths()[1]
      await renderReports('admin')
      await screen.findByText('6')

      let finish
      onApi('GET', requestFor(past.start), () => new Promise((resolve) => { finish = resolve }))
      await userEvent.selectOptions(screen.getByLabelText('Month'), past.start)
      expect(screen.queryByText('6')).not.toBeInTheDocument()
      expect(screen.getByText(/Loading report data/)).toBeInTheDocument()

      finish(OVERVIEW)
      expect(await screen.findByText('6')).toBeInTheDocument()
    })
  })

  it('renders board report bullets from live totals', async () => {
    await renderReports('manager')
    await screen.findByText('Total Learners')

    await userEvent.click(screen.getByRole('button', { name: /Board Report/i }))
    // Tab button AND page title both say "Board Report" — target the heading only
    expect(await screen.findByRole('heading', { name: 'Board Report' })).toBeInTheDocument()
    expect(screen.getByText('6 active learners')).toBeInTheDocument()
    expect(screen.getByText('4 class groups')).toBeInTheDocument()
    expect(screen.getByText('3 active teachers')).toBeInTheDocument()
    expect(screen.getByText('48 sign outs this month')).toBeInTheDocument()
    // Development section: the total, then each category (busiest first) with its average rating
    expect(screen.getByText('Learner development')).toBeInTheDocument()
    expect(screen.queryByText('Wellbeing')).not.toBeInTheDocument()
    expect(screen.getByText('8 teacher observations')).toBeInTheDocument()
    expect(screen.getByText('3 Academic observations, average rating 8/10')).toBeInTheDocument()
    expect(screen.getByText('2 Social observations, average rating 7/10')).toBeInTheDocument()
    expect(screen.queryByText(/operational|Parent communication/)).not.toBeInTheDocument()
  })

  it('says "no data" rather than 0% when nothing was recorded in the period', async () => {
    onApi('GET', '/reports/overview', {
      ...OVERVIEW,
      totals: { ...OVERVIEW.totals, avgAttendance: null },
      attendanceByClass: [{ name: 'Yellow', rate: null, learners: 2 }],
      orgTrend: OVERVIEW.orgTrend.map((w) => ({ ...w, rate: null })),
    })
    await renderReports('manager')
    await screen.findByText('Total Learners')

    expect(screen.getByText('Avg Attendance').closest('div.bg-white')).toHaveTextContent('–')
    expect(screen.getByText(/No data yet · 2 learners/)).toBeInTheDocument()
    expect(screen.queryByText(/^0%/)).not.toBeInTheDocument()
  })

  it('shows an error when the overview API fails', async () => {
    resetApi()
    onApi('GET', '/classes', [])
    onApi('GET', '/reports/overview', new ApiError('Forbidden', 403))

    await renderReports('manager')
    expect(await screen.findByText(/Forbidden|Could not load report data/i)).toBeInTheDocument()
  })

  it('gives a figure the same colour on every tab', async () => {
    const colourOf = (label) => screen.getByText(label, { selector: 'p' }).previousElementSibling.className.match(/text-\w+-\d+/)[0]
    await renderReports('admin')
    await screen.findByText('6')
    const overview = { learners: colourOf('Total Learners'), classes: colourOf('Classes'), observations: colourOf('Observations') }

    await userEvent.click(screen.getByRole('button', { name: /Board Report/i }))
    await screen.findByRole('heading', { name: 'Board Report' })
    expect(colourOf('Active learners')).toBe(overview.learners)
    expect(colourOf('Class groups')).toBe(overview.classes)
    const signOuts = colourOf('Sign outs')

    await userEvent.click(screen.getByRole('button', { name: /Donor Report/i }))
    await screen.findByRole('heading', { name: 'Donor Impact Report' })
    expect(colourOf('Learners enrolled')).toBe(overview.learners)
    expect(colourOf('Development observations')).toBe(overview.observations)
    expect(colourOf('Sign outs')).toBe(signOuts)
  })

  it('works for an admin role label', async () => {
    await renderReports('admin')
    await screen.findByText('Total Learners')
    // The card can show before the numbers arrive (slow under a full test
    // run), so wait for the value rather than checking it straight away.
    await waitFor(() => expect(statValue('Total Learners')).toHaveTextContent('6'))
  })
})

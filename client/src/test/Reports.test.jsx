// Reports page: loads /reports/overview and renders live stats (not hardcoded samples).
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Reports from '../pages/Reports'
import { generateChartPDF, generatePDF } from '../utils/pdf'
import { ApiError, onApi, resetApi } from './api-mock'
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
  generatePDF: vi.fn(),
  generateChartPDF: vi.fn(),
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
    { week: 'W1', rate: 88 },
    { week: 'W2', rate: 90 },
    { week: 'W3', rate: 91 },
    { week: 'W4', rate: 92 },
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
    expect(screen.getByText('97%')).toBeInTheDocument()
    expect(screen.getByText('94%')).toBeInTheDocument()
  })

  it('opens each tab with a plain-English takeaway', async () => {
    await renderReports('manager')
    expect(await screen.findByText('Attendance is up 4 points on last week, at 94%.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Trends/i }))
    expect(await screen.findByText(/Yellow leads at 97%; Green is lowest at 90%/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Donor Report/i }))
    expect(await screen.findByText(/6 learners reached across 22 days of aftercare with 92% average attendance/)).toBeInTheDocument()

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
    expect(generatePDF).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Overview Report',
        summary: 'Attendance is up 4 points on last week, at 94%.',
        charts: [
          expect.objectContaining({ type: 'split', parts: [expect.objectContaining({ value: 110 }), expect.objectContaining({ value: 10 })] }),
          expect.objectContaining({ type: 'bars', heading: 'Present and absent each day this week' }),
          expect.objectContaining({ type: 'bars', heading: 'Attendance by class' }),
          expect.objectContaining({ type: 'bars', heading: 'Observations by development category' }),
        ],
      }),
    )
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
    expect(generateChartPDF).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Organisation Trend',
        points: [
          { label: 'W1', value: 88 },
          { label: 'W2', value: 90 },
          { label: 'W3', value: 91 },
          { label: 'W4', value: 92 },
        ],
      }),
    )
  })

  it('renders donor metrics from live totals', async () => {
    await renderReports('manager')
    await screen.findByText('Total Learners')

    await userEvent.click(screen.getByRole('button', { name: /Donor Report/i }))
    expect(await screen.findByRole('heading', { name: 'Donor Impact Report' })).toBeInTheDocument()
    expect(screen.getByText('Learners served this period')).toBeInTheDocument()
    expect(screen.getByText('Safe collections this month')).toBeInTheDocument()
    expect(screen.getByText('48')).toBeInTheDocument()
    expect(screen.getByText(/6 registered learner/i)).toBeInTheDocument()
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
    expect(screen.getByText(/48 safe collection/i)).toBeInTheDocument()
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

  it('works for an admin role label', async () => {
    await renderReports('admin')
    await screen.findByText('Total Learners')
    // The card can show before the numbers arrive (slow under a full test
    // run), so wait for the value rather than checking it straight away.
    await waitFor(() => expect(statValue('Total Learners')).toHaveTextContent('6'))
  })
})

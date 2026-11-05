// Admin home: today's totals and the Class Overview from GET /reports/overview,
// and no way through to learner-level pages.
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { colourForClass } from '../pages/AddClassSheet'
import AdminHome from '../pages/AdminHome'
import { longDate, todayInSA } from '../utils/dates'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const TODAY = {
  date: '2026-10-05',
  present: 7,
  activeLearners: 12,
  signedOut: 3,
  classes: [
    { name: 'Blue', colour: null, present: 1, activeLearners: 2 },
    { name: 'Yellow', colour: null, present: 3, activeLearners: 4 },
    { name: 'Brown', colour: '#9B5DE5', present: 0, activeLearners: 0 },
  ],
}

async function renderAdmin() {
  await signInAs('admin')
  render(
    <MemoryRouter>
      <AdminHome />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  resetApi()
  onApi('GET', '/reports/overview', { totals: {}, today: TODAY })
})

describe('Admin home', () => {
  it('shows every class in the Class Overview with present / active learners', async () => {
    await renderAdmin()
    const overview = (await screen.findByRole('heading', { name: 'Class Overview' })).nextElementSibling
    expect(within(overview).getByText('Blue')).toBeInTheDocument()
    expect(within(overview).getByText('1/2')).toBeInTheDocument()
    expect(within(overview).getByText('Yellow')).toBeInTheDocument()
    expect(within(overview).getByText('3/4')).toBeInTheDocument()
    expect(within(overview).getByText('Brown')).toBeInTheDocument()
    expect(within(overview).getByText('0/0')).toBeInTheDocument()
  })

  it('colours each class the same as the Reports page (saved colour, else the colour of its name)', async () => {
    await renderAdmin()
    const overview = (await screen.findByRole('heading', { name: 'Class Overview' })).nextElementSibling
    const bar = (name) => within(overview).getByText(name).closest('div').parentElement.querySelector('.h-2 > div')
    expect(bar('Yellow')).toHaveStyle({ backgroundColor: colourForClass('Yellow') })
    expect(bar('Blue')).toHaveStyle({ backgroundColor: colourForClass('Blue') })
    expect(bar('Brown')).toHaveStyle({ backgroundColor: '#9B5DE5' })
  })

  it("shows today's real totals and the admin's name, not placeholder text", async () => {
    await renderAdmin()
    expect(await screen.findByText('7 of 12 learners present today')).toBeInTheDocument()
    // The banner shows today's date in SA, not the date in the report.
    expect(screen.getByText(longDate(todayInSA()))).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/, Ada! 👋$/)
    expect(screen.getByText('Present Today').previousElementSibling).toHaveTextContent('7')
    expect(screen.getByText('Signed Out').previousElementSibling).toHaveTextContent('3')
    expect(screen.getByText('Total Learners').previousElementSibling).toHaveTextContent('12')
    expect(screen.queryByText(/System|29 July/)).not.toBeInTheDocument()
  })

  it('reads only the totals report (never learner lists or the register)', async () => {
    await renderAdmin()
    await screen.findByText('7 of 12 learners present today')
    expect(apiClient.get.mock.calls.map(([path]) => path)).toEqual(['/reports/overview'])
  })

  it('has no Learners or Attendance quick actions', async () => {
    await renderAdmin()
    await screen.findByText('Quick Actions')
    expect(screen.getByRole('button', { name: /Reports/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Learners/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Attendance/ })).not.toBeInTheDocument()
  })

  it('says so if the numbers cannot be loaded', async () => {
    onApi('GET', '/reports/overview', new ApiError('Internal server error', 500))
    await renderAdmin()
    expect(await screen.findByRole('alert')).toHaveTextContent('Internal server error')
    // The quick actions don't depend on the numbers, so they still work.
    expect(screen.getByRole('button', { name: /Reports/ })).toBeInTheDocument()
  })
})

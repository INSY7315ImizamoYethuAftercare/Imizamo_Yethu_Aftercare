// Manager home (also the master admin's dashboard): greeting and today's
// totals from GET /reports/overview, not placeholder text.
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ManagerHome from '../pages/ManagerHome'
import { longDate, todayInSA } from '../utils/dates'
import { ApiError, onApi, resetApi } from './api-mock'
import { CLASSES, LEARNERS, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const TODAY = { date: '2026-10-05', present: 7, activeLearners: 12, signedOut: 3, classes: [] }

async function renderHome(role = 'manager') {
  await signInAs(role)
  render(<MemoryRouter><ManagerHome /></MemoryRouter>)
}

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
  onApi('GET', '/learners', LEARNERS)
  onApi('GET', '/reports/overview', { totals: {}, today: TODAY })
})

describe('Manager home', () => {
  it("shows today's real totals, not placeholder numbers", async () => {
    await renderHome()
    expect(await screen.findByText('7 of 12 learners present today • 3 signed out')).toBeInTheDocument()
    expect(screen.getByText('Present Today').previousElementSibling).toHaveTextContent('7')
    expect(screen.getByText('Signed Out').previousElementSibling).toHaveTextContent('3')
    expect(screen.getByText('Total Learners').previousElementSibling).toHaveTextContent('12')
    expect(screen.queryByText(/sign-outs need review|29 July/)).not.toBeInTheDocument()
  })

  it('still shows the Escalations placeholder until escalations are stored on the server', async () => {
    await renderHome()
    expect((await screen.findByText('Escalations')).previousElementSibling).toHaveTextContent('3')
  })

  it("greets a manager by first name, with today's date", async () => {
    await renderHome('manager')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/, Sarah! 👋$/)
    expect(screen.getByText(longDate(todayInSA()))).toBeInTheDocument()
  })

  it('greets the master admin as "Master Admin"', async () => {
    await renderHome('masterAdmin')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/, Master Admin! 👋$/)
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveTextContent('Nomvula')
  })

  it("says so if today's numbers can't be loaded", async () => {
    onApi('GET', '/reports/overview', new ApiError('Server unavailable', 503))
    await renderHome()
    expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable')
    expect(screen.queryByText('Present Today')).not.toBeInTheDocument()
  })
})

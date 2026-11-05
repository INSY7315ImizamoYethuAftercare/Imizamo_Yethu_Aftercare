// Manager home (also the master admin's dashboard): greeting and today's
// totals from GET /reports/overview, not placeholder text.
import { render, screen, waitFor, within } from '@testing-library/react'
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

const learner = (learnerId, name, signedOut = null) => ({ learnerId, name, className: 'Yellow', pickups: [], signedOut })

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
  onApi('GET', '/learners', LEARNERS)
  onApi('GET', '/reports/overview', { totals: {}, today: TODAY })
  onApi('GET', '/signout/today', { date: '2026-10-05', learners: [] })
  onApi('GET', '/signout/escalations', { date: '2026-10-05', open: [], resolved: [] })
})

describe('Recent Activity', () => {
  const recent = async () => (await screen.findByRole('heading', { name: 'Recent Activity' })).nextElementSibling

  it("lists today's real sign-outs, latest first, and not who is still here", async () => {
    onApi('GET', '/signout/today', {
      date: '2026-10-05',
      learners: [
        learner(1, 'Aisha Petersen', { timeOut: '16:42', collectedBy: 'Fatima Petersen', recordedBy: 'Ms Nkosi' }),
        learner(2, 'Still Here'),
        learner(3, 'Zoe Ntombela', { timeOut: '17:05', collectedBy: 'Walked home alone', recordedBy: 'Sarah Botha' }),
      ],
    })
    await renderHome()
    const list = await recent()
    await within(list).findByText('Zoe Ntombela signed out')
    const rows = within(list).getAllByText(/signed out$/).map((el) => el.textContent)
    expect(rows).toEqual(['Zoe Ntombela signed out', 'Aisha Petersen signed out'])
    expect(within(list).getByText('Walked home alone • Yellow')).toBeInTheDocument()
    expect(within(list).getByText('Collected by Fatima Petersen • Yellow')).toBeInTheDocument()
    expect(within(list).getByText('16:42')).toBeInTheDocument()
    expect(within(list).getByText('Signed out by Ms Nkosi')).toBeInTheDocument()
    expect(within(list).getByText('Signed out by Sarah Botha')).toBeInTheDocument()
    expect(within(list).queryByText(/Still Here/)).not.toBeInTheDocument()
    expect(screen.queryByText(/flagged/)).not.toBeInTheDocument()
  })

  it('shows at most the 5 latest', async () => {
    onApi('GET', '/signout/today', {
      date: '2026-10-05',
      learners: [1, 2, 3, 4, 5, 6, 7].map((n) => learner(n, `Learner ${n}`, { timeOut: `16:0${n}`, collectedBy: 'A Parent' })),
    })
    await renderHome()
    const list = await recent()
    await within(list).findByText('Learner 7 signed out')
    expect(within(list).getAllByText(/signed out$/)).toHaveLength(5)
    expect(within(list).queryByText('Learner 2 signed out')).not.toBeInTheDocument()
  })

  it('says when nobody has been signed out yet', async () => {
    await renderHome()
    expect(await within(await recent()).findByText('No sign-outs yet today.')).toBeInTheDocument()
  })

  it("says so if today's sign-outs can't be loaded", async () => {
    onApi('GET', '/signout/today', new ApiError('Server unavailable', 503))
    await renderHome()
    expect(await within(await recent()).findByRole('alert')).toHaveTextContent('Server unavailable')
  })
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

  it('counts the real requests waiting in the sign-out queue', async () => {
    onApi('GET', '/signout/escalations', { date: '2026-10-05', open: [{ escalationId: 1 }, { escalationId: 2 }], resolved: [{ escalationId: 3 }] })
    await renderHome()
    const stat = (await screen.findByText('Escalations')).previousElementSibling
    await waitFor(() => expect(stat).toHaveTextContent('2'))
    expect(within(screen.getByRole('button', { name: /Queue/ })).getByText('2')).toBeInTheDocument()
  })

  it('shows no badge on an empty queue', async () => {
    await renderHome()
    const stat = (await screen.findByText('Escalations')).previousElementSibling
    await waitFor(() => expect(stat).toHaveTextContent('0'))
    expect(within(screen.getByRole('button', { name: /Queue/ })).queryByText('0')).not.toBeInTheDocument()
  })

  it('shows a dash when the queue cannot be loaded', async () => {
    onApi('GET', '/signout/escalations', () => { throw new ApiError('Nope', 500) })
    await renderHome()
    expect((await screen.findByText('Escalations')).previousElementSibling).toHaveTextContent('–')
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

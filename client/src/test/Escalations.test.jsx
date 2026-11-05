// The manager's sign-out queue against the (mocked) API: real requests only,
// and every decision saved on the server.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Escalations from '../pages/Escalations'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { CLASSES, LEARNERS, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const STRANGER = {
  escalationId: 1, learnerId: 3, learnerName: 'Aisha Petersen', className: 'Yellow', collectorName: 'Random Stranger',
  raisedBy: 'Ms Nkosi', raisedAt: '16:40', status: 'open', resolvedBy: null, resolvedAt: null,
}
const WALKER = {
  ...STRANGER, escalationId: 2, learnerId: 9, learnerName: 'Naledi Mokoena', className: 'Red', collectorName: null,
}

const queue = (open = [], resolved = []) => ({ date: '2026-10-05', open, resolved })

async function renderQueue() {
  await signInAs('manager')
  render(<MemoryRouter><Escalations /></MemoryRouter>)
}

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
  onApi('GET', '/learners', LEARNERS)
})

describe('Sign-out queue', () => {
  it('lists the real requests and says why each one is there', async () => {
    onApi('GET', '/signout/escalations', queue([STRANGER, WALKER]))
    await renderQueue()
    expect(await screen.findByText('Aisha Petersen')).toBeInTheDocument()
    expect(screen.getByText('Yellow • Ms Nkosi • 16:40')).toBeInTheDocument()
    expect(screen.getByText(/Ms Nkosi entered Random Stranger/)).toBeInTheDocument()
    expect(screen.getByText(/doesn't have permission to walk home alone/)).toBeInTheDocument()
    expect(screen.getByText('Open').previousElementSibling).toHaveTextContent('2')
  })

  it('shows no made-up requests when the queue is empty', async () => {
    onApi('GET', '/signout/escalations', queue())
    await renderQueue()
    expect(await screen.findByText(/No open escalations/)).toBeInTheDocument()
    expect(screen.queryByText(/Zoe Ntombela|Sipho Dlamini|Liam van der Berg/)).not.toBeInTheDocument()
  })

  it('saves an approval on the server and shows the new queue', async () => {
    onApi('GET', '/signout/escalations', queue([STRANGER]))
    onApi('PATCH', '/signout/escalations/1', () => {
      onApi('GET', '/signout/escalations', queue([], [{ ...STRANGER, status: 'approved', resolvedBy: 'Sarah Botha', resolvedAt: '16:45' }]))
      return { escalationId: 1, status: 'approved', signOut: { timeOut: '16:45' } }
    })
    await renderQueue()
    await userEvent.click(await screen.findByRole('button', { name: 'Approve collection' }))
    expect(apiClient.patch).toHaveBeenCalledWith('/signout/escalations/1', { action: 'approve' })
    expect(await screen.findByText('Approved by Sarah Botha • 16:45')).toBeInTheDocument()
    expect(screen.getByText('Collected by Random Stranger (not on pickup list)')).toBeInTheDocument()
    expect(screen.queryByText('Unknown collector')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Aisha Petersen — collection approved and signed out')
  })

  it('saves a dismissal on the server', async () => {
    onApi('GET', '/signout/escalations', queue([STRANGER]))
    onApi('PATCH', '/signout/escalations/1', () => {
      onApi('GET', '/signout/escalations', queue([], [{ ...STRANGER, status: 'dismissed', resolvedBy: 'Sarah Botha', resolvedAt: '16:45' }]))
      return { escalationId: 1, status: 'dismissed', signOut: null }
    })
    await renderQueue()
    await userEvent.click(await screen.findByRole('button', { name: 'Dismiss' }))
    expect(apiClient.patch).toHaveBeenCalledWith('/signout/escalations/1', { action: 'dismiss' })
    expect(await screen.findByText('Dismissed by Sarah Botha • 16:45')).toBeInTheDocument()
    expect(screen.getByText('Requested: Random Stranger')).toBeInTheDocument()
    expect(screen.queryByText(/Collected by/)).not.toBeInTheDocument()
  })

  it("shows the server's reason when a decision is refused", async () => {
    onApi('GET', '/signout/escalations', queue([STRANGER]))
    onApi('PATCH', '/signout/escalations/1', () => { throw new ApiError('This request has already been approved.', 409) })
    await renderQueue()
    await userEvent.click(await screen.findByRole('button', { name: 'Approve collection' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('This request has already been approved.')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('says so when the queue cannot be loaded, instead of saying all is clear', async () => {
    onApi('GET', '/signout/escalations', () => { throw new ApiError('Server error', 500) })
    await renderQueue()
    expect(await screen.findByRole('alert')).toHaveTextContent('Server error')
    expect(screen.queryByText(/No open escalations/)).not.toBeInTheDocument()
  })

  it('shows the outcome of a decided walking-home request', async () => {
    onApi('GET', '/signout/escalations', queue([], [
      { ...WALKER, status: 'dismissed', resolvedBy: 'Sarah Botha', resolvedAt: '17:01' },
      { ...WALKER, escalationId: 3, learnerName: 'Liam Smith', status: 'approved', resolvedBy: 'Sarah Botha', resolvedAt: '17:05' },
    ]))
    await renderQueue()
    const dismissed = (await screen.findByText('Naledi Mokoena')).parentElement.parentElement
    expect(within(dismissed).getByText('Requested: Walking home')).toBeInTheDocument()
    expect(within(dismissed).getByText('Dismissed by Sarah Botha • 17:01')).toBeInTheDocument()
    const approved = screen.getByText('Liam Smith').parentElement.parentElement
    expect(within(approved).getByText('Walked home alone')).toBeInTheDocument()
    expect(within(approved).getByText('Approved by Sarah Botha • 17:05')).toBeInTheDocument()
  })

  it('keeps the reason on requests still waiting for a decision', async () => {
    onApi('GET', '/signout/escalations', queue([STRANGER]))
    await renderQueue()
    expect(await screen.findByText('Unknown collector')).toBeInTheDocument()
  })
})

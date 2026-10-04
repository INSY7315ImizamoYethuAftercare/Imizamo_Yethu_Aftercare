// #52 — Sign-out flow against the (mocked) API: today's list, tapping an
// authorised pickup, confirming, server errors, walking home, the flagged
// path, and the manager view.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SignOut from '../pages/SignOut'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { CLASSES, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const AISHA = {
  learnerId: 3, name: 'Aisha Petersen', className: 'Yellow', gradeRange: 'Gr 1-2', canWalkHomeAlone: false,
  pickups: [
    { guardianId: 1, fullName: 'Fatima Petersen', relationship: 'Mother', isPrimaryContact: true },
    { guardianId: 2, fullName: 'Ahmed Petersen', relationship: 'Father', isPrimaryContact: false },
  ],
  signedOut: null,
}
const NALEDI = {
  learnerId: 9, name: 'Naledi Mokoena', className: 'Red', gradeRange: 'Gr 5-6', canWalkHomeAlone: true,
  pickups: [{ guardianId: 4, fullName: 'Thabo Mokoena', relationship: 'Father', isPrimaryContact: true }],
  signedOut: null,
}
const BONGANI = {
  learnerId: 12, name: 'Bongani Khumalo', className: 'Blue', gradeRange: 'Gr 7', canWalkHomeAlone: true,
  pickups: [], signedOut: { timeOut: '16:10', collectedBy: 'Walked home alone' },
}

const today = (learners) => ({ date: '2026-10-05', learners })

async function renderAs(role = 'teacher', props = {}) {
  await signInAs(role)
  render(
    <MemoryRouter>
      <SignOut {...props} />
    </MemoryRouter>,
  )
}

const start = async (name) => userEvent.click(await screen.findByRole('button', { name: `Sign out ${name}` }))
const tap = (name) => userEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }))
const click = (name) => userEvent.click(screen.getByRole('button', { name }))

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
  onApi('GET', '/signout/today', today([AISHA, NALEDI, BONGANI]))
})

describe("today's list", () => {
  it('shows learners still to be collected, and who has already gone', async () => {
    await renderAs()
    expect(await screen.findByText('2 learners still to be collected')).toBeInTheDocument()
    expect(screen.getByText('Aisha Petersen')).toBeInTheDocument()
    expect(screen.getByText('Gr 1-2 • Yellow')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign out Bongani Khumalo' })).not.toBeInTheDocument()
    expect(screen.getByText('ALREADY COLLECTED TODAY')).toBeInTheDocument()
    expect(screen.getByText('16:10 • Walked home alone')).toBeInTheDocument()
  })

  it('filters by search', async () => {
    await renderAs()
    await screen.findByText('Aisha Petersen')
    await userEvent.type(screen.getByPlaceholderText('Search learner name...'), 'nal')
    expect(screen.queryByText('Aisha Petersen')).not.toBeInTheDocument()
    expect(screen.getByText('1 learners still to be collected')).toBeInTheDocument()
  })

  it('tells staff to take attendance when nobody is marked present', async () => {
    onApi('GET', '/signout/today', today([]))
    await renderAs()
    expect(await screen.findByText(/No learners have been marked present today/)).toBeInTheDocument()
  })

  it('shows a load error with a retry', async () => {
    onApi('GET', '/signout/today', new ApiError('Server unavailable', 503))
    await renderAs()
    expect(await screen.findByText(/Could not load today's list/)).toBeInTheDocument()
    onApi('GET', '/signout/today', today([AISHA]))
    await click('Try again')
    expect(await screen.findByText('Aisha Petersen')).toBeInTheDocument()
  })
})

describe('collecting a learner', () => {
  it("lists that learner's own authorised pickups to tap", async () => {
    await renderAs()
    await start('Aisha Petersen')
    expect(screen.getByText('SIGNING OUT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Fatima Petersen/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Ahmed Petersen/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Thabo Mokoena/ })).not.toBeInTheDocument()
  })

  it('taps a guardian, verifies, confirms with the right payload, and refreshes the list', async () => {
    onApi('POST', '/signout/confirm', { record_id: 77, time_out: '16:42:10' })
    await renderAs()
    await start('Aisha Petersen')
    await tap('Fatima Petersen')
    expect(screen.getByRole('button', { name: /^Fatima Petersen/ })).toHaveAttribute('aria-pressed', 'true')
    await click('Verify')
    expect(screen.getByText('Fatima Petersen is authorised to collect Aisha Petersen')).toBeInTheDocument()

    onApi('GET', '/signout/today', today([{ ...AISHA, signedOut: { timeOut: '16:42', collectedBy: 'Fatima Petersen' } }, NALEDI, BONGANI]))
    await click('Confirm Sign-Out')

    expect(await screen.findByText('Aisha is signed out')).toBeInTheDocument()
    expect(screen.getByText('Collected by Fatima Petersen at 16:42')).toBeInTheDocument()
    expect(apiClient.post).toHaveBeenCalledWith('/signout/confirm', { learnerId: 3, guardianId: 1 })

    await click('Sign Out Another Learner')
    expect(await screen.findByText('1 learners still to be collected')).toBeInTheDocument()
    expect(screen.getByText('16:42 • Fatima Petersen')).toBeInTheDocument()
  })

  it.each([
    [403, 'This person is not authorised to collect this learner. Escalate to the manager.'],
    [409, 'This learner was already signed out today at 16:05.'],
    [409, 'This learner was marked absent today, so they cannot be signed out. Correct the register first.'],
  ])('shows the server message when confirming fails (%i)', async (status, message) => {
    onApi('POST', '/signout/confirm', new ApiError(message, status))
    await renderAs()
    await start('Aisha Petersen')
    await tap('Fatima Petersen')
    await click('Verify')
    await click('Confirm Sign-Out')
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByText('Aisha is signed out')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm Sign-Out' })).toBeEnabled()
  })

  it('signs out a learner allowed to walk home alone with guardianId null', async () => {
    onApi('POST', '/signout/confirm', { record_id: 78, time_out: '16:20:00' })
    await renderAs()
    await start('Naledi Mokoena')
    await tap('Walking Home')
    await click('Verify')
    expect(screen.getByText('Naledi Mokoena is allowed to walk home alone')).toBeInTheDocument()
    await click('Confirm Sign-Out')
    expect(await screen.findByText('Walking home alone at 16:20')).toBeInTheDocument()
    expect(apiClient.post).toHaveBeenCalledWith('/signout/confirm', { learnerId: 9, guardianId: null })
  })

  it('"Go back" and Cancel save nothing', async () => {
    await renderAs()
    await start('Aisha Petersen')
    await tap('Ahmed Petersen')
    await click('Verify')
    await click('Go back')
    expect(screen.getByRole('heading', { name: 'Who is collecting?' })).toBeInTheDocument()
    await click('Cancel')
    expect(await screen.findByText('2 learners still to be collected')).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalledWith('/signout/confirm', expect.anything())
  })
})

describe('validation and the flagged path', () => {
  it('asks for a choice when nobody is picked or typed', async () => {
    await renderAs()
    await start('Aisha Petersen')
    await click('Verify')
    expect(screen.getByRole('alert')).toHaveTextContent('Choose someone from the list, or type the name of the person collecting.')
  })

  it('points to the list when a typed name is actually on it', async () => {
    await renderAs()
    await start('Aisha Petersen')
    await userEvent.type(screen.getByLabelText('SOMEONE NOT ON THE LIST?'), 'fatima petersen')
    await click('Verify')
    expect(screen.getByRole('alert')).toHaveTextContent('Fatima Petersen is on the pickup list. Tap their name above instead.')
  })

  it('flags someone not on the list for the manager, and saves nothing', async () => {
    await renderAs()
    await start('Aisha Petersen')
    await userEvent.type(screen.getByLabelText('SOMEONE NOT ON THE LIST?'), 'Random Stranger')
    expect(screen.getByText(/This person is not on the pickup list/)).toBeInTheDocument()
    await click('Verify')
    expect(screen.getByText('Needs manager approval')).toBeInTheDocument()
    expect(screen.getByText('Random Stranger is not on the authorised pickup list.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Override and approve' })).not.toBeInTheDocument()

    await click('Send to manager queue')
    expect(screen.getByText('Sent to the manager queue')).toBeInTheDocument()
    expect(screen.getByText(/the manager queue isn't connected yet, so nothing has been sent or saved/)).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalledWith('/signout/confirm', expect.anything())
  })

  it('flags "Walking Home" for a learner without that permission', async () => {
    await renderAs()
    await start('Aisha Petersen')
    await tap('Walking Home')
    await click('Verify')
    expect(screen.getByText('Walking home is not pre-authorised for this learner.')).toBeInTheDocument()
  })

  it('explains when a learner has nobody on their pickup list', async () => {
    onApi('GET', '/signout/today', today([{ ...AISHA, pickups: [] }]))
    await renderAs()
    await start('Aisha Petersen')
    expect(screen.getByText(/No-one is on this learner's pickup list yet/)).toBeInTheDocument()
  })
})

describe('managers', () => {
  it('can sign a learner out too', async () => {
    onApi('POST', '/signout/confirm', { record_id: 79, time_out: '17:00:00' })
    await renderAs('manager', { role: 'Manager' })
    await start('Aisha Petersen')
    await tap('Fatima Petersen')
    await click('Verify')
    await click('Confirm Sign-Out')
    expect(await screen.findByText('Aisha is signed out')).toBeInTheDocument()
  })

  it('see the override button, but it is not available yet', async () => {
    await renderAs('manager', { role: 'Manager' })
    await start('Aisha Petersen')
    await userEvent.type(screen.getByLabelText('SOMEONE NOT ON THE LIST?'), 'Uncle Sipho')
    await click('Verify')
    const override = screen.getByRole('button', { name: 'Override and approve' })
    expect(override).toBeDisabled()
    expect(within(override.parentElement).getByText(/Override isn't available yet/)).toBeInTheDocument()
  })
})

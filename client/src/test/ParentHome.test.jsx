// Parent home page against the (mocked) guardian API.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ParentHome from '../pages/ParentHome'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { AISHA_OVERVIEW } from './parent-fixtures'
import { signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)


const CHILDREN = [{ learner_id: 3, first_name: 'Aisha', last_name: 'Petersen' }]

async function renderParent() {
  await signInAs('guardian')
  render(
    <MemoryRouter>
      <ParentHome />
    </MemoryRouter>,
  )
  await screen.findByText('Aisha Petersen')
}

beforeEach(() => {
  resetApi()
  onApi('GET', '/guardian/children', CHILDREN)
  onApi('GET', '/guardian/children/3/overview', AISHA_OVERVIEW)
})

describe('Parent home', () => {
  it('welcomes the parent and shows the child summary', async () => {
    await renderParent()
    expect(screen.getByRole('heading', { name: 'Welcome, Fatima! 💛' })).toBeInTheDocument()
    expect(screen.getByText("Here's how Aisha is doing")).toBeInTheDocument()
    expect(screen.getByText('Gr 1-2 · Yellow')).toBeInTheDocument()
    expect(screen.getByText('94%')).toBeInTheDocument()
    expect(screen.getByText('Present ✓')).toBeInTheDocument()
    expect(screen.queryByText(/Reading Club|Art/)).not.toBeInTheDocument()
  })

  it.each([
    [{ status: 'present', timeIn: '14:05', signedOut: null }, '✅ Aisha is at aftercare today', 'Arrived at 14:05'],
    [{ status: 'present', timeIn: '14:05', signedOut: { timeOut: '17:00', collectedBy: 'Zainab Hendricks' } }, '👋 Aisha has been collected', 'Signed out by Zainab Hendricks at 17:00'],
    [{ status: 'present', timeIn: '14:05', signedOut: { timeOut: '16:10', collectedBy: 'Walked home alone' } }, '👋 Aisha has been collected', 'Walked home alone at 16:10'],
    [{ status: 'absent', timeIn: null, signedOut: null }, 'Aisha was marked absent today', "Contact the teacher if this isn't right."],
    [{ status: null, timeIn: null, signedOut: null }, "Aisha hasn't been marked present yet today", /You'll see here/],
  ])("shows today's status %#", async (today, title, detail) => {
    onApi('GET', '/guardian/children/3/overview', { ...AISHA_OVERVIEW, today: { date: '2026-10-05', ...today } })
    await renderParent()
    expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.getByText(detail)).toBeInTheDocument()
  })

  it('shows the latest observation and expands to all of them', async () => {
    await renderParent()
    expect(screen.getByText('2 updates recorded')).toBeInTheDocument()
    expect(screen.getByText('Showed great leadership during group activity today.')).toBeInTheDocument()
    expect(screen.queryByText('Reading short sentences with support.')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '+ 1 more observation →' }))
    expect(screen.getByText('Reading short sentences with support.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Show latest ↑' }))
    expect(screen.queryByText('Reading short sentences with support.')).not.toBeInTheDocument()
  })

  it('lists authorised pickups, this week, and how to reach the teacher', async () => {
    await renderParent()
    expect(screen.getByText('(you)').closest('p')).toHaveTextContent('Fatima Petersen (you)')
    expect(screen.getByText('Ahmed Petersen')).toBeInTheDocument()
    expect(screen.getByText('Collected by Zainab Hendricks · 17:00')).toBeInTheDocument()
    expect(screen.getByText('Absent')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'nkosi@iylh.org' })).toHaveAttribute('href', 'mailto:nkosi@iylh.org')
    expect(screen.queryByText(/021 000 1234/)).not.toBeInTheDocument()
  })

  it('switches between children', async () => {
    onApi('GET', '/guardian/children', [...CHILDREN, { learner_id: 9, first_name: 'Lwazi', last_name: 'Mthembu' }])
    onApi('GET', '/guardian/children/9/overview', {
      ...AISHA_OVERVIEW,
      child: { ...AISHA_OVERVIEW.child, learnerId: 9, firstName: 'Lwazi', lastName: 'Mthembu', name: 'Lwazi Mthembu', className: 'Orange', gradeRange: 'Gr R' },
    })
    await renderParent()
    await userEvent.click(screen.getByRole('tab', { name: 'Lwazi' }))
    expect(await screen.findByText('Lwazi Mthembu')).toBeInTheDocument()
    expect(screen.getByText('Gr R · Orange')).toBeInTheDocument()
  })

  it('explains when the account is not linked to a learner', async () => {
    onApi('GET', '/guardian/children', [])
    await signInAs('guardian')
    render(<MemoryRouter><ParentHome /></MemoryRouter>)
    expect(await screen.findByText(/isn't linked to a learner yet/)).toBeInTheDocument()
  })
})

describe('Add Authorised Pickup', () => {
  const open = () => userEvent.click(screen.getByRole('button', { name: '+ Add Person' }))
  const dialog = () => screen.getByRole('dialog', { name: 'Add Authorised Pickup' })

  it('opens the form, with Submit disabled until the required fields are filled', async () => {
    await renderParent()
    await open()
    expect(within(dialog()).getByText(/This person will be allowed to collect Aisha/)).toBeInTheDocument()
    expect(within(dialog()).queryByText(/ID NUMBER/)).not.toBeInTheDocument()
    const submit = within(dialog()).getByRole('button', { name: 'Submit Request' })
    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByLabelText('FULL NAME *'), 'Zainab Hendricks')
    await userEvent.type(screen.getByLabelText('RELATIONSHIP TO CHILD *'), 'Aunt')
    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByLabelText('CONTACT NUMBER *'), '072 345 6789')
    expect(submit).toBeEnabled()
  })

  it('adds the person, with the walk-home permission, and refreshes the list', async () => {
    onApi('POST', '/guardian/children/3/pickups', { guardianId: 7, fullName: 'Zainab Hendricks', relationship: 'Aunt', isPrimaryContact: false, isYou: false })
    await renderParent()
    await open()
    await userEvent.type(screen.getByLabelText('FULL NAME *'), '  Zainab Hendricks ')
    await userEvent.type(screen.getByLabelText('RELATIONSHIP TO CHILD *'), 'Aunt')
    await userEvent.type(screen.getByLabelText('CONTACT NUMBER *'), '072 345 6789')
    await userEvent.click(screen.getByLabelText(/Aisha may walk home alone/))

    onApi('GET', '/guardian/children/3/overview', {
      ...AISHA_OVERVIEW,
      child: { ...AISHA_OVERVIEW.child, canWalkHomeAlone: true },
      pickups: [...AISHA_OVERVIEW.pickups, { guardianId: 7, fullName: 'Zainab Hendricks', relationship: 'Aunt', isPrimaryContact: false, isYou: false }],
    })
    await userEvent.click(screen.getByRole('button', { name: 'Submit Request' }))

    expect(apiClient.post).toHaveBeenCalledWith('/guardian/children/3/pickups', {
      fullName: 'Zainab Hendricks', relationship: 'Aunt', contactNumber: '072 345 6789', canWalkHomeAlone: true,
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Zainab Hendricks can now collect Aisha.')
    expect(await screen.findByText('May walk home alone')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the server message and keeps the form open (e.g. already on the list)', async () => {
    onApi('POST', '/guardian/children/3/pickups', new ApiError('Ahmed Petersen is already on the pickup list.', 409))
    await renderParent()
    await open()
    await userEvent.type(screen.getByLabelText('FULL NAME *'), 'Ahmed Petersen')
    await userEvent.type(screen.getByLabelText('RELATIONSHIP TO CHILD *'), 'Father')
    await userEvent.type(screen.getByLabelText('CONTACT NUMBER *'), '082')
    await userEvent.click(screen.getByRole('button', { name: 'Submit Request' }))
    expect(await within(dialog()).findByRole('alert')).toHaveTextContent('Ahmed Petersen is already on the pickup list.')
  })

  it('Cancel and Escape close the form without saving', async () => {
    await renderParent()
    await open()
    await userEvent.click(within(dialog()).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await open()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalledWith('/guardian/children/3/pickups', expect.anything())
  })

  it('hides the walk-home tick box when the child already has that permission', async () => {
    onApi('GET', '/guardian/children/3/overview', { ...AISHA_OVERVIEW, child: { ...AISHA_OVERVIEW.child, canWalkHomeAlone: true } })
    await renderParent()
    await open()
    expect(screen.queryByLabelText(/may walk home alone/)).not.toBeInTheDocument()
  })
})

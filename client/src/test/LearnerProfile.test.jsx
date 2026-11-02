// The staff learner profile shows the learner's real records from
// GET /learners/:id/overview (it used to show the same placeholder parent,
// pickups, 94% attendance and observations for every learner), and teachers
// save observations through the API.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Observations from '../pages/Observations'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { CLASSES, LEARNERS, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const OVERVIEW = {
  learnerId: 11,
  canWalkHomeAlone: false,
  attendance: { periodDays: 30, presentDays: 3, markedDays: 4, percent: 75 },
  recent: [
    { date: '2026-10-29', status: 'present', timeIn: '14:05', signedOut: { timeOut: '16:42', collectedBy: 'Grace Petersen' } },
    { date: '2026-10-28', status: 'absent', timeIn: null, signedOut: null },
    { date: '2026-10-27', status: 'present', timeIn: '14:10', signedOut: { timeOut: '16:00', collectedBy: 'Walked home alone' } },
  ],
  pickups: [
    { guardianId: 1, fullName: 'Grace Petersen', relationship: 'Mother', isPrimaryContact: true },
    { guardianId: 2, fullName: 'Sam Petersen', relationship: 'Uncle', isPrimaryContact: false },
  ],
  observations: [
    { observationId: 9, date: '2026-10-20', category: 'Social', rating: 8, notes: 'Kind to others at break.', teacherName: 'Thandeka Nkosi' },
  ],
}

async function openProfile(role = 'teacher') {
  await signInAs(role)
  render(
    <MemoryRouter initialEntries={['/observations?id=11']}>
      <Observations role={role === 'teacher' ? 'Teacher' : 'Manager'} />
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { name: 'Aisha Petersen' })
}

// The profile opens on the Profile tab; these switch tabs.
const openTab = (name) => userEvent.click(screen.getByRole('button', { name: new RegExp(name) }))

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
  onApi('GET', '/learners', LEARNERS)
  onApi('GET', '/learners/11/overview', OVERVIEW)
})

describe('Learner profile (real records)', () => {
  it('opens on the Profile tab', async () => {
    await openProfile()
    expect(screen.getByText('Learner details')).toBeInTheDocument()
    expect(await screen.findByText('👤 Grace Petersen')).toBeInTheDocument()
    expect(screen.queryByText('Kind to others at break.')).not.toBeInTheDocument() // Observations tab
  })

  it('shows the real attendance percentage and observation count, and none of the old placeholders', async () => {
    await openProfile()
    await openTab('Observations')
    expect(await screen.findByText('75%')).toBeInTheDocument()
    expect(screen.queryByText('94%')).not.toBeInTheDocument()
    expect(screen.getByText('Kind to others at break.')).toBeInTheDocument()
    expect(screen.getByText('8/10')).toBeInTheDocument()
    expect(screen.getByText('— Thandeka Nkosi')).toBeInTheDocument()
    expect(screen.queryByText(/Showed great leadership/)).not.toBeInTheDocument()
  })

  it("lists the learner's real pickups, with no contact details or made-up notes", async () => {
    await openProfile()
    expect(await screen.findByText('👤 Grace Petersen')).toBeInTheDocument()
    expect(screen.getByText('👤 Sam Petersen')).toBeInTheDocument()
    expect(screen.getByText('Primary contact')).toBeInTheDocument()
    expect(screen.getByText('🚫 Not allowed to walk home alone')).toBeInTheDocument()
    for (const placeholder of [/Fatima/, /072 345 6789/, /Kloof Street/, /peanut allergy/, /Zainab/]) {
      expect(screen.queryByText(placeholder)).not.toBeInTheDocument()
    }
  })

  it('shows the recent days with who collected the learner', async () => {
    await openProfile()
    await openTab('Attendance')
    expect(await screen.findByText('Present 3 of 4 marked days in the last 30 days')).toBeInTheDocument()
    expect(screen.getByText('Signed out by Grace Petersen at 16:42')).toBeInTheDocument()
    expect(screen.getByText('Absent')).toBeInTheDocument()
    expect(screen.getByText('Walked home alone at 16:00')).toBeInTheDocument()
  })

  it('shows "—" rather than a made-up percentage when nothing has been marked', async () => {
    onApi('GET', '/learners/11/overview', { ...OVERVIEW, attendance: { ...OVERVIEW.attendance, percent: null, markedDays: 0, presentDays: 0 }, recent: [], observations: [] })
    await openProfile()
    await openTab('Observations')
    expect(await screen.findByText('No observations recorded yet.')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('shows an error if the records cannot be loaded', async () => {
    onApi('GET', '/learners/11/overview', new ApiError('Server unavailable', 503))
    await openProfile()
    expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable')
  })
})

describe('Adding an observation', () => {
  it('a teacher saves it through the API and the list reloads', async () => {
    onApi('POST', '/observations', { observation_id: 10 })
    await openProfile()
    await openTab('Observations')
    await screen.findByText('Kind to others at break.')

    await userEvent.click(screen.getByRole('button', { name: '+ Add Observation' }))
    await userEvent.click(screen.getByRole('button', { name: 'Creative' }))
    await userEvent.type(screen.getByLabelText('Observation'), 'Painted a lovely picture.')
    await userEvent.click(within(screen.getByRole('group', { name: 'Rating' })).getByRole('button', { name: '7' }))

    onApi('GET', '/learners/11/overview', {
      ...OVERVIEW,
      observations: [
        { observationId: 10, date: '2026-10-29', category: 'Creative', rating: 7, notes: 'Painted a lovely picture.', teacherName: 'Thandeka Nkosi' },
        ...OVERVIEW.observations,
      ],
    })
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(apiClient.post).toHaveBeenCalledWith('/observations', {
      learnerId: 11, category: 'Creative', rating: 7, notes: 'Painted a lovely picture.',
    })
    expect(await screen.findByText('Painted a lovely picture.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  })

  it('asks for a rating before saving', async () => {
    await openProfile()
    await openTab('Observations')
    await userEvent.click(await screen.findByRole('button', { name: '+ Add Observation' }))
    await userEvent.type(screen.getByLabelText('Observation'), 'Helped tidy up.')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a rating from 1 to 10.')
    expect(apiClient.post).not.toHaveBeenCalledWith('/observations', expect.anything())
  })

  it('managers can read observations but not add them (the API is teacher-only)', async () => {
    await openProfile('manager')
    await openTab('Observations')
    expect(await screen.findByText('Kind to others at break.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+ Add Observation' })).not.toBeInTheDocument()
  })
})

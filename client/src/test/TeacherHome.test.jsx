// Teacher home: real totals for the teacher's own class, which follow the
// manager's changes (learners added or moved) and today's attendance.
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Home from '../pages/Home'
import { dataBus } from '../services/dataBus'
import { onApi, resetApi } from './api-mock'
import { CLASSES, LEARNERS, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

// Ms Nkosi (the signed-in teacher) leads Yellow (class 1): Aisha (11) and Liam (12).
const SIGN_OUTS = {
  date: '2026-10-05',
  learners: [
    { learnerId: 11, name: 'Aisha Petersen', className: 'Yellow', signedOut: { timeOut: '17:00', collectedBy: 'Fatima Petersen' } },
    { learnerId: 13, name: 'Zoe Ntombela', className: 'Green', signedOut: { timeOut: '16:30', collectedBy: 'Grace Ntombela' } },
  ],
}

async function renderHome() {
  await signInAs('teacher')
  render(<MemoryRouter><Home /></MemoryRouter>)
}

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
  onApi('GET', '/learners', LEARNERS)
  onApi('GET', '/attendance/class/1', [
    { record_id: 1, learner_id: 11, status: 'present' },
    { record_id: 2, learner_id: 12, status: 'absent' },
  ])
  onApi('GET', '/signout/today', SIGN_OUTS)
})

// The stat card with this label (icon, number, progress bar, label).
const stat = (label) => screen.getByText(label).closest('[data-stat]')

describe('Teacher home', () => {
  it("shows today's real totals for the teacher's class", async () => {
    await renderHome()
    expect(await screen.findByText('Yellow class • 1 of 2 present')).toBeInTheDocument()
    expect(stat('Present')).toHaveTextContent('1')
    expect(stat('Absent')).toHaveTextContent('1')
    expect(stat('Signed out')).toHaveTextContent('1') // Zoe is in Green, not counted
    expect(screen.getByText('2 learners in your class')).toBeInTheDocument()
    expect(screen.getByText('Aisha Petersen signed out')).toBeInTheDocument()
    expect(screen.getByText('Collected by Fatima Petersen')).toBeInTheDocument()
    expect(screen.queryByText('Zoe Ntombela signed out')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/, Ms! 👋$/)
    expect(screen.queryByText(/Thandi|29 July/)).not.toBeInTheDocument()
  })

  it('counts learners not marked yet', async () => {
    onApi('GET', '/attendance/class/1', [])
    await renderHome()
    expect(await screen.findByText('Yellow class • 0 of 2 present')).toBeInTheDocument()
    expect(screen.getByText('2 learners in your class • 2 not marked yet')).toBeInTheDocument()
    expect(screen.getByText('0 of 2 marked')).toBeInTheDocument()
  })

  it('picks up a learner the manager added or moved into the class (on returning to the tab)', async () => {
    await renderHome()
    await screen.findByText('Yellow class • 1 of 2 present')

    // The manager moves Zoe into Yellow and a teacher marks her absent.
    onApi('GET', '/learners', LEARNERS.map((l) => (l.learner_id === 13 ? { ...l, class_id: 1, class_name: 'Yellow' } : l)))
    onApi('GET', '/attendance/class/1', [
      { record_id: 1, learner_id: 11, status: 'present' },
      { record_id: 2, learner_id: 12, status: 'absent' },
      { record_id: 3, learner_id: 13, status: 'absent' },
    ])
    await act(async () => { fireEvent.focus(window) })

    expect(await screen.findByText('Yellow class • 1 of 3 present')).toBeInTheDocument()
    expect(stat('Absent')).toHaveTextContent('2')
    expect(screen.getByText('3 learners in your class')).toBeInTheDocument()
  })

  it('updates after attendance is saved', async () => {
    onApi('GET', '/attendance/class/1', [])
    await renderHome()
    await screen.findByText('Yellow class • 0 of 2 present')

    onApi('GET', '/attendance/class/1', [
      { record_id: 1, learner_id: 11, status: 'absent' },
      { record_id: 2, learner_id: 12, status: 'present' },
    ])
    await act(async () => { dataBus.emit('classes') }) // what the Attendance page sends after saving

    expect(await screen.findByText('Yellow class • 1 of 2 present')).toBeInTheDocument()
    expect(stat('Absent')).toHaveTextContent('1')
    expect(screen.getByText('Complete: 1 present, 1 absent')).toBeInTheDocument()
  })

  it('prompts the teacher to take attendance until everyone is marked', async () => {
    onApi('GET', '/attendance/class/1', [])
    await signInAs('teacher')
    render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/attendance" element={<p>attendance page</p>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Attendance not taken yet')).toBeInTheDocument()
    expect(screen.getByText('2 learners still to mark')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mark now' }))
    expect(screen.getByText('attendance page')).toBeInTheDocument()
  })

  it('says "not finished" when only some are marked, and hides the prompt once complete', async () => {
    onApi('GET', '/attendance/class/1', [{ record_id: 1, learner_id: 11, status: 'present' }])
    await renderHome()
    expect(await screen.findByText('Attendance not finished')).toBeInTheDocument()
    expect(screen.getByText('1 learner still to mark')).toBeInTheDocument()

    onApi('GET', '/attendance/class/1', [
      { record_id: 1, learner_id: 11, status: 'present' },
      { record_id: 2, learner_id: 12, status: 'absent' },
    ])
    await act(async () => { dataBus.emit('classes') })
    expect(await screen.findByText('Complete: 1 present, 1 absent')).toBeInTheDocument()
    expect(screen.queryByText(/Attendance not (taken|finished)/)).not.toBeInTheDocument()
  })

  it('"Still here" counts present learners not yet collected', async () => {
    onApi('GET', '/attendance/class/1', [
      { record_id: 1, learner_id: 11, status: 'present' },
      { record_id: 2, learner_id: 12, status: 'present' },
    ])
    await renderHome()
    await screen.findByText('Yellow class • 2 of 2 present')
    expect(stat('Still here')).toHaveTextContent('1') // Aisha has gone, Liam is still here
    expect(screen.queryByText('Total learners')).not.toBeInTheDocument()
  })

  it('shows "–" instead of 0s until today\'s attendance has loaded', async () => {
    let finish
    onApi('GET', '/attendance/class/1', () => new Promise((resolve) => { finish = resolve }))
    await renderHome()
    await screen.findByText('Yellow class')
    expect(stat('Present')).toHaveTextContent('–')
    expect(stat('Present')).not.toHaveTextContent('0')
    expect(screen.queryByText('Attendance not taken yet')).not.toBeInTheDocument()

    await act(async () => { finish([{ record_id: 1, learner_id: 11, status: 'present' }]) })
    expect(await screen.findByText('Yellow class • 1 of 2 present')).toBeInTheDocument()
    expect(stat('Present')).toHaveTextContent('1')
  })

  it('says so when the teacher has no class', async () => {
    onApi('GET', '/classes', CLASSES.map((c) => ({ ...c, teacher_id: null, teacher_name: null })))
    await renderHome()
    expect(await screen.findByText("You're not assigned to a class yet")).toBeInTheDocument()
    expect(screen.queryByText('Present')).not.toBeInTheDocument()
  })
})

// Teacher home: real totals for the teacher's own class, which follow the
// manager's changes (learners added or moved) and today's attendance.
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

const stat = (label) => screen.getByText(label).previousElementSibling

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

  it('says so when the teacher has no class', async () => {
    onApi('GET', '/classes', CLASSES.map((c) => ({ ...c, teacher_id: null, teacher_name: null })))
    await renderHome()
    expect(await screen.findByText("You're not assigned to a class yet")).toBeInTheDocument()
    expect(screen.queryByText('Present')).not.toBeInTheDocument()
  })
})

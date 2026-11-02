// #52 — Attendance page: renders, validation, payloads, API errors.
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Attendance from '../pages/Attendance'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { CLASSES, LEARNERS, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

// Each learner is one row in the register list.
const card = (name) => screen.getByText(name).closest('li')

async function renderAs(role, props = {}) {
  await signInAs(role)
  render(
    <MemoryRouter>
      <Attendance {...props} />
    </MemoryRouter>,
  )
  await screen.findByText('Aisha Petersen')
}

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
  onApi('GET', '/learners', LEARNERS)
  onApi('GET', '/attendance/class/1', [])
  onApi('GET', '/attendance/class/2', [])
})

// Ms Nkosi (the signed-in teacher) leads Yellow, so the page opens there.
const showAll = () => userEvent.click(screen.getByRole('button', { name: 'All' }))

describe('Attendance (teacher)', () => {
  it("opens on the teacher's own class", async () => {
    await renderAs('teacher')
    expect(screen.getByText('2 learners')).toBeInTheDocument()
    expect(screen.getByText('Aisha Petersen')).toBeInTheDocument()
    expect(screen.queryByText('Zoe Ntombela')).not.toBeInTheDocument() // Green
    expect(screen.getByText('0 / 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark all present' })).toBeInTheDocument()
  })

  it('renders active learners only, with class filters and zero counts', async () => {
    await renderAs('teacher')
    await showAll()
    expect(screen.getByText('Liam Botha')).toBeInTheDocument()
    expect(screen.getByText('Zoe Ntombela')).toBeInTheDocument()
    expect(screen.queryByText('Gone Away')).not.toBeInTheDocument()
    expect(screen.getByText('3 learners')).toBeInTheDocument()
    for (const name of ['All', 'Yellow', 'Green']) expect(screen.getByRole('button', { name })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Attendance' })).toBeEnabled()
  })

  it('filters by class', async () => {
    await renderAs('teacher')
    await userEvent.click(screen.getByRole('button', { name: 'Green' }))
    expect(screen.queryByText('Aisha Petersen')).not.toBeInTheDocument()
    expect(screen.getByText('Zoe Ntombela')).toBeInTheDocument()
    expect(screen.getByText('1 learners')).toBeInTheDocument()
  })

  it('class view shows "present / total" and marks everyone in the class with All ✓', async () => {
    onApi('POST', '/attendance', (body) => ({ record_id: body.learnerId + 100, ...body }))
    await renderAs('teacher')
    await showAll()
    // "All" uses the same summary card, but without All ✓ / Clear.
    expect(screen.getByText('0 / 3')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark all present' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Yellow' }))
    expect(screen.getByText('0 / 2')).toBeInTheDocument()
    expect(screen.getByText('learners present')).toBeInTheDocument()
    // The summary card is outlined in the class's own colour (Yellow).
    expect(screen.getByTestId('class-summary').style.borderColor).toMatch(/#FDE047|rgb\(253, 224, 71\)/i)

    await userEvent.click(screen.getByRole('button', { name: 'Mark all present' }))
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save Attendance' }))

    expect(await screen.findByText('Attendance saved')).toBeInTheDocument()
    const posts = apiClient.post.mock.calls.filter(([path]) => path === '/attendance').map(([, body]) => body)
    expect(posts).toEqual(
      expect.arrayContaining([
        { learnerId: 11, classId: 1, status: 'present' },
        { learnerId: 12, classId: 1, status: 'present' },
      ]),
    )
    expect(posts).toHaveLength(2) // Green's learner was not touched
  })

  it('Clear undoes unsaved choices in the class view', async () => {
    await renderAs('teacher')
    await userEvent.click(screen.getByRole('button', { name: 'Yellow' }))
    await userEvent.click(within(card('Aisha Petersen')).getByRole('button', { name: 'Absent' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mark all present' }))
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByText('0 / 2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save Attendance' }))
    expect(screen.getByText('Nothing new to save. Mark learners present or absent first.')).toBeInTheDocument()
  })

  it('shows a validation message when saving with nothing marked, and calls no API', async () => {
    await renderAs('teacher')
    await userEvent.click(screen.getByRole('button', { name: 'Save Attendance' }))
    expect(screen.getByText('Nothing new to save. Mark learners present or absent first.')).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalledWith('/attendance', expect.anything())
  })

  it('submits one POST per marked learner with the right payload', async () => {
    onApi('POST', '/attendance', (body) => ({ record_id: body.learnerId + 100, ...body }))
    await renderAs('teacher')
    await showAll()

    await userEvent.click(within(card('Aisha Petersen')).getByRole('button', { name: 'Present' }))
    await userEvent.click(within(card('Zoe Ntombela')).getByRole('button', { name: 'Absent' }))
    expect(screen.getByText('1 / 3')).toBeInTheDocument() // 1 present out of 3
    expect(screen.getByText(/1 absent/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save Attendance' }))

    expect(await screen.findByText('Attendance saved')).toBeInTheDocument()
    const posts = apiClient.post.mock.calls.filter(([path]) => path === '/attendance').map(([, body]) => body)
    expect(posts).toEqual(
      expect.arrayContaining([
        { learnerId: 11, classId: 1, status: 'present' },
        { learnerId: 13, classId: 2, status: 'absent' },
      ]),
    )
    expect(posts).toHaveLength(2)
  })

  it('PATCHes a learner who already has a saved record instead of POSTing again', async () => {
    onApi('GET', '/attendance/class/1', [{ record_id: 501, learner_id: 11, status: 'present' }])
    onApi('PATCH', '/attendance/501', { record_id: 501, status: 'absent' })
    await renderAs('teacher')

    await userEvent.click(within(card('Aisha Petersen')).getByRole('button', { name: 'Absent' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save Attendance' }))

    await screen.findByText('Attendance saved')
    expect(apiClient.patch).toHaveBeenCalledWith('/attendance/501', { status: 'absent' })
    expect(apiClient.post).not.toHaveBeenCalledWith('/attendance', expect.anything())
  })

  it('shows the API error (e.g. 409 duplicate) and keeps the unsaved mark for a retry', async () => {
    onApi('POST', '/attendance', new ApiError('Attendance has already been recorded for this learner today', 409))
    await renderAs('teacher')

    await userEvent.click(within(card('Aisha Petersen')).getByRole('button', { name: 'Present' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save Attendance' }))

    expect(
      await screen.findByText('1 of 1 could not be saved. Attendance has already been recorded for this learner today'),
    ).toBeInTheDocument()
    // still pending: saving again retries the same learner
    onApi('POST', '/attendance', { record_id: 900 })
    await userEvent.click(screen.getByRole('button', { name: 'Save Attendance' }))
    expect(await screen.findByText('Attendance saved')).toBeInTheDocument()
  })

  it('reports partial failures with a count', async () => {
    onApi('POST', '/attendance', (body) =>
      body.learnerId === 12 ? new ApiError('Learner not found', 404) : { record_id: 1 },
    )
    await renderAs('teacher')
    await userEvent.click(within(card('Aisha Petersen')).getByRole('button', { name: 'Present' }))
    await userEvent.click(within(card('Liam Botha')).getByRole('button', { name: 'Present' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save Attendance' }))
    expect(await screen.findByText('1 of 2 could not be saved. Learner not found')).toBeInTheDocument()
  })

  it("shows a load error when today's attendance cannot be fetched", async () => {
    onApi('GET', '/attendance/class/1', new ApiError('Server error', 500))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await renderAs('teacher')
    expect(await screen.findByText(/Could not load today's saved attendance/)).toBeInTheDocument()
  })
})

describe('Attendance (manager, read-only)', () => {
  it('shows statuses but no Present/Absent buttons and no Save', async () => {
    onApi('GET', '/attendance/class/1', [{ record_id: 501, learner_id: 11, status: 'present' }])
    await renderAs('manager', { role: 'Manager' })
    expect(screen.getByText('3 learners • view only')).toBeInTheDocument()
    await waitFor(() => expect(within(card('Aisha Petersen')).getByText('Present')).toBeInTheDocument())
    expect(within(card('Liam Botha')).getByText('Not marked yet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Present' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save Attendance' })).not.toBeInTheDocument()
  })
})

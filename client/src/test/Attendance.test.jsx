// #52 — Attendance page: renders, validation, payloads, API errors.
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Attendance from '../pages/Attendance'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { CLASSES, LEARNERS, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const card = (name) => screen.getByText(name).closest('div.bg-white')

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

describe('Attendance (teacher)', () => {
  it('renders active learners only, with class filters and zero counts', async () => {
    await renderAs('teacher')
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

  it('shows a validation message when saving with nothing marked, and calls no API', async () => {
    await renderAs('teacher')
    await userEvent.click(screen.getByRole('button', { name: 'Save Attendance' }))
    expect(screen.getByText('Nothing new to save. Mark learners present or absent first.')).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalledWith('/attendance', expect.anything())
  })

  it('submits one POST per marked learner with the right payload', async () => {
    onApi('POST', '/attendance', (body) => ({ record_id: body.learnerId + 100, ...body }))
    await renderAs('teacher')

    await userEvent.click(within(card('Aisha Petersen')).getByRole('button', { name: 'Present' }))
    await userEvent.click(within(card('Zoe Ntombela')).getByRole('button', { name: 'Absent' }))
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2) // present 1, absent 1
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

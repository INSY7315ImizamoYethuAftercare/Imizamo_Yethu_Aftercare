// Learners page: managers can deactivate, reactivate and delete a learner;
// a deactivated learner stays listed, greyed out, and can't be opened.
// (These buttons were once lost in a merge, so this guards them.)
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Learners from '../pages/Learners'
import { apiClient, onApi, resetApi } from './api-mock'
import { CLASSES, LEARNERS, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

// LEARNERS: Aisha Petersen (11, active) ... Gone Away (14, deactivated).
const AISHA = LEARNERS.find((l) => l.learner_id === 11)

async function renderLearners(role) {
  await signInAs(role)
  const pageRole = role === 'teacher' ? 'Teacher' : 'Manager'
  const profile = role === 'teacher' ? '/observations' : '/manager/observations'
  render(
    <MemoryRouter initialEntries={['/learners']}>
      <Routes>
        <Route path="/learners" element={<Learners role={pageRole} />} />
        <Route path={profile} element={<p>learner profile</p>} />
      </Routes>
    </MemoryRouter>,
  )
  await screen.findByText('Aisha Petersen')
}

// The confirmation sheet's own button (not the row's icon button).
const confirm = (name) => userEvent.click(screen.getAllByRole('button', { name }).at(-1))

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
  onApi('GET', '/learners', LEARNERS)
})

describe('Learners page, as a manager', () => {
  it('shows a deactivated learner greyed out with a badge, and it cannot be opened', async () => {
    await renderLearners('manager')
    const gone = screen.getByRole('button', { name: /^Gone Away/ })
    expect(gone).toBeDisabled()
    expect(within(gone).getByText('Deactivated')).toBeInTheDocument()
    expect(within(screen.getByRole('button', { name: /^Aisha Petersen/ })).queryByText('Deactivated')).not.toBeInTheDocument()
  })

  it('deactivates a learner after confirming', async () => {
    onApi('PATCH', `/learners/${AISHA.learner_id}`, { ...AISHA, is_active: false })
    await renderLearners('manager')
    await userEvent.click(screen.getByRole('button', { name: 'Deactivate Aisha Petersen' }))
    expect(screen.getByRole('heading', { name: 'Deactivate Learner?' })).toBeInTheDocument()
    await confirm('Deactivate')

    expect(apiClient.patch).toHaveBeenCalledWith(`/learners/${AISHA.learner_id}`, { isActive: false })
    expect(await screen.findByRole('button', { name: 'Reactivate Aisha Petersen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Aisha Petersen/ })).toBeDisabled()
  })

  it('reactivates a deactivated learner', async () => {
    onApi('PATCH', '/learners/14', { ...LEARNERS.find((l) => l.learner_id === 14), is_active: true })
    await renderLearners('manager')
    await userEvent.click(screen.getByRole('button', { name: 'Reactivate Gone Away' }))
    await confirm('Reactivate')

    expect(apiClient.patch).toHaveBeenCalledWith('/learners/14', { isActive: true })
    expect(await screen.findByRole('button', { name: 'Deactivate Gone Away' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Gone Away/ })).toBeEnabled()
  })

  it('cancelling the confirmation changes nothing', async () => {
    await renderLearners('manager')
    await userEvent.click(screen.getByRole('button', { name: 'Deactivate Aisha Petersen' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(apiClient.patch).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: 'Deactivate Learner?' })).not.toBeInTheDocument()
  })

  it('deletes a learner after confirming', async () => {
    onApi('DELETE', `/learners/${AISHA.learner_id}`, {})
    await renderLearners('manager')
    await userEvent.click(screen.getByRole('button', { name: 'Delete Aisha Petersen' }))
    await confirm('🗑 Delete')

    expect(apiClient.delete).toHaveBeenCalledWith(`/learners/${AISHA.learner_id}`)
    expect(screen.queryByText('Aisha Petersen')).not.toBeInTheDocument()
  })

  it('opens an active learner', async () => {
    await renderLearners('manager')
    await userEvent.click(screen.getByRole('button', { name: /^Aisha Petersen/ }))
    expect(await screen.findByText('learner profile')).toBeInTheDocument()
  })
})

describe('Learners page, as a teacher', () => {
  it('has no deactivate, reactivate or delete buttons', async () => {
    await renderLearners('teacher')
    expect(screen.queryByRole('button', { name: /^(Deactivate|Reactivate|Delete) / })).not.toBeInTheDocument()
  })

  it('still lists a deactivated learner, greyed out and locked', async () => {
    await renderLearners('teacher')
    const gone = screen.getByRole('button', { name: /^Gone Away/ })
    expect(gone).toBeDisabled()
    expect(within(gone).getByText('Deactivated')).toBeInTheDocument()
  })
})

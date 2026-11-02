// Manager / admin Settings: only things that really save. The old School
// year, Terms and Class groups sections only showed a "saved" message and
// changed nothing, so they were removed; classes are managed on Classes.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Settings from '../pages/Settings'
import { onApi, resetApi } from './api-mock'
import { CLASSES, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

async function renderSettings(role, pageRole) {
  await signInAs(role)
  render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/settings" element={<Settings role={pageRole} />} />
        <Route path="/manager/classes" element={<p>classes page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
})

describe('Settings', () => {
  it('has no school year, terms or class group sections', async () => {
    await renderSettings('manager', 'Manager')
    for (const heading of ['School year', 'Terms', 'Class groups']) {
      expect(screen.queryByRole('heading', { name: heading })).not.toBeInTheDocument()
    }
    expect(screen.getByRole('form', { name: 'Change password' })).toBeInTheDocument()
  })

  it('sends a manager to the Classes page to manage classes', async () => {
    await renderSettings('manager', 'Manager')
    await userEvent.click(screen.getByRole('button', { name: 'Manage classes →' }))
    expect(screen.getByText('classes page')).toBeInTheDocument()
  })

  it("doesn't offer classes to a standard admin (they can't open that page)", async () => {
    await renderSettings('admin', 'Admin')
    expect(screen.queryByRole('button', { name: 'Manage classes →' })).not.toBeInTheDocument()
  })
})

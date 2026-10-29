// Logging out from every place that offers it. The Settings pages used to
// only navigate to "/", leaving the session cookie valid, so the sign-in page
// sent the user straight back to their home page: admins, managers and
// guardians could not log out.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MoreMenu from '../components/MoreMenu'
import Login from '../pages/Login'
import ParentSettings from '../pages/ParentSettings'
import Settings from '../pages/Settings'
import TeacherSettings from '../pages/TeacherSettings'
import { apiClient, onApi, resetApi } from './api-mock'
import { CLASSES, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

function renderAt(path, element) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<p>teacher home</p>} />
        <Route path="/manager" element={<p>manager home</p>} />
        <Route path="/admin" element={<p>admin home</p>} />
        <Route path="/parent" element={<p>parent home</p>} />
        <Route path={path} element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

async function expectLoggedOut() {
  // The sign-in form stays up, rather than bouncing back to a home page.
  expect(await screen.findByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  expect(screen.queryByText(/home$/)).not.toBeInTheDocument()
  expect(apiClient.post).toHaveBeenCalledWith('/auth/logout')
}

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
})

describe('Log out button on the Settings page', () => {
  it.each([
    ['admin', '/admin/settings', 'Admin'],
    ['manager', '/settings', 'Manager'],
  ])('logs a %s out', async (role, path, label) => {
    await signInAs(role)
    renderAt(path, <Settings role={label} />)
    apiClient.post.mockClear()
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
    await expectLoggedOut()
  })

  it('logs a teacher out from Teacher settings', async () => {
    await signInAs('teacher')
    renderAt('/teacher/settings', <TeacherSettings />)
    apiClient.post.mockClear()
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
    await expectLoggedOut()
  })

  it('logs a guardian out from Parent settings', async () => {
    await signInAs('guardian')
    renderAt('/parent/settings', <ParentSettings />)
    apiClient.post.mockClear()
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
    await expectLoggedOut()
  })
})

describe('Log out in the ⋮ menu', () => {
  it('logs a manager out', async () => {
    await signInAs('manager')
    renderAt('/manager/attendance', <MoreMenu />)
    apiClient.post.mockClear()
    await userEvent.click(screen.getByRole('button', { name: '⋮' }))
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
    await expectLoggedOut()
  })
})

// The teacher's Settings page, the ⋮ menu's Settings link, and choosing your
// own password after a master admin reset a forgotten one.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MoreMenu from '../components/MoreMenu'
import ChoosePassword from '../pages/ChoosePassword'
import TeacherSettings from '../pages/TeacherSettings'
import { apiClient, onApi, resetApi } from './api-mock'
import { CLASSES, USERS, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

function renderAt(path, element) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>sign-in page</p>} />
        <Route path="/home" element={<p>teacher home</p>} />
        <Route path="/teacher/settings" element={<p>teacher settings</p>} />
        <Route path="/settings" element={<p>manager settings</p>} />
        <Route path={path} element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
  onApi('POST', '/auth/logout', { message: 'ok' })
})

describe('⋮ menu', () => {
  it.each([
    ['teacher', '/attendance', 'teacher settings'],
    ['manager', '/manager/escalations', 'manager settings'],
  ])('a %s opens their own Settings page', async (role, path, page) => {
    await signInAs(role)
    renderAt(path, <MoreMenu />)
    await userEvent.click(screen.getByRole('button', { name: '⋮' }))
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByText(page)).toBeInTheDocument()
  })
})

describe('Teacher Settings page', () => {
  beforeEach(async () => {
    await signInAs('teacher')
    renderAt('/teacher/settings-page', <TeacherSettings />)
  })

  it('shows their profile, with name and email changes going through the master admin', () => {
    expect(screen.getByText(USERS.teacher.email)).toBeInTheDocument()
    expect(screen.getByText('To change your name or email, ask the master admin.')).toBeInTheDocument()
  })

  it('changes their password through the server', async () => {
    onApi('POST', '/auth/change-password', { message: 'Password updated', user: USERS.teacher })
    const form = screen.getByRole('form', { name: 'Change password' })
    await userEvent.type(within(form).getByLabelText('Current password'), 'Old-password-1')
    await userEvent.type(within(form).getByLabelText('New password'), 'New-password-1')
    await userEvent.type(within(form).getByLabelText('Confirm new password'), 'New-password-1')
    await userEvent.click(within(form).getByRole('button', { name: 'Update password' }))
    expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'Old-password-1', newPassword: 'New-password-1' })
    expect(await within(form).findByRole('status')).toHaveTextContent("You've been signed out on any other devices.")
  })

  it('logs out', async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(await screen.findByText('sign-in page')).toBeInTheDocument()
  })
})

describe('Choosing a new password after a reset', () => {
  it('asks for the temporary password, then goes home once the new one is saved', async () => {
    await signInAs('resetTeacher')
    const { mustChangePassword, ...cleared } = USERS.resetTeacher
    expect(mustChangePassword).toBe(true)
    onApi('POST', '/auth/change-password', { message: 'Password updated', user: cleared })
    renderAt('/choose-password', <ChoosePassword />)

    expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument()
    const form = screen.getByRole('form', { name: 'Your new password' })
    await userEvent.type(within(form).getByLabelText('Temporary password'), 'Temp-password-1')
    await userEvent.type(within(form).getByLabelText('New password'), 'Their-own-pass-1')
    await userEvent.type(within(form).getByLabelText('Confirm new password'), 'Their-own-pass-1')
    await userEvent.click(within(form).getByRole('button', { name: 'Update password' }))

    expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'Temp-password-1', newPassword: 'Their-own-pass-1' })
    expect(await screen.findByText('teacher home')).toBeInTheDocument()
  })

  it("sends someone who doesn't need it to their home page", async () => {
    await signInAs('teacher')
    renderAt('/choose-password', <ChoosePassword />)
    expect(await screen.findByText('teacher home')).toBeInTheDocument()
  })

  it('can log out instead', async () => {
    await signInAs('resetTeacher')
    renderAt('/choose-password', <ChoosePassword />)
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
    expect(await screen.findByText('sign-in page')).toBeInTheDocument()
  })
})

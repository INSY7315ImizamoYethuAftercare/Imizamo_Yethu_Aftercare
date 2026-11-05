// Manager's Classes page: the Add New Classroom form (name, grade, colour).
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Classes from '../pages/Classes'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { CLASSES, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

const BROWN = { class_id: 6, class_name: 'Brown', grade_range: 'Gr 5-6', colour: '#D8B4FE', teacher_id: null, teacher_name: null, is_active: true, learner_count: 0, active_learner_count: 0, present_today: 0 }

async function openForm(role = 'manager') {
  await signInAs(role)
  render(
    <MemoryRouter>
      <Classes role={role === 'manager' ? 'Manager' : 'Teacher'} />
    </MemoryRouter>,
  )
  await screen.findByText('Yellow')
  if (role !== 'manager') return null
  await userEvent.click(screen.getByRole('button', { name: '+ Add Class' }))
  return screen.getByRole('dialog', { name: 'Add New Classroom' })
}

const classPosts = () => apiClient.post.mock.calls.filter(([path]) => path === '/classes')

beforeEach(() => {
  resetApi()
  onApi('GET', '/classes', CLASSES)
  onApi('GET', '/learners', [])
})

describe('Add New Classroom', () => {
  it('matches the design: name, grade range, 8 colours and a preview', async () => {
    const dialog = await openForm()
    expect(within(dialog).getByText('Create a new class group for your learners')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/CLASS NAME/)).toHaveAttribute('placeholder', 'e.g. Brown, White')

    const grades = within(dialog).getByRole('group', { name: /GRADE RANGE/ })
    expect(within(grades).getAllByRole('button').map((b) => b.textContent)).toEqual(['Gr R', 'Gr 1-2', 'Gr 3-4', 'Gr 5-6', 'Gr 7'])
    expect(within(grades).getByRole('button', { name: 'Gr 1-2' })).toHaveAttribute('aria-pressed', 'true')

    const colours = within(dialog).getByRole('group', { name: 'CLASS COLOUR' })
    expect(within(colours).getAllByRole('button')).toHaveLength(8)
    expect(within(colours).getByRole('button', { name: 'Teal' })).toHaveAttribute('aria-pressed', 'true')

    expect(within(dialog).getByText('Class Name')).toBeInTheDocument() // preview placeholder
    expect(within(dialog).getByRole('button', { name: 'Add Classroom' })).toBeInTheDocument()
  })

  it('the preview follows what is typed and chosen', async () => {
    const dialog = await openForm()
    await userEvent.type(within(dialog).getByLabelText(/CLASS NAME/), 'Brown')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Gr 5-6' }))
    expect(within(dialog).getByText('Brown')).toBeInTheDocument()
    expect(within(dialog).getAllByText('Gr 5-6')).toHaveLength(2) // chip + preview
  })

  it('adds the class with its name, grade and colour, then closes', async () => {
    onApi('POST', '/classes', BROWN)
    const dialog = await openForm()
    await userEvent.type(within(dialog).getByLabelText(/CLASS NAME/), '  Brown ')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Gr 5-6' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Purple' }))
    onApi('GET', '/classes', [...CLASSES, BROWN])
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add Classroom' }))

    expect(classPosts()).toEqual([['/classes', { className: 'Brown', gradeRange: 'Gr 5-6', colour: '#D8B4FE' }]])
    expect(await screen.findByText('Brown')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('offers the active teachers and adds the class with the one picked', async () => {
    onApi('GET', '/teacher', [
      { teacher_id: 2, user_id: 2, full_name: 'Ms Nkosi', contact_email: 'nkosi@iylh.org', is_active: true },
      { teacher_id: 3, user_id: 3, full_name: 'Mr Gone', contact_email: 'gone@iylh.org', is_active: false },
      { teacher_id: 4, user_id: 4, full_name: 'Ms Free', contact_email: 'free@iylh.org', is_active: true },
    ])
    onApi('POST', '/classes', BROWN)
    onApi('PATCH', '/classes/1', {})
    const dialog = await openForm()

    const group = within(dialog).getByRole('group', { name: 'TEACHER' })
    expect(await within(group).findByRole('button', { name: 'Ms Free' })).toBeInTheDocument()
    expect(within(group).queryByRole('button', { name: 'Mr Gone' })).not.toBeInTheDocument()
    expect(within(group).getByRole('button', { name: 'No teacher' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.type(within(dialog).getByLabelText(/CLASS NAME/), 'Brown')
    await userEvent.click(within(group).getByRole('button', { name: 'Ms Free' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add Classroom' }))

    expect(classPosts()).toEqual([['/classes', expect.objectContaining({ className: 'Brown', teacherId: 4 })]])
  })

  it('warns that a teacher who already leads a class will be moved, and moves them', async () => {
    onApi('GET', '/teacher', [{ teacher_id: 2, user_id: 2, full_name: 'Ms Nkosi', contact_email: 'nkosi@iylh.org', is_active: true }])
    onApi('POST', '/classes', BROWN)
    onApi('PATCH', '/classes/1', {})
    const dialog = await openForm()
    await userEvent.type(within(dialog).getByLabelText(/CLASS NAME/), 'Brown')
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Ms Nkosi' }))
    expect(within(dialog).getByText('Ms Nkosi currently leads Yellow. Adding this class will move them here.')).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Add Classroom' }))
    expect(apiClient.patch).toHaveBeenCalledWith('/classes/1', { teacherId: null })
    expect(classPosts()).toEqual([['/classes', expect.objectContaining({ teacherId: 2 })]])
  })

  it.each([
    ['', 'Enter a class name.'],
    ['YELLOW', "There's already a class called YELLOW."],
  ])('checks the name %p before sending', async (name, message) => {
    const dialog = await openForm()
    if (name) await userEvent.type(within(dialog).getByLabelText(/CLASS NAME/), name)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add Classroom' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent(message)
    expect(classPosts()).toHaveLength(0)
  })

  it('shows the server message and stays open if the class is refused', async () => {
    onApi('POST', '/classes', new ApiError('An active class with this name already exists', 409))
    const dialog = await openForm()
    await userEvent.type(within(dialog).getByLabelText(/CLASS NAME/), 'Brown')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add Classroom' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('An active class with this name already exists')
    expect(within(dialog).getByLabelText(/CLASS NAME/)).toHaveValue('Brown')
  })

  it('Cancel and Escape close the form without saving', async () => {
    let dialog = await openForm()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '+ Add Class' }))
    dialog = screen.getByRole('dialog')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(classPosts()).toHaveLength(0)
  })

  it('a class saved with a colour shows that colour in the list', async () => {
    onApi('GET', '/classes', [...CLASSES, BROWN])
    await signInAs('manager')
    render(<MemoryRouter><Classes role="Manager" /></MemoryRouter>)
    const row = (await screen.findByText('Brown')).closest('[role="button"]')
    expect(row.querySelector('span[style]')).toHaveStyle({ backgroundColor: '#D8B4FE' })
  })

  it('teachers do not get the form', async () => {
    await openForm('teacher')
    expect(screen.queryByRole('button', { name: '+ Add Class' })).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const dialog = await openForm()
    expect(await axe(dialog)).toHaveNoViolations()
  })
})

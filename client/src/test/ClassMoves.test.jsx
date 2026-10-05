// Managers moving a learner to another class (learner details), and moving
// a class's learners out before removing it (Classes page).
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Classes from '../pages/Classes'
import Observations from '../pages/Observations'
import { ApiError, apiClient, onApi, resetApi } from './api-mock'
import { CLASSES, LEARNERS, signInAs } from './session-helpers'

vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)

// A tiny fake database, so reloads after a move show the new class.
let learners
let classes

const classById = (id) => classes.find((c) => c.class_id === id)
const count = (id) => learners.filter((l) => l.class_id === id).length

function serveFakeDb() {
  onApi('GET', '/learners', () => learners)
  onApi('GET', '/classes', () =>
    classes.filter((c) => c.is_active).map((c) => ({ ...c, learner_count: count(c.class_id) })),
  )
  for (const l of LEARNERS) {
    onApi('PATCH', `/learners/${l.learner_id}`, (body) => {
      const target = body.classId ? classById(body.classId) : null
      learners = learners.map((row) =>
        row.learner_id === l.learner_id
          ? {
              ...row,
              ...(body.firstName ? { first_name: body.firstName, last_name: body.lastName } : {}),
              ...(body.dateOfBirth !== undefined ? { date_of_birth: body.dateOfBirth } : {}),
              ...(target ? { class_id: target.class_id, class_name: target.class_name, grade_range: target.grade_range } : {}),
            }
          : row,
      )
      return learners.find((row) => row.learner_id === l.learner_id)
    })
  }
  for (const c of CLASSES) {
    onApi('PATCH', `/classes/${c.class_id}/deactivate`, () => {
      if (count(c.class_id) > 0) return new ApiError('Cannot deactivate this class - there are active learners enrolled in it', 409)
      classes = classes.map((row) => (row.class_id === c.class_id ? { ...row, is_active: false } : row))
      return { class_id: c.class_id, is_active: false }
    })
  }
}

const patches = () => apiClient.patch.mock.calls.map(([path, body]) => [path, body])

beforeEach(() => {
  resetApi()
  learners = LEARNERS.map((l) => ({ ...l }))
  classes = CLASSES.map((c) => ({ ...c }))
  serveFakeDb()
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})

describe('Learner details: change class', () => {
  async function openEdit() {
    await signInAs('manager')
    render(
      <MemoryRouter initialEntries={['/manager/learners/profile?id=11']}>
        <Observations role="Manager" />
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { name: 'Aisha Petersen' })
    await userEvent.click(screen.getByRole('button', { name: /Profile/ }))
    expect(screen.getByText('Yellow (Gr 1-2)')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Edit details' }))
  }

  it('lists the classes, starting on the current one', async () => {
    await openEdit()
    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('1')
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Yellow (Gr 1-2)', 'Green (Gr 3-4)'])
  })

  it('moves the learner, and the page shows the new class', async () => {
    await openEdit()
    await userEvent.selectOptions(screen.getByRole('combobox'), '2')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Learner details saved')).toBeInTheDocument()
    expect(patches()).toContainEqual(['/learners/11', { firstName: 'Aisha', lastName: 'Petersen', dateOfBirth: '2018-03-14', classId: 2 }])
    expect(await screen.findByText('Gr 3-4 • Green')).toBeInTheDocument()
    expect(screen.getByText('Green (Gr 3-4)')).toBeInTheDocument()
  })

  it('shows the server message if the move is refused', async () => {
    onApi('PATCH', '/learners/11', new ApiError('Green has been removed. Choose another class.', 409))
    await openEdit()
    await userEvent.selectOptions(screen.getByRole('combobox'), '2')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Green has been removed. Choose another class.')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument() // still editing
  })
})

describe('Classes: remove a class that still has learners', () => {
  async function openRemoveYellow() {
    await signInAs('manager')
    render(
      <MemoryRouter>
        <Classes role="Manager" />
      </MemoryRouter>,
    )
    await screen.findByText('Yellow')
    await userEvent.click(screen.getByRole('button', { name: 'Remove Yellow' }))
    return screen.getByRole('dialog', { name: 'Remove Yellow' })
  }

  it('asks where to move them, with Move & remove disabled until a class is chosen', async () => {
    const dialog = await openRemoveYellow()
    expect(within(dialog).getByText('2 learners are still in this class. Move them to another class first.')).toBeInTheDocument()
    const options = within(dialog).getAllByRole('option').map((o) => o.textContent)
    expect(options).toEqual(['Choose a class', 'Green (Gr 3-4)'])
    expect(within(dialog).getByRole('button', { name: 'Move & remove' })).toBeDisabled()
  })

  it('moves every learner, then removes the class', async () => {
    const dialog = await openRemoveYellow()
    await userEvent.selectOptions(within(dialog).getByRole('combobox'), '2')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move & remove' }))

    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(patches()).toEqual([
      ['/learners/11', { classId: 2 }],
      ['/learners/12', { classId: 2 }],
      ['/classes/1/deactivate', undefined],
    ])
    expect(screen.queryByText('Yellow')).not.toBeInTheDocument()
    expect(learners.filter((l) => l.class_id === 2)).toHaveLength(4)
  })

  it('keeps the class if a move fails, and says why', async () => {
    onApi('PATCH', '/learners/12', new ApiError('Something went wrong', 500))
    const dialog = await openRemoveYellow()
    await userEvent.selectOptions(within(dialog).getByRole('combobox'), '2')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move & remove' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Something went wrong')
    expect(patches().map(([path]) => path)).not.toContain('/classes/1/deactivate')
    expect(screen.getByText('Yellow')).toBeInTheDocument()
  })

  it('a class with no learners is removed straight away, as before', async () => {
    learners = learners.filter((l) => l.class_id !== 2)
    await signInAs('manager')
    render(<MemoryRouter><Classes role="Manager" /></MemoryRouter>)
    await screen.findByText('Green')
    await userEvent.click(screen.getByRole('button', { name: 'Remove Green' }))
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await vi.waitFor(() => expect(screen.queryByText('Green')).not.toBeInTheDocument())
  })
})

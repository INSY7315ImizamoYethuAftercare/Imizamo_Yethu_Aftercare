// Signs a fake user in through the real session store (with the API mocked),
// which also empties the shared class/learner stores between tests.
import { act } from '@testing-library/react'
import { login, logout } from '../services/session'
import { onApi } from './api-mock'

export const USERS = {
  teacher: { userId: 2, email: 'nkosi@iylh.org', role: 'teacher', fullName: 'Ms Nkosi' },
  manager: { userId: 1, email: 'sarah@iylh.org', role: 'manager', fullName: 'Sarah Botha' },
  admin: { userId: 3, email: 'admin@iylh.org', role: 'admin', accessLevel: 'standard', fullName: 'Ada Admin' },
  // A master admin uses the manager's pages (see appRoleOf in session.js).
  masterAdmin: { userId: 5, email: 'master@iylh.org', role: 'admin', accessLevel: 'master', fullName: 'Nomvula Dube' },
  guardian: { userId: 4, email: 'fatima@example.com', role: 'guardian', fullName: 'Fatima Petersen' },
}

export async function signInAs(role) {
  onApi('POST', '/auth/login', { user: USERS[role] })
  onApi('POST', '/auth/logout', { message: 'ok' })
  await act(async () => {
    await logout()
    await login(USERS[role].email, 'pw')
  })
}

export async function signOutCompletely() {
  onApi('POST', '/auth/logout', { message: 'ok' })
  await act(async () => {
    await logout()
  })
}

// Matches the server's API shapes.
export const CLASSES = [
  { class_id: 1, class_name: 'Yellow', grade_range: 'Gr 1-2', teacher_id: 2, teacher_name: 'Ms Nkosi', is_active: true, learner_count: 2, active_learner_count: 2, present_today: 0 },
  { class_id: 2, class_name: 'Green', grade_range: 'Gr 3-4', teacher_id: null, teacher_name: null, is_active: true, learner_count: 1, active_learner_count: 1, present_today: 0 },
]

export const LEARNERS = [
  { learner_id: 11, class_id: 1, first_name: 'Aisha', last_name: 'Petersen', class_name: 'Yellow', grade_range: 'Gr 1-2', is_active: true, date_of_birth: '2018-03-14', can_walk_home_alone: false },
  { learner_id: 12, class_id: 1, first_name: 'Liam', last_name: 'Botha', class_name: 'Yellow', grade_range: 'Gr 1-2', is_active: true, date_of_birth: '2018-05-01', can_walk_home_alone: false },
  { learner_id: 13, class_id: 2, first_name: 'Zoe', last_name: 'Ntombela', class_name: 'Green', grade_range: 'Gr 3-4', is_active: true, date_of_birth: '2016-07-09', can_walk_home_alone: true },
  { learner_id: 14, class_id: 2, first_name: 'Gone', last_name: 'Away', class_name: 'Green', grade_range: 'Gr 3-4', is_active: false, date_of_birth: null, can_walk_home_alone: false },
]

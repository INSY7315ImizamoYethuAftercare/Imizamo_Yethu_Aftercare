// Flow 4: a teacher records an observation, it shows in the list, and the manager's report counts it.
import { expect, test } from '@playwright/test'
import { signIn, tag } from './support.js'

test('teacher adds an observation, and it appears in the list and in Reports', async ({ page, browser }) => {
  const note = `E2E note ${tag()}`

  await signIn(page, 'teacher')
  await page.goto('/learners')
  await page.getByPlaceholder('Search learner name...').fill('Aisha')
  await page.getByRole('button', { name: /Aisha Petersen/ }).click()
  await expect(page).toHaveURL(/\/observations\?id=\d+/)
  await expect(page.getByRole('heading', { name: 'Aisha Petersen' })).toBeVisible()

  await page.getByRole('button', { name: 'Observations' }).click()
  await page.getByRole('button', { name: '+ Add Observation' }).click()
  await page.getByRole('button', { name: 'Creative', exact: true }).click()
  await page.getByLabel('Observation', { exact: true }).fill(note)
  await page.getByRole('group', { name: 'Rating' }).getByRole('button', { name: '9', exact: true }).click()
  await page.getByRole('button', { name: 'Save', exact: true }).click()

  // In the learner's list (rating 9 is new: Aisha's seeded ratings are 8 and 6).
  await expect(page.getByText(note)).toBeVisible()
  await expect(page.getByText('9/10')).toBeVisible()

  // And in the manager's report, from a separate browser session.
  const managerContext = await browser.newContext()
  const manager = await managerContext.newPage()
  await signIn(manager, 'manager')
  await manager.goto('/reports')
  await expect(manager.getByText('Development Categories')).toBeVisible()
  await expect(manager.getByText('Creative', { exact: true })).toBeVisible()
  await managerContext.close()
})

test('an observation needs a note and a rating', async ({ page }) => {
  await signIn(page, 'teacher')
  await page.goto('/learners')
  await page.getByPlaceholder('Search learner name...').fill('Aisha')
  await page.getByRole('button', { name: /Aisha Petersen/ }).click()
  await page.getByRole('button', { name: 'Observations' }).click()
  await page.getByRole('button', { name: '+ Add Observation' }).click()

  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Write your observation first')

  await page.getByLabel('Observation', { exact: true }).fill('Some note')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Choose a rating')
})

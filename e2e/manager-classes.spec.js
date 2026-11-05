// Flow 2: a manager creates a class, edits it (grade and teacher), then adds a learner to it.
import { expect, test } from '@playwright/test'
import { signIn, tag } from './support.js'

test('manager adds a class, edits it, and adds a learner to it', async ({ page }) => {
  const className = `E2E ${tag()}`
  const firstName = 'Test'
  const lastName = `Learner${tag()}`

  await signIn(page, 'manager')
  await page.goto('/manager/classes')

  // Create
  await page.getByRole('button', { name: '+ Add Class' }).click()
  const addSheet = page.getByRole('dialog', { name: 'Add New Classroom' })
  await addSheet.getByPlaceholder('e.g. Brown, White').fill(className)
  await addSheet.getByRole('button', { name: 'Gr 3-4' }).click()
  await addSheet.getByRole('button', { name: 'Teal' }).click()
  await addSheet.getByRole('button', { name: 'Add Classroom' }).click()

  const card = page.locator('[role="button"]').filter({ hasText: className })
  await expect(card).toBeVisible()
  await expect(card).toContainText('Gr 3-4')

  // Edit: change the grade and assign a teacher
  await page.getByRole('button', { name: `Edit ${className}`, exact: true }).click()
  await expect(page.getByText('Edit Classroom')).toBeVisible()
  await page.getByRole('button', { name: 'Gr 5-6', exact: true }).click()
  await page.getByRole('button', { name: 'Ravi Naidoo', exact: true }).click()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(card).toContainText('Gr 5-6')
  await expect(card).toContainText('Ravi Naidoo')

  // It is saved on the server: still there after a reload.
  await page.reload()
  await expect(page.locator('[role="button"]').filter({ hasText: className })).toContainText('Ravi Naidoo')

  // Add a learner to the new class
  await page.goto('/manager/learners')
  await page.getByRole('button', { name: '+ Add', exact: true }).click()
  await page.getByPlaceholder('e.g. Aisha').fill(firstName)
  await page.getByPlaceholder('e.g. Petersen').fill(lastName)
  const classValue = await page.locator('select option', { hasText: className }).getAttribute('value')
  await page.locator('select').selectOption(classValue)
  await page.getByRole('button', { name: 'Add Student' }).click()

  const learnerRow = page.getByText(`${firstName} ${lastName}`)
  await expect(learnerRow).toBeVisible()
  await page.getByPlaceholder('Search learner name...').fill(lastName)
  await expect(page.getByText(`Gr 5-6 • ${className}`)).toBeVisible()
})

test('manager cannot add a class without a name', async ({ page }) => {
  await signIn(page, 'manager')
  await page.goto('/manager/classes')
  await page.getByRole('button', { name: '+ Add Class' }).click()
  await page.getByRole('dialog', { name: 'Add New Classroom' }).getByRole('button', { name: 'Add Classroom' }).click()
  await expect(page.getByRole('alert')).toContainText('Enter a class name')
})

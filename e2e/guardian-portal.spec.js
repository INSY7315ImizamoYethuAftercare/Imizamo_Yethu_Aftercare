// Flow 3: a guardian signs in and sees their own child, and cannot see anyone else's.
// Fatima Petersen is Aisha's mother. Zoe Ntombela belongs to a different family.
import { expect, test } from '@playwright/test'
import { apiAs, signIn } from './support.js'

test('guardian sees their own child and the authorised pickup list', async ({ page }) => {
  await signIn(page, 'guardian')

  await expect(page.getByRole('heading', { name: /Welcome, Fatima/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Aisha Petersen' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Authorised Pickups' })).toBeVisible()
  await expect(page.getByText('Zainab Hendricks', { exact: true })).toBeVisible()

  // No other family's children anywhere on the page.
  for (const other of ['Zoe Ntombela', 'Naledi Mokoena', 'Liam van der Berg']) {
    await expect(page.getByText(other)).toHaveCount(0)
  }
})

test('guardian can add an authorised pickup', async ({ page }) => {
  await signIn(page, 'guardian')
  await page.getByRole('button', { name: '+ Add Person' }).click()

  const sheet = page.getByRole('dialog', { name: 'Add Authorised Pickup' })
  await sheet.getByLabel('FULL NAME').fill('Nomvula Dube')
  await sheet.getByLabel('RELATIONSHIP TO CHILD').fill('Neighbour')
  await sheet.getByLabel('CONTACT NUMBER').fill('072 111 2222')
  await sheet.getByRole('button', { name: 'Submit Request' }).click()

  // The new person is on the list straight away, marked authorised.
    const pickup = page.getByText('Nomvula Dube', { exact: true })
  await expect(pickup).toBeVisible()
  await expect(page.getByText('Neighbour')).toBeVisible()
})

test("the server refuses a guardian who asks for someone else's child", async ({ playwright, baseURL }) => {
  const manager = await apiAs(playwright, baseURL, 'manager')
  const learners = await (await manager.get('/api/learners')).json()
  const zoe = learners.find((learner) => learner.first_name === 'Zoe')
  expect(zoe, 'Zoe exists in the demo data').toBeTruthy()

  const guardian = await apiAs(playwright, baseURL, 'guardian')
  for (const path of [`/api/guardian/children/${zoe.learner_id}`, `/api/guardian/children/${zoe.learner_id}/overview`]) {
    const res = await guardian.get(path)
    expect([403, 404], `GET ${path}`).toContain(res.status())
  }

  // A malformed id is a clean 400, not a server error.
  expect((await guardian.get('/api/guardian/children/abc/overview')).status()).toBe(400)
})

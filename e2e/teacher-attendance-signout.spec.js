// Flow 1: a teacher marks attendance, then signs learners out.
// Thandeka Nkosi leads Yellow: Aisha and Liam are present today, Amahle is absent.
import { expect, test } from '@playwright/test'
import { signIn } from './support.js'

test.describe('Teacher: attendance', () => {
  test('changes a learner from absent to present and the register is saved', async ({ page }) => {
    await signIn(page, 'teacher')
    await page.goto('/attendance')

    const amahle = page.getByRole('listitem').filter({ hasText: 'Amahle Zulu' })
    await expect(amahle.getByRole('button', { name: 'Absent', exact: true })).toHaveAttribute('aria-pressed', 'true')

    await amahle.getByRole('button', { name: 'Present', exact: true }).click()
    await expect(amahle.getByRole('button', { name: 'Present', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Save Attendance' }).click()
    await expect(page.getByText('Attendance saved')).toBeVisible()

    // Saved in the database, not just on screen: it survives a reload.
    await page.reload()
    const reloaded = page.getByRole('listitem').filter({ hasText: 'Amahle Zulu' })
    await expect(reloaded.getByRole('button', { name: 'Present', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })

  test('refuses to save when nothing has changed', async ({ page }) => {
    await signIn(page, 'teacher')
    await page.goto('/attendance')
    await page.getByRole('button', { name: 'Save Attendance' }).click()
    await expect(page.getByText('Nothing new to save')).toBeVisible()
  })
})

test.describe('Teacher: sign-out', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'teacher')
    await page.goto('/signout')
  })

  test('signs a learner out to an authorised collector', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign out Aisha Petersen' }).click()

    await page.getByRole('button', { name: /Fatima Petersen/ }).click()
    await page.getByRole('button', { name: 'Verify' }).click()
    await expect(page.getByTestId('verified-message')).toContainText('Fatima Petersen is authorised to collect Aisha Petersen')

    await page.getByRole('button', { name: 'Confirm Sign-Out' }).click()
    await expect(page.getByText('Aisha is signed out!')).toBeVisible()
    await expect(page.getByText(/Collected by Fatima Petersen/)).toBeVisible()

    // She has left the list of learners still to collect.
    await page.getByRole('button', { name: 'Sign Out Another Learner' }).click()
    await expect(page.getByRole('button', { name: 'Sign out Aisha Petersen' })).toHaveCount(0)
    await expect(page.getByText('ALREADY COLLECTED TODAY')).toBeVisible()
  })

  test('does not sign a learner out to someone who is not on the pickup list', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign out Liam van der Berg' }).click()

    await page.getByLabel(/name of the person collecting/).fill('Mr Nobody')
    await expect(page.getByText('This person is not on the pickup list')).toBeVisible()
    await page.getByRole('button', { name: 'Verify' }).click()

    await expect(page.getByText('Needs manager approval')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirm Sign-Out' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Send to manager queue' }).click()
    await expect(page.getByText('Sent to the manager queue')).toBeVisible()

    // Liam is still waiting to be collected: nothing was recorded.
    await page.getByRole('button', { name: 'Back to list' }).click()
    await expect(page.getByRole('button', { name: 'Sign out Liam van der Berg' })).toBeVisible()
  })
})

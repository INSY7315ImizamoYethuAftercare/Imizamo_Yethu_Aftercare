// Flow 5: a manager looks through the Reports tabs and downloads a PDF.
import { expect, test } from '@playwright/test'
import { statSync } from 'node:fs'
import { signIn } from './support.js'

test.describe('Manager: reports', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'manager')
    await page.goto('/reports')
    await expect(page.getByRole('heading', { name: /Reports/ })).toBeVisible()
  })

  test('each report tab shows its own content', async ({ page }) => {
    await expect(page.getByText('Development Categories')).toBeVisible() // Overview is the first tab

    await page.getByRole('button', { name: /Trends/ }).click()
    await expect(page.getByText('Organisation trend')).toBeVisible()

    await page.getByRole('button', { name: /Donor Report/ }).click()
    await expect(page.getByText('Donor Impact Report')).toBeVisible()
    await expect(page.getByText('Key Impact Metrics')).toBeVisible()

    await page.getByRole('button', { name: /Board Report/ }).click()
    await expect(page.getByRole('heading', { name: 'Board Report' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Enrolment' })).toBeVisible()
  })

  test('the donor report downloads as a PDF', async ({ page }) => {
    await page.getByRole('button', { name: /Donor Report/ }).click()

    const download = page.waitForEvent('download', { timeout: 30_000 })
    await page.getByRole('button', { name: /Export as PDF/ }).click()
    const file = await download

    expect(file.suggestedFilename()).toMatch(/\.pdf$/)
    expect(statSync(await file.path()).size).toBeGreaterThan(1000)
  })
})

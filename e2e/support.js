// Helpers shared by the specs. The accounts come from `npm run seed:e2e`
// (server/src/db/seedDemo.js); every account has the same demo password.
import { expect } from '@playwright/test'

export const PASSWORD = process.env.SEED_PASSWORD ?? 'Demo-Password-2026!'

// card: the text of the role card on the login screen.
// key: the role the server checks the card against.
// home: where the app sends that role after signing in.
export const USERS = {
  teacher: { email: 't.nkosi@iylh.test', card: 'Teacher', key: 'teacher', home: /\/home$/ }, // leads Yellow
  manager: { email: 'manager@iylh.test', card: 'Manager', key: 'manager', home: /\/manager$/ },
  guardian: { email: 'fatima.petersen@iylh.test', card: 'Parent/Guardian', key: 'guardian', home: /\/parent$/ }, // Aisha's mother
}

/** Signs in through the real login screen. */
export async function signIn(page, who) {
  const user = USERS[who]
  await page.goto('/')
  await page.getByRole('button', { name: user.card }).click()
  await page.getByLabel('EMAIL').fill(user.email)
  await page.getByLabel('PASSWORD').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page).toHaveURL(user.home)
}

/** An API client that is signed in as that role (the cookie is kept), for checks the screen cannot show. */
export async function apiAs(playwright, baseURL, who) {
  const user = USERS[who]
  const api = await playwright.request.newContext({ baseURL })
  const res = await api.post('/api/auth/login', { data: { email: user.email, password: PASSWORD, role: user.key } })
  expect(res.ok(), `API sign-in as ${who}`).toBeTruthy()
  return api
}

/** A short unique tag, so a test can create data without clashing with an earlier run. */
export const tag = () => Date.now().toString(36)

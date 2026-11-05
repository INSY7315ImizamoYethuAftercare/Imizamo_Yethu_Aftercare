// Playwright end-to-end tests: a real browser, the real React app, the real
// Express API and a real PostgreSQL database.
//
//   npm run test:e2e          (prepares the database, starts both servers, runs the tests)
//   npm run test:e2e:report   (opens the last HTML report)
//
// The tests share one database and change it (they mark attendance, add a
// class, and so on), so they run one at a time, in order.
import { defineConfig, devices } from '@playwright/test'
import { CLIENT_URL, serverEnv } from './env.js'

const isCI = Boolean(process.env.CI)

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: isCI ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]] : [['list']],
  outputDir: 'test-results',

  use: {
    baseURL: CLIENT_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: [
    {
      // The API. Never reuse a server that is already running: it might be
      // pointed at a different database from the one we just prepared.
      command: 'npm run start --workspace server',
      cwd: '..',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: false,
      env: serverEnv,
      timeout: 60_000,
    },
    {
      // The React app. Vite's proxy sends /api to the API above, so the
      // browser sees one origin and the session cookie works unchanged.
      command: 'npm run dev --workspace client',
      cwd: '..',
      url: CLIENT_URL,
      reuseExistingServer: !isCI,
      env: { VITE_API_PROXY_TARGET: 'http://localhost:4000' },
      timeout: 60_000,
    },
  ],
})

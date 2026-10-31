# Running the tests

All commands are for PowerShell, run from the repository root.

| Command | What it runs |
|---|---|
| `npm test` | Server (unit + integration), then client |
| `npm run test:server` | Server unit tests (`server/src/**/*.test.js`) and integration tests (`server/tests/**`) |
| `npm run test:client` | Client tests with Vitest, React Testing Library and jest-axe (`client/src/test/**`) |
| `npm run test:coverage` | Both, with coverage reports in `server/coverage` and `client/coverage` |
| `npm run test:unit --workspace server` | Server unit tests only (no database needed) |
| `npm run test:integration --workspace server` | Server integration tests only |

## The test database

The integration tests use a local PostgreSQL database called **`imizamo_test`**:

- **First run:** the database is created if it's missing.
- **Every run:** it is wiped and rebuilt from the migration files under `server/src/db/migrations/` (via `node-pg-migrate` in `global-setup.js`).
- **Before each test:** it's emptied.

The tests refuse to run against any other database name or any non-localhost host.

The tests **never read `.env`** (`server/src/config/env.js` skips dotenv when `NODE_ENV=test`). Test values come from `server/tests/test-config.js`. The default URL is `postgresql://postgres:postgres@localhost:5432/imizamo_test`.

If your local `postgres` password is different, set `TEST_DATABASE_URL` once as a user environment variable, then restart your terminal or VS Code:

```powershell
[Environment]::SetEnvironmentVariable('TEST_DATABASE_URL', 'postgresql://postgres:YOUR_PASSWORD@localhost:5432/imizamo_test', 'User')
```

Don't commit your password anywhere.

## Known bugs

Tests that expose real, unfixed bugs are skipped by default. See [known-bugs.md](known-bugs.md). To run them:

```powershell
$env:RUN_KNOWN_BUGS = "1"; npm test; Remove-Item Env:RUN_KNOWN_BUGS
```

## Writing new tests

- **Server integration tests:** start the file with `const app = await loadApp()` from `server/tests/helpers/app.js`, and call `resetDb()` in `beforeEach`.
- **Test users:** create them with `createUser('teacher' | 'manager' | 'guardian' | 'admin_standard' | 'admin_master')` from `helpers/factory.js`. Send `user.cookie` with Supertest's `.set('Cookie', user.cookie)`.
- **New protected routes:** add every new route to `server/tests/helpers/routes.js`. The role-matrix test fails until you do.
- **Client tests:** mock the API with `vi.mock('../services/apiClient', async () => (await import('./api-mock')).apiClientModule)`. Register responses with `onApi('GET', '/learners', [...])`.

## Demo data and manual testing

- `npm run seed:demo`: see [e2e-walkthrough.md](e2e-walkthrough.md).
- Before merging to `main`: [manual-qa-checklist.md](manual-qa-checklist.md).

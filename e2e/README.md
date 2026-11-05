# End-to-end tests (Playwright)

These tests drive a real browser through the real app: React client, Express API
and PostgreSQL. They are the top of the test pyramid for INSY7315 criterion 8
(Data Flow and Logic): they prove that data really flows from the screen,
through the API, into the database and back.

## What is covered

| Spec | Flow |
|---|---|
| `teacher-attendance-signout.spec.js` | A teacher marks attendance and saves it. A teacher signs a learner out to an authorised collector, and is stopped when the collector is not on the pickup list. |
| `manager-classes.spec.js` | A manager creates a class, edits its grade and teacher, and adds a learner to it. |
| `guardian-portal.spec.js` | A guardian sees only their own child and the pickup list, can add a pickup, and the API refuses another family's child. |
| `observations.spec.js` | A teacher records an observation, it shows in the learner's list and in the manager's report. |
| `reports.spec.js` | A manager opens every report tab and downloads the donor report as a PDF. |

## Run them

You need PostgreSQL running locally and the packages installed (`npm ci`).

```
npx playwright install chromium     # once
npm run test:e2e
npm run test:e2e:report             # open the HTML report afterwards
```

`npm run test:e2e` does three things:

1. `e2e/prepare.mjs` makes sure the `imizamo_test` database exists, runs the migrations and
   rebuilds the demo data (`npm run seed:e2e`). Every run starts from the same data.
2. Playwright starts the API on port 4000 and the Vite client on port 5173.
3. The tests run one at a time, because they share one database.

The database is the same local `imizamo_test` the server's Jest suite uses, so
`TEST_DATABASE_URL` works for both. To use another `imizamo_test`, set `E2E_DATABASE_URL`.
Nothing here can touch another database: the seed script and `env.js` both refuse anything except
a local `imizamo_test` or `imizamo_dev`.

## Demo accounts

Created by `server/src/db/seedDemo.js`. Every password is `Demo-Password-2026!`.

| Role | Email |
|---|---|
| Teacher (leads Yellow) | `t.nkosi@iylh.test` |
| Manager | `manager@iylh.test` |
| Guardian (Aisha's mother) | `fatima.petersen@iylh.test` |

## Writing more

Use the same locators a person would: `getByRole`, `getByLabel`, `getByText`. These tests double as a
check that buttons and inputs have proper names (INSY7315 criterion 3, accessibility). If a test cannot
find something by its role or label, give it an `aria-label` rather than adding a test id.

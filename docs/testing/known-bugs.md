# Known bugs and open issues

**Status:** **28 bugs** found so far (25 by the Sprint 5 test suite, 3 by hand). **All 28 are fixed**, and each one now has a passing test that stops it from coming back. No known-bug tests are skipped right now.

Still open: two features that aren't built yet, some screens that still show placeholder data, and a few hardening ideas. They're listed below.

---

## Open bugs

| ID | Severity | Where | What goes wrong | Test |
|---|---|---|---|---|
| none | | | | |

### If you find a new bug

1. Write a test that shows the bug, and mark it `itKnownBug` instead of `it`. Add a comment above it: `// TODO(#issue) BUG-26: what goes wrong`.
   - Server: `import { itKnownBug } from '../helpers/knownBug.js'`
   - Client: `import { itKnownBug } from './knownBug'`
2. Add a row to the table above.
3. Known-bug tests are **skipped by default**, so CI stays green. To see them fail:

   ```powershell
   $env:RUN_KNOWN_BUGS = "1"; npm test; Remove-Item Env:RUN_KNOWN_BUGS
   ```

4. When it's fixed, change `itKnownBug` back to `it`, check it passes, and move the row to "Fixed" below.

---

## Not built yet

These are features, not bugs. The screens exist, but there's no backend yet. Worth creating a GitHub issue for them.

- **Manager approval queue for flagged collections.** On the Sign-Out page, "Send to manager queue" saves nothing, and the screen tells staff so. A real queue needs an escalation table (learner, typed collector name, reason, who flagged it, status), API routes, and `client/src/pages/Escalations.jsx` reading from it.
- **Changing your password.** The "Update password" form on the Settings pages only checks what's typed; there's no API for it yet. This matters now that managers give new teachers a starting password. It needs a route such as `PATCH /api/auth/password` (check the current password, then save the new hash with `UserRepository.updatePassword`), wired to `Settings.jsx` and `ParentSettings.jsx`.
- **Manager override.** "Override and approve" is shown greyed out. It depends on the queue above, and on recording a collector who isn't on the pickup list.

## Screens still showing placeholder data

These look finished but show hard-coded data. Don't demo them as real:

- `client/src/pages/Reports.jsx`: the report figures are fixed. `GET /api/reports/donor` isn't called.
- `client/src/pages/Escalations.jsx`: the sign-out queue is fixed data.
- `client/src/App.jsx`: `/manager/observations` is declared twice.

## Hardening ideas (not covered by tests)

- **Removing a pickup person.** Parents can add people to the pickup list but not remove them yet; a manager would have to do it in the database. Worth adding a "Remove" button (and an endpoint) next.
- **Manager approval of parent-added pickups.** People a parent adds are authorised straight away, as agreed. If the hub later wants to approve them first, `pickup_permissions` needs a status column and the Sign-Out check should only use approved ones.

- **Two sign-outs at the same instant.** A second sign-out on the same day is blocked in code (BUG-11), but two "Confirm" taps within milliseconds could both get through. A unique index on `sign_out_records (learner_id, record_date)` would close this completely. It would also need the `23505` error mapped to a 409.
- **Two accounts at the same instant with different-case emails.** Login and registration now ignore letter case (BUG-4), but the database's unique rule is still case-sensitive. A unique index on `LOWER(email)` would close this. Check first that no existing accounts differ only in letter case.
- **Dates shift a day on South African machines.** `pg` turns `DATE` columns into JavaScript dates at local midnight, so on a computer set to SA time `2026-10-03` is sent as `"2026-10-02T22:00:00.000Z"`. That affects dates of birth and record dates. Azure runs in UTC, so the live site looks right, but local dev shows the previous day. The usual fix is `pg.types.setTypeParser(1082, (v) => v)` in `server/src/db/pool.js`.
- **Deleting a learner wipes their history.** `DELETE /api/learners/:id` also deletes their attendance, observations, pickup permissions and sign-outs, so the "can't delete, has records" message in `LearnerService.deleteLearner` never appears. Check this is what you want for POPIA and audit purposes. Deactivating a learner keeps their history.

---

## Fixed in Sprint 5

| ID | Problem | Fix |
|---|---|---|
| BUG-1 | Every guardian self-registration returned 500 (the INSERT had 6 columns but 4 values) | `GuardianRepository.create` |
| BUG-2 | A failed registration left an orphan user, so the parent could never retry | Registration runs in one transaction (`server/src/db/transaction.js`); the same email registered twice at once gets 409 |
| BUG-3 | Any role other than staff or guardian at registration gave 500 | Only `guardian` may self-register; staff roles get 403, anything else 400 |
| BUG-4 | Emails were case-sensitive (`Ann@x.org` and `ann@x.org` were two accounts) | Case-insensitive lookup; new emails stored in lower case |
| BUG-5 | Registration didn't check email format or password length | Valid email and 8–72 character password required |
| BUG-6 | A non-text password at login gave 500 | 400 |
| BUG-7 | A deactivated user kept access until their 8-hour login expired | Every request checks the account is still active (and the role still matches) |
| BUG-8 | Non-numeric ids (e.g. `/api/classes/abc`) gave 500 with SQL in the message | Ids validated in every controller; 400 |
| BUG-9 | A deactivated guardian was still allowed to collect | Pickup checks require an active guardian account |
| BUG-10 | A learner who was absent, or never marked present, could be signed out | Sign-out requires a "present" mark today; otherwise 409 |
| BUG-11 | A learner could be signed out twice on the same day | Second sign-out gets 409 |
| BUG-12 | Sign-out dates and times used UTC, so they were wrong between 00:00 and 02:00 SA time, and 2 hours early on Azure | SA date and time, the same as attendance |
| BUG-13 | Two repository methods returned `password_hash` | Removed; only `findByEmail` returns it, because login needs it |
| BUG-14 | Error responses included stack traces and SQL outside production | No stack ever; 500s say "Internal server error" unless `NODE_ENV=development` |
| BUG-15 | An invalid `?date=` on class attendance gave 500 | 400 |
| BUG-16 | A non-numeric `classId` when adding a learner gave 500 | 400 |
| BUG-17 | Sending `"false"` marked a child as **allowed to walk home alone** | Only `true` or `"true"` counts as true (also fixed for `isActive`) |
| BUG-18 | Saving an observation with notes gave 500, and editing one field blanked the others | Fixed in `observationController.js` |
| BUG-19 | Editing an observation didn't check the rating | Rating must be a whole number from 1 to 10 |
| BUG-20 | Text longer than the database allows gave 500 | Length limits matching the database columns |
| BUG-21 | `status: ["present"]` (an array) was accepted for attendance | Status must be text |
| BUG-22 | The Sign-Out page was hard-coded and never called the API | Uses `GET /api/signout/today` and `POST /api/signout/confirm`; managers can sign out; learners allowed to walk home alone can be signed out with no guardian (needs migration `001_signout_by_manager.sql`) |
| BUG-23 | Login's email and password labels weren't linked to their inputs (screen readers) | `htmlFor` / `id` added |
| BUG-24 | 5 logins from the same Wi-Fi in 15 minutes locked **everyone** out | Only failed logins count: 5 per account per IP, 30 per IP; `trust proxy` set for Azure |
| BUG-25 | Admins, managers and guardians couldn't log out: "Log out" on the Settings pages only went to the sign-in page, which saw the still-valid session and sent them straight back (found by hand) | `Settings.jsx` and `ParentSettings.jsx` end the session first, like the ⋮ menu; covered by `client/src/test/Logout.test.jsx` |
| BUG-26 | Opening a learner's page directly (refresh, or a link) could stay on "Loading learner..." forever, when the full learner list finished loading before the single-learner fetch | `Observations.jsx`: a learner found in the list is never "loading"; covered by `client/src/test/ClassMoves.test.jsx` |
| BUG-27 | The teacher home page was placeholder text ("Yellow class • 2 of 2 present", fixed Present/Absent/Signed out numbers and activity), so moving or adding learners, or marking anyone absent, never changed it (found by hand) | `Home.jsx` shows the teacher's own class: present / absent / not marked from today's attendance, today's sign-outs, real date and greeting; covered by `client/src/test/TeacherHome.test.jsx` |
| BUG-28 | The class and learner lists loaded once per login, so a learner the manager added or moved didn't reach the teacher's pages (register, totals) until they signed out and in again (found by hand) | `UseClasses.jsx` / `UseLearners.jsx` reload whenever a page opens and when the tab gets focus (requests made at the same time are shared) |

Extra fixes found along the way: requests with no JSON body now get 400 instead of 500 on every route.

**Also connected to the API:**

- **Create an account** (`Register.jsx`): parent/guardian registration through `POST /api/auth/register`. Staff role cards and the demo access code are removed, since staff can't self-register. The child's date of birth and the parent's relationship were added because the server needs them to link the account to the right child. Tests: `client/src/test/Register.test.jsx`.
- **Add teacher** (`Staff.jsx`): managers create teacher accounts through `POST /api/teacher`. Tests: `client/src/test/Staff.test.jsx`.

- **Parent home page** (`ParentHome.jsx`): real data from `GET /api/guardian/children/:id/overview` (today's status, 30-day attendance, the last 7 days, pickups, class teacher contact, observations with the teacher's name), plus **+ Add Person** through `POST /api/guardian/children/:id/pickups`. Parents register their child's pickups themselves; a pickup person doesn't need an account, and is authorised straight away (needs migration `002_pickups_without_accounts.sql`). Tests: `server/tests/api/guardianPortal.test.js`, `client/src/test/ParentHome.test.jsx`.

- **Add New Classroom** (`AddClassSheet.jsx`): redesigned. The class name is now typed (before, it could only be one of the five colour names), with a grade range and one of 8 colours. The colour is saved in the new `school_classes.colour` column (needs migration `003_class_colour.sql`); the original five classes have none and keep the colour of their name. Tests: `server/tests/api/classMoves.test.js`, `client/src/test/AddClass.test.jsx`.
- **Master admin**: can do everything the manager can (the route guard lets a master admin through wherever a manager may go, and every master admin also has a `managers` row, added by migration `004_master_admin_manages.sql`), and creates manager and standard admin accounts on **Staff → Managers & admins** (`GET`/`POST /api/accounts`, master admin only, users + profile written in one transaction). Login and `/auth/me` now return `accessLevel` for admins. Tests: `server/tests/api/accounts.test.js`, `client/src/test/MasterAdmin.test.jsx`.
- **Admin home** (`AdminHome.jsx`): the Class Overview was empty for admins (it used `GET /api/classes`, which admins aren't allowed). It now reads a new `today` section of `GET /api/reports/overview`: counts only, no names. The date, greeting and the three cards are real too. Admins no longer have Learners or Attendance tabs or routes (POPIA). Class Overview bars on the admin and manager homes now use the same colours as Reports. Tests: `server/tests/api/adminHome.test.js`, `client/src/test/AdminHome.test.jsx`, `client/src/test/ProtectedRoutes.test.jsx`.
- **Moving learners between classes** (manager): **Class** box in a learner's **Edit details** (`Observations.jsx`), saved through `PATCH /api/learners/:id`. Removing a class that still has learners now offers **Move & remove** (`Classes.jsx`): it moves every learner to the chosen class, then removes the class; if a move fails, the class is kept. The server now refuses moving or adding a learner to a removed class (409). Tests: `server/tests/api/classMoves.test.js`, `client/src/test/ClassMoves.test.jsx`.

**Worth knowing:** a parent can only register if their child's record has a date of birth that matches exactly. Learners imported without a date of birth can't be matched until a manager adds it.

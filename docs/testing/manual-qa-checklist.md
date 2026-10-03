# Pre-merge manual QA checklist (#53)

Run this before merging a PR into `main`. Copy the list into the PR description and tick each item.

- **Fails:** if anything fails, the PR doesn't merge until it's fixed or logged as an issue.
- **Known bugs:** items marked ⚠️ are covered by [known-bugs.md](known-bugs.md). Only fail them if they get *worse*.
- **Setup:** load the demo data and start the app as in [e2e-walkthrough.md](e2e-walkthrough.md) §0. Keep the browser **DevTools Console and Network tabs open** the whole time.

---

## A. Automated checks (all must pass)

- [ ] `npm test` passes locally: server unit + integration, then client.
- [ ] `npx oxlint` in `client/` reports **0 errors** (warnings are OK).
- [ ] `npm run build:client` succeeds.
- [ ] The GitHub Actions **Lint and Test** check is green on the PR.
- [ ] Any new protected route is added to `server/tests/helpers/routes.js`. The role-matrix test fails otherwise.
- [ ] No `.env`, password, connection string or `learners.json` appears in the diff.

## B. Authentication

- [ ] Sign in as each role (teacher, manager, master admin, standard admin, guardian). Each lands on its own home: `/home`, `/manager`, `/admin`, `/admin`, `/parent`.
- [ ] A wrong password shows *"Invalid email or password"*. An unknown email shows the **same** message.
- [ ] Empty fields show *"Please enter your email and password."*
- [ ] A deactivated account (`karen.vdberg@iylh.test`) shows *"This account has been deactivated"*.
- [ ] Sign out from the ⋯ menu returns you to the sign-in page. Pressing Back doesn't show protected data.
- [ ] Refresh the page while signed in: you stay signed in, because the session is restored from the cookie.
- [ ] In DevTools → Application → Cookies, `token` is **HttpOnly** and **SameSite=Strict** (and **Secure** on Azure).
- [ ] In the Network tab, no response body contains `password_hash` or a `stack` field.

**Creating accounts**

- [ ] **Create an account** is for parents only: no staff roles, and it says staff accounts are created by the manager.
- [ ] An empty form, an invalid email, a password under 8 characters, or passwords that don't match each show a clear message, and nothing is sent.
- [ ] A parent whose child's name **and** date of birth match a learner gets *"Account created. Please sign in."*, can sign in, and is on that child's pickup list.
- [ ] A wrong child name or date of birth says no learner was found. An email that's already registered says so.
- [ ] Manager: **Staff → + Add teacher** creates a teacher who appears in the list and can sign in with the starting password.

## C. Role access (smoke test per role)

| Role | Must open | Must be redirected away from |
|---|---|---|
| Teacher | `/home`, `/attendance`, `/learners`, `/classes`, `/signout` | `/manager`, `/admin`, `/parent` |
| Manager | `/manager`, `/manager/attendance`, `/manager/learners`, `/manager/classes`, `/manager/staff`, `/reports` | `/home`, `/admin`, `/parent` |
| Admin (master + standard) | `/admin`, `/admin/reports` | `/home`, `/manager`, `/parent` |
| Guardian | `/parent`, `/parent/settings` | `/home`, `/attendance`, `/manager`, `/admin` |
| Signed out | `/`, `/register` | every other page → `/` |

- [ ] Every row above checked.
- [ ] Admin pages show **no individual learner names**, by design under POPIA.
- [ ] A guardian sees only their own child's information. ⚠️ The parent home page is static.

## D. Attendance

- [ ] Teacher: the register lists only **active** learners, and the class filter buttons work.
- [ ] Saving with nothing marked shows *"Nothing new to save…"*.
- [ ] Mark one learner present and one absent, then save: *"Attendance saved"*, and the counters update.
- [ ] Refresh the page: the saved statuses are still there.
- [ ] Change a saved learner from Absent to Present and save: it updates without a duplicate-record error.
- [ ] Manager: the Attendance page is **view only** (no buttons, no Save).
- [ ] The Classes page "present today" numbers match the register.

## E. Sign-out

- [ ] The list shows only learners marked **present today** who haven't gone yet. Absent and unmarked learners aren't listed. With no attendance taken yet, it says to take attendance first.
- [ ] Each learner shows **their own** authorised pickups as buttons. Tap one, Verify, Confirm: *"<name> is signed out"*, and they move to "Already collected today" (and stay there after a refresh).
- [ ] Verify with nobody chosen and nothing typed shows an error.
- [ ] A typed name not on the list is flagged *"Needs manager approval"*. A typed name that **is** on the list says to tap it instead.
- [ ] "Walking Home" works for a learner allowed to walk home alone, and is flagged for everyone else.
- [ ] A manager can sign a learner out. The Override button is greyed out with a "not available yet" note.
- [ ] Server errors show in the red box (e.g. sign the same learner out in two tabs: the second gets *"already signed out today"*).
- [ ] The manager queue and override are **not built yet**: "Send to manager queue" saves nothing, and the screen says so. Tell the manager in person.

## F. Responsive layout

Use DevTools device mode at **360×740 (small Android)**, **768×1024 (tablet)** and **1280×800 (laptop)**.

- [ ] No horizontal scrolling on any page at 360px wide.
- [ ] The bottom navigation is fully visible and doesn't cover the last list item or the Save button.
- [ ] Class filter chips scroll sideways instead of wrapping off-screen.
- [ ] Buttons are big enough to tap (about 44px) and text is readable without zooming.
- [ ] Manager pages use the wider layout on laptop width.

## G. Console, network and accessibility

- [ ] **The Console shows no red errors** on any page visited above (React key warnings count as errors here).
- [ ] The Network tab shows no **500** responses during sections B–E.
- [ ] There are no failed requests to `localhost` on the deployed site (wrong API base URL).
- [ ] You can sign in using only the keyboard (Tab and Enter), with a visible focus ring. A screen reader announces "EMAIL" and "PASSWORD" for the two fields.
- [ ] Images have alt text, and icon-only buttons (🔔 ⚙️ ⋯) are reachable by Tab.

## H. Data and privacy

- [ ] No real learner or guardian data is used in screenshots, the PR description or test files. Use the demo seed only.
- [ ] Any new endpoint that returns learner data restricts who can call it, and has a role-matrix entry.

---

**Sign-off:** Tested by ______________ on ____/____/______ against commit `_______`. Result: ☐ Pass ☐ Pass with known issues ☐ Fail

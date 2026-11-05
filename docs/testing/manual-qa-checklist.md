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

- [ ] Sign in as each role (teacher, manager, master admin, standard admin, guardian). Each lands on its own home: `/home`, `/manager`, `/manager` (the master admin uses the manager pages), `/admin`, `/parent`.
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
| Master admin | Everything the manager can open, plus **Managers & admins** on Staff | `/home`, `/admin`, `/parent` |
| Standard admin | `/admin`, `/admin/reports`, `/admin/settings` | `/home`, `/manager`, `/parent`, `/admin/learners`, `/admin/attendance` |
| Guardian | `/parent`, `/parent/settings` | `/home`, `/attendance`, `/manager`, `/admin` |
| Signed out | `/`, `/register` | every other page → `/` |

- [ ] Every row above checked.
- [ ] Admin pages show **no individual learner names**, by design under POPIA. Admins have no Learners or Attendance tab, and `/admin/learners`, `/admin/attendance` send them back to `/admin`.
- [ ] Master admin: on **Staff → Managers & admins**, creating a manager and a standard admin works; each new account can sign in with its starting password and lands on its own home. A duplicate email is refused. Managers and standard admins don't see this section.
- [ ] Admin home shows today's real numbers and every class in the Class Overview. Class colours match the Reports page and the manager's Classes list.
- [ ] A guardian sees only their own child's information, and a parent with two children can switch between them.

## D. Attendance

- [ ] Teacher: the register lists only **active** learners, and the class filter buttons work.
- [ ] Saving with nothing marked shows *"Nothing new to save…"*.
- [ ] Mark one learner present and one absent, then save: *"Attendance saved"*, and the counters update.
- [ ] Refresh the page: the saved statuses are still there.
- [ ] Change a saved learner from Absent to Present and save: it updates without a duplicate-record error.
- [ ] Manager: the Attendance page is **view only** (no buttons, no Save).
- [ ] The Classes page "present today" numbers match the register.

## D2. Moving learners and removing classes (manager)

- [ ] **+ Add Class** matches the design: class name, grade range chips (Gr R to Gr 7), 8 colour swatches, a live preview card, Cancel / Add Classroom. A new class keeps its chosen colour on Classes, Learners, Attendance and the learner page banner, after a refresh too.
- [ ] Learner **Profile → Edit details** has a **Class** box starting on the learner's current class, listing only classes that still exist.
- [ ] Changing the class and saving updates the learner's page, the Learners list, and both classes' counts on **Classes**. The teacher of the new class sees the learner on their register.
- [ ] Removing an empty class asks *"Remove Class?"* and removes it.
- [ ] Removing a class that still has learners asks where to move them. **Move & remove** moves every learner (deactivated ones too), then removes the class.
- [ ] If there's no other class, it says to add a class first, and nothing can be removed.
- [ ] Refreshing a learner's page (or opening its link directly) loads the learner instead of staying on "Loading learner...".

## E. Sign-out

- [ ] The list shows only learners marked **present today** who haven't gone yet. Absent and unmarked learners aren't listed. With no attendance taken yet, it says to take attendance first.
- [ ] Each learner shows **their own** authorised pickups as buttons. Tap one, Verify, Confirm: *"<name> is signed out"*, and they move to "Already collected today" (and stay there after a refresh).
- [ ] Verify with nobody chosen and nothing typed shows an error.
- [ ] A typed name not on the list is flagged *"Needs manager approval"*. A typed name that **is** on the list says to tap it instead.
- [ ] "Walking Home" works for a learner allowed to walk home alone, and is flagged for everyone else.
- [ ] A manager can sign a learner out. "Override and approve" signs out a collector who isn't on the list, and the record shows their name and the manager.
- [ ] Server errors show in the red box (e.g. sign the same learner out in two tabs: the second gets *"already signed out today"*).
- [ ] "Send to manager queue" adds the collection to the manager's **Queue**, and the count on the manager home goes up. The learner shows "Waiting for manager" on the Sign-Out list. Approving signs them out with the typed name; dismissing leaves them on the list, marked with who dismissed it and when. The label updates within 30 seconds without a refresh.

## F. Responsive layout

Use DevTools device mode at **360×740 (small Android)**, **768×1024 (tablet)** and **1280×800 (laptop)**.

- [ ] No horizontal scrolling on any page at 360px wide.
- [ ] The bottom navigation is fully visible and doesn't cover the last list item or the Save button.
- [ ] Class filter chips scroll sideways instead of wrapping off-screen.
- [ ] Buttons are big enough to tap (about 44px) and text is readable without zooming.
- [ ] Manager pages use the wider layout on laptop width.

## F2. Parent page

- [ ] The welcome card, child card (attendance % over 30 days, today, updates), status box, observations, pickups, This Week and teacher contact all show **that parent's child's** real data.
- [ ] The status box follows the day: not marked yet → at aftercare (arrival time) → collected (by whom, when), or absent.
- [ ] **+ Add Person**: Submit stays disabled until name, relationship and contact number are filled in; a new person appears in the list and on the teacher's Sign-Out page for that child; adding someone already on the list is refused.
- [ ] Ticking "may walk home alone" shows "May walk home alone ✓ Allowed" afterwards, and teachers can then choose Walking Home for that child.
- [ ] No other family's names, and no phone numbers of other pickup people, appear anywhere on the page.

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

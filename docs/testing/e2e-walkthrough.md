# End-to-end walkthrough (#54)

This is a scripted tour of the app as each of the 5 roles, using the demo data from `npm run seed:demo`. Do each step and compare what you see with **Expected**.

If you get a different result, check [known-bugs.md](known-bugs.md) before logging a new issue. Steps affected by a known bug are marked ⚠️ with the bug ID.

---

## 0. Setup (PowerShell, from the repo root)

1. **Point your local API at a local database.** Use `imizamo_dev` or `imizamo_test`; never Azure. The seed script refuses anything else. Your `server/.env` controls which database `npm run dev:server` uses.

2. **One-off: update an existing database.** If your local database was created before these changes, run the migrations once, in order. They are safe to run again:

   ```powershell
   & "C:/Program Files/PostgreSQL/17/bin/psql.exe" -h localhost -U postgres -d imizamo_dev -f server/src/db/migrations/001_signout_by_manager.sql
   & "C:/Program Files/PostgreSQL/17/bin/psql.exe" -h localhost -U postgres -d imizamo_dev -f server/src/db/migrations/002_pickups_without_accounts.sql
   & "C:/Program Files/PostgreSQL/17/bin/psql.exe" -h localhost -U postgres -d imizamo_dev -f server/src/db/migrations/003_class_colour.sql
   & "C:/Program Files/PostgreSQL/17/bin/psql.exe" -h localhost -U postgres -d imizamo_dev -f server/src/db/migrations/004_master_admin_manages.sql
   & "C:/Program Files/PostgreSQL/17/bin/psql.exe" -h localhost -U postgres -d imizamo_dev -f server/src/db/migrations/005_password_security.sql
   ```

   A database built fresh from `schema.sql` already has it.

3. **Load the demo data**, wiping that database's tables first:

   ```powershell
   npm run seed:demo -- --apply --reset
   ```

   **Expected:** a table of demo accounts. **Every password is `Demo-Password-2026!`** unless you set `$env:SEED_PASSWORD` first.

4. **Start the app**, using two terminals:

   ```powershell
   npm run dev:server
   ```

   ```powershell
   npm run dev:client
   ```

   Open http://localhost:5173.

5. **Pick the right role card.** The card you choose on the sign-in page must match the account: Teacher, Manager, Admin (standard **and** master admins) or Parent/Guardian. A wrong card shows *"Wrong account type for the role selected. Please choose the correct role and try again."* and doesn't sign you in.

6. **Login limits.** Successful sign-ins never count. After **5 wrong passwords for the same account** in 15 minutes (or 30 wrong passwords across accounts from your machine), login returns *"Too many requests, please try again later."* To reset it while testing, restart `npm run dev:server`.

### Demo accounts

| Role | Email | Notes |
|---|---|---|
| Admin (master) | `master.admin@iylh.test` | |
| Admin (standard) | `admin@iylh.test` | |
| Manager | `manager@iylh.test` | Sarah Botha |
| Teacher | `t.nkosi@iylh.test` | Thandeka Nkosi, Yellow class (also `s.dlamini` Green, `m.williams` Red, `r.naidoo` Blue, `a.patel` Orange) |
| Guardian | `fatima.petersen@iylh.test` | Mother of Aisha Petersen (Yellow) |
| Guardian | `ahmed.petersen@iylh.test` | Father of Aisha (secondary contact) |
| Guardian | `grace.ntombela@iylh.test` | Grandmother of Zoe Ntombela (Green) |
| Guardian | `thabo.mokoena@iylh.test` | Father of Naledi Mokoena (Red); may also collect Lwazi Mthembu (Orange) |
| Guardian | `karen.vdberg@iylh.test` | **Deactivated** account |

### Today's data (South African date)

- **Present:** Aisha, Liam, Zoe, Keanu, Naledi, Bongani, Lwazi.
- **Absent:** Amahle Zulu, Daniel Smit.
- **Not marked:** everyone else.
- **Already signed out:** Bongani Khumalo, who can walk home alone.
- **Deactivated learner:** Ethan Fortuin (Green).

---

## 1. Teacher: Thandeka Nkosi

| # | Step | Expected |
|---|---|---|
| T1 | On the sign-in page, choose **Teacher**, enter `t.nkosi@iylh.test` and the demo password, then click **Sign In**. | You land on `/home`. The header shows **Thandeka Nkosi** and **Teacher • Yellow**. |
| T2 | Click **Sign In** with an empty password (sign out first via the ⋮ menu). | *"Please enter your email and password."* No request is sent. |
| T2a | Choose **Parent/Guardian**, then sign in as `t.nkosi@iylh.test` with the correct password. | *"Wrong account type for the role selected. Please choose the correct role and try again."* You stay on the sign-in page. |
| T3 | Choose **Teacher** and sign in with a wrong password. | *"Invalid email or password"* (a wrong password never shows the role error, whatever card is picked). |
| T4 | Sign in correctly and tap **Attendance** in the bottom nav. | **12 learners** (Ethan is deactivated so he's hidden). The counters show **Present 7, Absent 2**. Filter buttons: All, Blue, Green, Orange, Red, Yellow. |
| T5 | Tap **Yellow**. | **3 learners:** Aisha (Present), Liam (Present), Amahle (Absent). |
| T6 | Tap **Save Attendance** without changing anything. | *"Nothing new to save. Mark learners present or absent first."* |
| T7 | Change **Amahle Zulu** to **Present** and tap **Save Attendance**. | *"Attendance saved"*. The counters update to Present 3, Absent 0 for Yellow. Refreshing the page keeps it. |
| T8 | Tap **All**, mark **Chloe Adams** (Orange, not marked) **Present**, and save. | *"Attendance saved"*. On the **Classes** page, Orange shows 2/2 present. |
| T8a | Tap **Home** in the bottom nav. | Today's date and *"Good afternoon, Thandeka! 👋"*, with *"Yellow class • N of M present"* and Present / Absent / Signed out counts for **Yellow only**. Keep this tab open: when the manager adds or moves a learner into Yellow (M3, M3b), coming back to this tab updates the total, and marking someone absent on **Attendance** updates the Absent count. |
| T9 | Open **Learners**. | All 13 learners. Ethan Fortuin is shown greyed out (deactivated). |
| T10 | Open **Sign Out**. | Everyone marked present today who hasn't gone yet (8 learners after steps T7–T8). Under **ALREADY COLLECTED TODAY**: *Bongani Khumalo, 16:10 • Walked home alone*. |
| T11 | Tap **Sign Out** next to Aisha Petersen. | The authorised pickups are buttons: **Fatima Petersen** (Mother), **Ahmed Petersen** (Father), and **Walking Home**. Nobody from another family appears. |
| T12 | Tap **Fatima Petersen**, then **Verify**, then **Confirm Sign-Out**. | *"Aisha is signed out"*, *"Collected by Fatima Petersen at HH:MM"*. Tap **Sign Out Another Learner**: Aisha is now under "Already collected today". It's saved, so it survives a refresh. |
| T12a | Start a sign-out for **Naledi Mokoena**, tap **Walking Home**, then **Verify**, then **Confirm Sign-Out**. | *"Naledi Mokoena is allowed to walk home alone"*, then *"Walking home alone at HH:MM"*. |
| T12b | Start a sign-out for **Zoe Ntombela**, tap **Walking Home**, then **Verify**. | **"Needs manager approval"**: *"Walking home is not pre-authorised for this learner."* Tap **Go back**. |
| T12c | Still on Zoe, type **grace ntombela** in "Someone not on the list?" and tap **Verify**. | *"Grace Ntombela is on the pickup list. Tap their name above instead."* Tap **Cancel**. |
| T12d | Start a sign-out for **Liam van der Berg**. | *"No-one is on this learner's pickup list yet…"*: his only guardian (Karen) is deactivated. Type **Random Stranger** and tap **Verify**: *"Needs manager approval"*, with no Override button for teachers. **Send to manager queue** shows a note that the queue isn't connected yet and nothing was saved. |
| T13 | Open `http://localhost:5173/manager` in the address bar. | You're sent back to `/home`. |
| T14 | Open `http://localhost:5173/parent`. | You're sent back to `/home`. |
| T15 | Open the ⋮ menu and tap **Settings**. | `/teacher/settings`: your name, email and *Teacher • Yellow*, a note that name and email changes go through the master admin, **Change password** and **Log out**. |
| T16 | Under **Change password**, enter a wrong current password and a new one (8+ characters) twice, then tap **Update password**. | *"Your current password is incorrect"*. You stay signed in. |
| T17 | In a private window, sign in as the same teacher. Back in the main window, change the password from the demo password to `Another-Pass-1234`. | *"Password updated. You've been signed out on any other devices."* The main window stays signed in; the private window's next click sends it to the sign-in page. |
| T18 | Change the password back from `Another-Pass-1234` to the demo password. | *"Password updated…"*. The demo password works again for the rest of the walkthrough. |

---

## 2. Manager: Sarah Botha

| # | Step | Expected |
|---|---|---|
| M1 | Choose **Manager** and sign in as `manager@iylh.test`. | You land on `/manager`: today's date, *"Good afternoon, Sarah! 👋"* (morning/evening by the time) and *"N of M learners present today • K signed out"*. The Present Today, Signed Out and Total Learners cards match that line (Escalations is still a placeholder **3**). The Class Overview shows all 5 classes with present/active bars. |
| M1a | Look at **Recent Activity**. | Today's sign-outs, latest time first (up to 5). After T12 and T12a: **Aisha Petersen** (*Collected by Fatima Petersen*) and **Naledi Mokoena** (*Walked home alone*), each with *"Signed out by Thandeka Nkosi"* and the time, plus **Bongani Khumalo** (16:10, from the demo data). No placeholder "flagged" rows. |
| M2 | Open **Attendance**. | The page says *"… learners • view only"*. You see statuses but no Present/Absent buttons and no Save. |
| M3 | Open **Learners** and add **Sizwe Ndlovu**, Yellow class. | Sizwe appears in the list. The Yellow learner count goes up on **Classes**. |
| M3a | On **Classes**, tap **+ Add Class**. Type **Brown**, choose **Gr 5-6** and the purple colour, then tap **Add Classroom**. | The preview card shows *Brown* / *Gr 5-6* in purple as you go. Brown appears in the list with a purple bar; adding **yellow** (any letter case) says *"There's already a class called yellow."* Escape or Cancel closes the form. |
| M3b | Open **Sizwe Ndlovu**, go to **Profile**, tap **Edit details**, change **Class** to **Green**, and tap **Save**. | *"Learner details saved"*. The banner and the Class row show **Green**. On **Classes**, Yellow's count goes down by one and Green's goes up. |
| M3c | On **Learners**, tap ⏸ next to **Sizwe Ndlovu**, then **Deactivate**. | *"Deactivate Learner?"* asks first. Sizwe stays in the list, greyed out with a **Deactivated** badge, and can't be opened. Teachers see him locked (🔒) and he's not on **Attendance**. |
| M3d | Tap ↩ next to Sizwe, then **Reactivate**. | He's back to normal and can be opened again. (Ethan Fortuin, deactivated in the demo data, shows ↩ too: leave him deactivated for T4/T9 on the next run.) |
| M4 | On **Classes**, tap 🗑 on **Orange**. | *"2 learners are still in this class. Move them to another class first."* with a **Move all 2 to** box. **Move & remove** stays greyed out until you choose a class. Tap **Cancel** for now (M11 does the real removal). |
| M5 | Open **Staff**. | 5 teachers are listed with their active status. There are **no Edit or Reset password** buttons and no *Managers & admins* section: those are the master admin's (A6–A8). |
| M5a | Tap **+ Add teacher**, enter **Sipho Ndlovu**, `sipho.ndlovu@iylh.test` and a starting password of 8+ characters, then tap **Add teacher**. | *"Sipho Ndlovu was added. Give them their email and starting password to sign in."* He appears in the list as Active. |
| M5b | Add a teacher with the same email again (any letter case). | *"An account with this email already exists"*, and the form stays open with what you typed. |
| M5c | In a private window, sign in as `sipho.ndlovu@iylh.test` with that starting password. | You land on the teacher home page `/home`. |
| M6 | Deactivate **Sipho Dlamini**, then sign in as `s.dlamini@iylh.test` in a private window. | *"This account has been deactivated"*. If Sipho was **already** signed in elsewhere, his next click sends him back to the sign-in page. |
| M7 | Reactivate Sipho. | He can sign in again. |
| M8 | Open **Sign Out** and sign out **Zoe Ntombela** by tapping **Grace Ntombela**. | *"Zoe is signed out"*. Managers can sign learners out, and the record shows the manager as the person who did it: back on **Home**, Zoe appears in Recent Activity with *"Collected by Grace Ntombela"* and *"Signed out by Sarah Botha"*. |
| M8a | Start a sign-out for **Keanu Abrahams**, type an unknown name, and tap **Verify**. | **"Override and approve"** is visible but greyed out, with *"Override isn't available yet: it needs the approval queue."* |
| M9 | Open **Reports**. | Tabs: Overview, Trends, Donor Report, Board Report. (The figures are currently static placeholders, not live data.) |
| M10 | Open `http://localhost:5173/admin`. | You're sent back to `/manager`. |
| M11 | On **Classes**, tap 🗑 on **Orange**, choose **Blue**, and tap **Move & remove**. | Orange disappears. Lwazi and Chloe are now in Blue (check **Learners**, and Blue's count on **Classes**). Teachers no longer see an Orange filter. To get Orange back for the next run, re-run the demo seed with `--reset`. |
| M11a | Open any learner's **Edit details**. | Orange is no longer offered as a class. |

---

## 3. Admin (master): Nomvula Dube

The master admin can do **everything the manager can**, and is the only one who can create manager and standard admin accounts.

| # | Step | Expected |
|---|---|---|
| A1 | Choose **Admin** and sign in as `master.admin@iylh.test`. | You land on the **manager dashboard** (`/manager`). The header says *Nomvula Dube / Master Admin*, and the banner greets you as *"Good afternoon, Master Admin! 👋"*. The bottom tabs are the manager's: Home, Attendance, Learners, Classes, Sign Out, Reports. |
| A1a | Sign out, choose **Manager** and sign in as `master.admin@iylh.test`. | *"Wrong account type for the role selected…"*. A master admin is an admin account, so always uses the **Admin** card. Sign in again with **Admin**. |
| A2 | Repeat a few manager steps: add a learner (M3), add a class (M3a), add a teacher (M5a), sign a learner out (M8). | They all work exactly as for the manager. A sign-out you record is saved against your name. |
| A3 | Open **Staff**. Scroll down to **Managers & admins**. | You see Nomvula Dube (Master admin), Pieter Jacobs (Standard admin) and Sarah Botha (Manager), each with their email and *Active*. |
| A4 | Tap **+ Add account**, keep **Manager**, enter **Thabo Manager**, `thabo.manager@iylh.test` and a starting password of 8+ characters, then tap **Add manager**. | *"Thabo Manager was added as a manager. Give them their email and starting password to sign in."* He appears in the list. |
| A4a | Tap **+ Add account** again, choose **Standard admin**, enter **Lerato Admin**, `lerato.admin@iylh.test` and a password, then tap **Add standard admin**. | *"Lerato Admin was added as a standard admin…"* |
| A4b | Add an account with an email that's already used (e.g. `MANAGER@iylh.test`). | *"An account with this email already exists"*, and the form keeps what you typed. |
| A4c | In a private window, sign in as `thabo.manager@iylh.test`, then as `lerato.admin@iylh.test`. | Thabo lands on `/manager` as a Manager, with **no** Managers & admins section on Staff. Lerato lands on `/admin` (totals only, step S1). |
| A5 | Open `http://localhost:5173/admin` and `/home`. | You're sent back to `/manager`. |
| A6 | Open **Staff** and look at the buttons. | Every teacher has **Edit** and **Reset password**. Under *Managers & admins*, everyone has both except **you** (Edit only: you change your own password in Settings) and any other master admin (neither). |
| A6a | Tap **Edit** on **Thandeka Nkosi**, change the name to **Thandeka N**, and tap **Save changes**. | *"Thandeka N's account was updated."* The new name shows in the list, and the Yellow class still shows its teacher on **Classes**. Change it back to **Thandeka Nkosi**. |
| A6b | Tap **Edit** on Thandeka Nkosi, change the email to `manager@iylh.test`, and tap **Save changes**. | *"An account with this email already exists"*, and the form stays open. Tap **Cancel**. The edit form has no password field. |
| A7 | In a private window, choose **Teacher** and sign in as `t.nkosi@iylh.test`. Leave it open. Back in the main window, tap **Reset password** on Thandeka Nkosi, enter `Temp-Pass-1234` twice, and tap **Reset password**. | *"Thandeka Nkosi's password was reset. Ask them to change it in Settings."* In the private window, the next click sends you to the sign-in page. |
| A7a | In the private window, sign in as `t.nkosi@iylh.test` with `Temp-Pass-1234`. | You land on **Choose a new password**, not `/home`. Typing `http://localhost:5173/home` sends you straight back there. |
| A7b | Enter `Temp-Pass-1234` as the temporary password and the demo password as the new one (twice), then tap **Update password**. | You land on `/home`. `Temp-Pass-1234` no longer works; the demo password does. |
| A8 | Open **Settings** (⚙️ on the dashboard) and change your own password, then change it back. | Same as T16–T18: your current password is required, and other sessions are signed out. |

## 4. Admin (standard): Pieter Jacobs

A standard admin sees **totals only**, never individual learners (POPIA).

| # | Step | Expected |
|---|---|---|
| S1 | Sign in as `admin@iylh.test`. | You land on `/admin`: today's date, *"Good afternoon, Pieter! 👋"* (morning/evening by the time), and *"8 of 12 learners present today"* (7 if you skipped T8, and of 13 if you added Sizwe in M3). The Present Today, Signed Out and Total Learners cards show real numbers. The header says *Admin*. |
| S1a | Look at **Class Overview**. | Every class with *present / active learners* bars, in the **same colours as on Reports**. |
| S2 | Look at the bottom tabs and Quick Actions. | Tabs: **Home, Reports, Settings**. Quick Actions: Reports and Settings. **No Learners or Attendance.** |
| S2a | Type `http://localhost:5173/admin/learners`, `/admin/attendance`, `/manager` and `/home`. | You're sent back to `/admin` each time. |
| S3 | Open **Reports**. | The Reports page loads. (The donor API returns aggregate counts only: no names or IDs.) |

## 5. Guardian: Fatima Petersen

| # | Step | Expected |
|---|---|---|
| G1 | Choose **Parent/Guardian** and sign in as `fatima.petersen@iylh.test`. | You land on `/parent`: *"Welcome, Fatima! 💛 Here's how Aisha is doing"*. The card shows **Aisha Petersen**, *Gr 1-2 · Yellow*, an attendance % for the last 30 days, **Present ✓** today, and the number of updates. |
| G1a | Read the status box under the card. | Because the teacher signed Aisha out in T12: *"👋 Aisha has been collected"*, *"Signed out by Fatima Petersen at HH:MM"*. (On fresh demo data, before T12, it says *"✅ Aisha is at aftercare today"*, *"Arrived at 14:05"*.) |
| G1b | Look at **Teacher Observations**. | The latest observation, with its category, date and teacher's name. **+ 1 more observation →** or **View all** shows the rest. |
| G1c | Look at **Authorised Pickups** and **This Week**. | Pickups: Fatima Petersen (you), Ahmed Petersen and Zainab Hendricks. This Week: the last few days, with one **Absent** and the others showing who collected Aisha and when. |
| G1d | Tap **+ Add Person**. Enter **Thandi Petersen**, relationship **Grandmother**, a contact number, and tap **Submit Request**. | The form closes and *"Thandi Petersen can now collect Aisha."* appears. She's in the pickup list. Submit stays greyed out until name, relationship and number are filled in. There's no ID number field. |
| G1e | Tap **+ Add Person** again and enter **ahmed petersen**. | *"Ahmed Petersen is already on the pickup list."* Tap **Cancel**. |
| G1f | Check the teacher side. In Postman, sign in as `t.nkosi@iylh.test` and call `GET /api/signout/today`. | Aisha's `pickups` include **Thandi Petersen**: what a parent adds is used by the sign-out check. (On fresh demo data, before T12, you can also see her as a button on the teacher's **Sign Out** page for Aisha.) |
| G2 | Sign out and sign in as `grace.ntombela@iylh.test`. | You see **Zoe Ntombela**, never Aisha. |
| G2a | Sign in as `thabo.mokoena@iylh.test`. | Two tabs at the top, **Naledi** and **Lwazi**; tapping one switches the whole page to that child. |
| G3 | Open `http://localhost:5173/attendance`, `/manager` and `/admin`. | You're sent back to `/parent` every time. |
| G4 | Sign in as `karen.vdberg@iylh.test`. | *"This account has been deactivated"*. |
| G5 | Sign out. On the sign-in page, tap **Create an account →**. | A parent-only form: *"Parent / Guardian"* and *"Staff accounts are created by the manager."* No Teacher, Manager or Admin options. |
| G6 | Tap **Create Account** with the form empty. | *"Please fill in every field."* Nothing is sent. |
| G7 | Fill in: Nandi Zulu, `nandi.zulu@example.com`, phone `082 555 0101`, relationship **Mother**, child **Amahle Zulu**, date of birth **2019-01-22** (one day wrong), and an 8+ character password twice. Tap **Create Account**. | *"We couldn't find a learner with that name and date of birth…"* |
| G8 | Change the date of birth to **2019-01-21** and tap **Create Account**. | Back on the sign-in page with *"Account created. Please sign in."* |
| G9 | Sign in as `nandi.zulu@example.com`. | You land on `/parent` and see **Amahle Zulu**, with Nandi on her pickup list. |
| G10 | Sign out, open **Create an account →** again, and register `nandi.zulu@example.com` a second time. | *"An account with this email already exists"* |
| G11 | Sign in as Fatima, open **Settings** and use **Change password** (then change it back). | Same as T16–T18: it checks the current password and actually changes it. |

---

## 6. Optional API checks (Postman or curl)

Sign in with `POST http://localhost:4000/api/auth/login` and the body `{"email":"…","password":"Demo-Password-2026!"}`. Postman keeps the `token` cookie for later requests.

| As | Request | Expected |
|---|---|---|
| teacher | `POST /api/signout/verify` with Aisha's `learnerId` and Fatima's `guardianId` | `authorised: true` |
| teacher | same with Grace's `guardianId` | `authorised: false`, *"…Escalate to the manager."* |
| teacher | `POST /api/signout/confirm` with Grace | `403`, nothing written |
| teacher | `PATCH /api/attendance/<Aisha's record_id>` with `{"status":"absent"}`, then `POST /api/signout/confirm` for Aisha with Fatima | `409` *"This learner was marked absent today…"*, nothing written |
| teacher | `PATCH` Aisha back to `present`, then confirm with Fatima again | `201`; the `record_date` is today's SA date |
| teacher | `POST /api/attendance` for Aisha again today | `409` *"Attendance has already been recorded for this learner today"* |
| guardian (Fatima) | `GET /api/guardian/children/<Zoe's id>` | `403` *"You can only view information for your own children"* |
| admin | `GET /api/reports/donor?periodStart=2026-01-01&periodEnd=2026-12-31` | `200`, aggregate counts only |
| manager | `POST /api/attendance` | `403` (managers are read-only for attendance) |

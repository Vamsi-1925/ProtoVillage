# Proto Village Ops — Build Spec v3 (FINAL DRAFT, 2026-07-08)

> Consumed by Claude Code. Everything is DECIDED unless marked 🔶 OPEN.
> Design principle: everything must be simple, friendly, and usable by anyone in
> the village with basic literacy — big touch targets, icons + labels, minimal
> jargon, English/Telugu toggle.

## 1. App-wide

| Setting | Value |
|---|---|
| App name | Proto Village Ops |
| Platform scope THIS BUILD | Two sections only: **Graamam** (enterprise operations) + **Proto Village Ops** (village management). Education is REMOVED from this build (future layer) ✅ |
| Firestore namespace | `ops/*` (shared Firebase Auth per platform plan) |
| Landing view | This week's tasks + collapsible tree (Vertical → Goal → Objective → Task) |
| Week block | Thursday → Tuesday (working); Wednesday off |
| Planning rhythm | Tuesday community meeting 2:30–5:00 PM sets goals/tasks for week starting Thursday. Reminder push to everyone Tuesday 10:00 AM with RSVP confirm button |
| Timezone | Asia/Kolkata |
| Languages | English + Telugu toggle, all labels translated |
| Statuses | Todo / In Progress / Blocked / Done (+ Pending Verification, see §5) |
| Priority | Low / Medium / High / Urgent — set per task by creator |
| Attachments | Images + PDF, 10 MB. Voice notes supported where specified (values voting) |
| Progress | Bottom-up auto, equal weight per task. Weighted formula = phase 2 discussion |
| Overdue | Not Done by end of week block (end of Tuesday) |

## 1a. Planning cadence (Indian financial year) ✅
- Everything aligns to the Indian FY (April–March).
- Per vertical: **yearly plan** (with a progress chart per vertical) → **4 quarterly
  plans** → each quarter broken into **12 planned weeks** → measured weekly =
  **12 assessment cycles per quarter** (the Tuesday verifications).
- Goals & objectives are set at the **quarterly community meet**, together with
  goals shared by the Founder.
- **Guided writing templates** — every user fills the same form, with inline
  instructions:
  - Goal: "To achieve [outcome] of [degree/measure] within this quarter."
  - Objective/Task: "By doing this, I will achieve [the stated goal]."
  Free-text is structured by these prompts so all entries read the same way.

## 1b. Daily progress slider ✅
- Every user/lead updates a daily slider (0–100%, 10% steps) showing progress on
  that day's planned work against the weekly goal.
- The slider is **locked all day except 5:00–6:00 PM** (the daily meet window,
  Asia/Kolkata). During 5–6 PM it is editable (e.g. move 40% → 60%); it locks
  again at 6:00 PM. 💡 assumed: locked entirely on Wednesdays (holiday).
- Slider history feeds the Founder's daily-update dashboard.

## 2. Roles

| Role | Person | Capabilities |
|---|---|---|
| Founder | Kalyan | Visual summary dashboard (status of all verticals, budgets, performance index, simple language). Can comment/suggest to anyone, anywhere. Approves quarterly + weekly budget changes. Access to Admin Console. EXCLUSIVE access to raw values-voting data (who voted what, with voice/text notes and reasons); can edit a rating after discussion with the relevant person (edits logged 💡). Not even Admin sees raw voting data |
| Admin | Vamsi | Everything: verticals, users/roles, goals, budgets, escalation endpoint. No role display name — powers surface as "Admin Console", accessible to Admin + Founder only |
| Accounting | Accounting dept | Disburses approved amounts, records disbursements; entries reflect in dashboards |
| Vertical Lead | assigned in-app | Own vertical: goals/objectives/tasks, assign, triage quick-captures, order workflow timeline, create budgets, weekly account close. Cannot see other verticals except: can raise quick-capture tokens into them |
| Member | assigned in-app | Sees/updates own assigned tasks only. Cannot create/assign tasks, goals. Cannot comment on tasks. CAN raise quick-capture tokens with comments, and comment within their own tokens; sees token status (pending/resolved) |
| Viewer | — | REMOVED |

- One person may hold different roles in different verticals: Yes.
- All roles/users managed in-app via Admin Console (Admin + Founder).

### 2a. Auth & user provisioning (invite-only)
- No self-signup. Admin/Founder pre-registers each user's email + role(s) in the
  Admin Console; only those emails can sign in.
- First login: user sets their own password.
- Forgotten/changed password: user requests reset → Admin resets → user sets a new
  password at next login. (Self-service email reset deferred — revisit later ✅)
- New team member roles (incl. verification team) require Admin/Founder approval.

## 3. Verticals
NOT FINAL — the vertical list is fully editable in-app (add / rename / remove,
Admin only). Starting set: Construction, Maintenance & Repairs, Farming,
Cleanliness & Hygiene, Other. (Board Management removed ✅.)
Leads/members assigned in-app after launch (not hard-coded).
Default colors (editable in-app): CON #C97B3D · MNT #7A8B5C · FRM #4C9A6E ·
CLN #4FA3C4 · OTH #9B8AA6. Vertical codes used in token numbers: CON, MNT, FRM,
CLN, OTH (auto-generated for new verticals).
- "Other": Admin as catch-all lead; quick-capture overflow.

## 4. Entities

**Goal:** title, vertical, lead, target date, metric (number/%/done-not-done),
target value, description, progress % (auto), budget (see §8).
**Objective:** title, parent goal, owner (defaults to goal lead), target date (set
by lead), progress % (auto), budget rollup.
**Task:** title, parent objective OR floating under vertical, assignee(s) dropdown
(self + team names, multiple allowed), due date, status, priority, notes,
attachments, checklist, calendar link, budget line (optional), comments thread
(mandatory @-tag per comment; tagged person notified), created-by, timestamps.
**Recurring task:** daily/weekly/monthly/custom; auto-assign set by lead; unfinished
instance stays open AND escalates to lead when next spawns.
**Event/Meeting:** title, date/time, recurrence, attendees, RSVP. Tuesday community
meeting seeded as recurring event. Events sync to Google Calendar automatically.
**Quick-capture token:** title + optional note/photo, creator, target vertical
(members and leads can raise into any vertical), status (pending/resolved — visible
to creator), comments (creator can participate), escalate flag + tagged deciders.
SLA: >2 days unresolved in triage → notify lead; still unresolved → flag Admin.

## 5. Community verification, work assessment & values rating
- Member marks task Done → status "Pending Verification". Counts toward progress %
  immediately.
- At the Tuesday meeting the **designated verification team** (configured in-app
  by Admin 🔶 names TBD) reviews each pending task and marks it:
  - **Done** (post-verification) — stays counted, task closes; or
  - **Redo** — returns to the task list with comments; its progress contribution
    is rolled back until redone and re-verified.
- **Work assessment score** ✅ — every verified task is scored in three categories:
  1. **Necessity** — what real need does this work fulfil?
  2. **Effectiveness** — how well does the implemented solution work?
  3. **Hygiene & Beauty** — how clean, safe and beautiful is the result?
  💡 assumed: 1–10 per category, scored by those verifying at the meeting; the
  average is the task's assessment score, and scores aggregate per person and
  per vertical on the performance dashboard as the quality-of-work measure.
- **Performance score = assessment only** ✅ — a person's performance score comes
  solely from the three work-assessment categories above (necessity,
  effectiveness, hygiene & beauty). It measures quality of work done, nothing else.
- **Values rating** — separate from performance. Values measure a person's growth
  in the community (NOT salary growth): as their value/emphasis on the community
  increases, they grow into larger responsibilities in the community/organization.
  At the Tuesday meeting, community rates Leads 1–10 on the community values
  (Admin-configurable list ✅; actual values supplied later). Voting is anonymous
  to everyone except the Founder, with optional voice/text note attached.
- **Values visibility (REVISED)** ✅:
  - Personal dashboard: each person sees ONLY their own current value score and
    standing. Individual scores are never public.
  - Public to all: the community-wide aggregate value score only.
  - The system auto-picks the week's best and least value scores; the Founder can
    attach a note there ("we need to work on this value/domain"). 💡 assumed:
    best/least flags + notes appear in the Founder's view, not publicly.
  - Raw voting data (who voted what, notes, reasons) = Founder ONLY; editable only
    when necessary, after discussing with the person who voted; edits kept in a
    Founder-only audit log ✅.
  - If someone's value score falls, the Founder holds a personal 1:1 with them —
    private, deliberately NOT recorded anywhere in the app ✅.

## 6. Views & UX
1. **Landing — My Tasks This Week:** due this week + overdue; default sort = lead's
   workflow timeline order, then priority.
2. **Goal grid:** vertical-colored cards (title, %, target date, lead, timeline) →
   tap → tree of objectives → tasks.
3. **Kanban:** Todo/In Progress/Blocked/Done columns, drag to change status, no
   swimlanes, toggleable with list/tree.
4. **Quick capture (+):** 2-tap jot → lead triage queue; escalate + tag deciders.
5. **Search:** filters assignee/vertical/status/priority/due range + full-text.
6. **Discussion tab:** app-wide threads with @-tagging (Graamam Connect style).
7. **Founder dashboard:** friendly visual summaries — vertical status (yearly/
   quarterly charts per vertical), goal progress, budget vs spend, daily-slider
   rollup (who updated what today), assessment scores, community value score with
   weekly best/least + note option; comment/suggest from any card.
8. **Wallet block (per user):** amount at hand + transaction history (see §9).
9. **Personal dashboard (per user):** my tasks, my daily slider, my assessment
   scores, my own value score/standing (private to me).

## 7. Notifications (FCM push, v1; WhatsApp final phase; none can be turned off)

| Event | Recipients | When |
|---|---|---|
| Task assigned | assignee | immediate |
| Task due | assignee | 10:00 AM due day |
| Task overdue | assignee + lead | Tuesdays 10:00 AM |
| Task Done (pending verification) | lead + creator | immediate |
| Comment / token comment | tagged person | immediate |
| Blocked | lead | immediate |
| Token idle >2 days | lead, then Admin | daily check |
| Meeting reminder + RSVP | everyone | Tuesdays 10:00 AM (meeting 2:30–5 PM) |
| Weekly digest | Leads | Tuesdays 10:00 AM: objective status, performance, prompt to submit values ratings |
| Budget approval requested/decided | Founder / requester | immediate |

## 8. Budgets & approvals (v1)
- Lead creates budget alongside work plan: task budgets → roll up to objective →
  goal. Quarterly main goals get a quarterly budget approved by Founder.
- Weekly: leads may edit budgets with a mandatory change comment → Founder approval.
- Every approval documented with a token number ✅ confirmed pattern:
  `[VERT]-[YYYYMMDD]-[SEQ]` e.g. `FRM-20260714-003` (vertical code + date +
  3-digit daily sequence).
- All approvals immutable log (who, when, amount, comment).

## 9. Accounting (v1)
- Accounting role disburses approved weekly amounts; disbursement recorded.
- Each user has a wallet block: amount at hand + transaction history.
- Every transaction requires a bill attachment (mandatory, image/PDF).
- Leads close their weekly accounts by Tuesday, tallying against disbursed amount.
- Everything reflects in Founder dashboard (budget vs actual per vertical).
- Full payroll = still the later Salaries layer (unchanged).

## 10. Calendar sync
One-way Ops→Google Calendar (two-way later). OAuth consent at first login.
Meetings/events auto-sync; task due dates per user setting; goal + objective
target dates synced.

## 11. PWA & offline
Offline edits + sync-on-reconnect (Firestore persistence). Install prompt after
first login. Targets: Android 13+, Windows/Mac desktop (Chrome/Edge).

## 12. Demo mode ✅ DECIDED
- Entry: "Try demo" button on the login screen — no account needed.
- Storage: Graamam pattern — `demo_` namespace, localStorage only, never touches
  Firestore, zero backend.
- Scope: everything — tasks, quick capture, Kanban, verification, budgets,
  wallets, discussions — pre-loaded with sample data (English + Telugu).
- Role switcher: learner can switch between **Member and Lead views only**. No
  Admin, Founder, or Accounting roles in demo (those belong to Vamsi and Kalyan
  in the real app). Budget/verification flows are demonstrated with simulated
  approvals so the full cycle is still visible.
- Reset: manual reset button restores original sample data; changes otherwise
  persist on the device across sessions.

## 13. Non-goals v1
Salaries/payroll · Gantt · time tracking · report export · weighted progress
formula · WhatsApp channel · two-way calendar sync.

## 14. Seed data
Permanent users: Kalyan (Founder), Vamsi (Admin), Accounting dept account.
Verticals with default colors; leads/members assigned in-app. Tuesday meeting as
recurring event. Demo-mode sample data invented at build time.

## Remaining 🔶 (none block the build)
1. Community values list — supplied later, Admin-configurable in the meantime
2. Verification team names — assigned in-app after launch

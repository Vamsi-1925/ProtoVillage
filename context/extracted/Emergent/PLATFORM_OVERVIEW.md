# ProtoVillage Master — Unified Platform Overview

> Purpose of this document: the complete picture of ONE app that merges
> **Graamam Connect** (enterprise operations) and **Proto Village Ops**
> (village management). Hand this file — together with the two subfolders —
> to the AI app builder as the single source of truth.
>
> Folder map:
> - `Graamam Connect/` — the existing, feature-complete Graamam app
>   (graamam_v2.html single-file build, master data, process flows, notes,
>   UI project in graamam-ui/)
> - `ProtoVillage Ops/` — the full Ops specification (`ops_spec_v3.md` is the
>   build spec / complete picture), Founder presentation (pptx), flow diagrams
>   (PDF + 6 mermaid sources)

---

## 1. The one-app concept

ONE application, ONE login. After sign-in, an app-switcher screen shows two
tiles — the user sees only what their account has access to:

1. **Graamam Connect** — food-enterprise coordination: order → warehouse →
   production → procurement → dispatch pipeline, GST invoices, vendor POs +
   ratings, QC, expiry batches, store stock, receivables/payables, analytics,
   discussions. ALREADY BUILT as a localStorage single-file app; its only work
   here is migration (see §6).
2. **Proto Village Ops** — village/campus management: FY-aligned planning,
   verticals → goals → objectives → tasks, community verification with
   Done/Redo, 3-category work assessment, values ratings, budgets + approval
   tokens, weekly accounting with wallets, daily progress slider, Founder
   dashboard. FULL SPEC: `ProtoVillage Ops/ops_spec_v3.md`.

The Education platform is REMOVED from this build (future layer).

## 2. Shared foundation (build once, both sections use it)

- **Firebase**: Auth (shared user directory + session), Firestore
  (namespaces `graamam/*` and `ops/*` — each section fully independent),
  FCM push, Storage (bills, photos, voice notes), Google Calendar sync.
- **Auth is invite-only**: Admin/Founder pre-register each email + role(s);
  user sets password at first login; forgotten password = Admin resets, user
  sets a new one. No self-signup.
- **Per-section roles**: one person can have different roles in each section
  (e.g. Vamsi = Admin in both; a farming lead sees only Ops; a Graamam
  supervisor sees only Graamam). Role/user management lives in an Admin
  Console visible to Admin (Vamsi) + Founder (Kalyan) only.
- **PWA**: installs from browser, Android 13+ and Windows/Mac desktop;
  offline edits with sync-on-reconnect; English + Telugu toggle everywhere.
- **Demo modes**: both sections keep a local-only sandbox (Graamam's existing
  `gc2demo_` account preserved AS-IS; Ops gets a "Try demo" login-screen
  button, Member+Lead roles only, manual reset, localStorage only, never
  touches Firestore).
- **Design principle**: usable by anyone in the village with basic literacy —
  big touch targets, icons + labels, minimal jargon. Brand references in
  `D:\Claude\ProtoVillage Brand Data\` (Graamam_Design_System.md,
  ProtoVillage Brand book).

## 3. People (permanent accounts)

| Person | Platform role |
|---|---|
| Kalyan | Founder — visual dashboard of everything; approves all budgets; exclusive access to raw values-voting data; can comment/suggest anywhere; Admin Console access |
| Vamsi | Admin — full control of both sections via Admin Console (no fancy role name) |
| Accounting dept | Disburses approved money, records transactions |
| Vertical Leads / Members | Ops section, assigned in-app |
| Graamam staff (incl. "Namma" the Graamam Lead) | Graamam section, per existing app's role model |

## 4. Proto Village Ops — complete picture (details in ops_spec_v3.md)

- **Planning cadence**: Indian FY (Apr–Mar) → yearly plan per vertical (with
  chart) → 4 quarterly plans (set at the quarterly community meet + Founder's
  goals, quarterly budget approved by Founder) → 12 planned weeks per quarter
  → weekly Tuesday cycle → daily slider.
- **Verticals** (NOT final; add/rename/remove in-app, Admin only): starting
  set = Construction, Maintenance & Repairs, Farming, Cleanliness & Hygiene,
  Other. Each has a color and one Lead.
- **Hierarchy**: Vertical → Goal → Objective → Task (tasks may float).
  Progress auto-computes bottom-up, equal weight v1. Guided writing templates:
  goal = "To achieve [outcome] of [degree] within this quarter"; objective/
  task = "By doing this, I will achieve [goal]".
- **Weekly rhythm**: Tue 10 AM reminder + RSVP (meeting 2:30–5 PM) → Tuesday
  meeting verifies work, scores it, rates values, plans next week → Wed off →
  Thu new week block → work Thu–Tue. Overdue = not done by end of week block.
- **Task verdicts**: assignee marks Done → Pending Verification (counts toward
  progress immediately) → verification team at Tuesday meeting → **Done**
  (post-verification, closes) or **Redo** (returns with comments, progress
  rolled back).
- **Work assessment** (= the performance score, work-only): every verified
  task scored 1–10 in Necessity, Effectiveness, Hygiene & Beauty; average =
  task assessment score; aggregates per person + vertical.
- **Values** (separate from performance; measures growth in community
  responsibility, not salary): anonymous 1–10 votes on Leads at Tuesday
  meeting (optional voice/text note). Visibility: own score private to each
  person; ONLY the community-wide aggregate is public; system auto-flags
  weekly best/least for the Founder with a note option; raw votes =
  Founder-only vault (editable only after discussing with the voter; edits
  logged); value downfall → private unrecorded 1:1 with Founder.
- **Daily slider**: 0–100% in 10% steps against the weekly goal; locked
  except 5–6 PM daily window; feeds Founder's daily dashboard.
- **Quick capture**: 2-tap note/photo from anyone into any vertical's Lead
  triage queue; file / escalate to Admin / request suggestions; >2 days idle
  → remind Lead, then flag Admin; creator always sees pending/resolved.
- **Budgets & approvals**: budget built with the work plan (task → objective
  → goal rollup); quarterly approval by Founder; weekly changes need a
  mandatory comment + Founder approval; every approval gets an immutable
  token `[VERT]-[YYYYMMDD]-[SEQ]` (e.g. FRM-20260714-003).
- **Accounting**: Accounting disburses weekly amounts; per-user wallet
  (amount at hand + history); every transaction REQUIRES a bill attachment;
  Leads tally and close accounts each Tuesday; Founder dashboard shows budget
  vs actual per vertical. (Full payroll = later layer.)
- **Notifications (FCM push v1; WhatsApp final phase; none can be disabled)**:
  assigned/due 10 AM/overdue Tue 10 AM/done/comment-tag/blocked/token idle/
  meeting RSVP/weekly digest/budget approvals.
- **Views**: My Tasks This Week + tree landing; vertical-colored goal grid;
  Kanban (toggleable); search + full-text; Discussion tab (Graamam Connect
  style threads with @-tags); Founder dashboard; personal dashboard (own
  tasks, slider, assessment scores, own value score).
- **Calendar**: one-way Ops→Google Calendar; OAuth at first login; meetings/
  events auto-sync; task dates per user setting; goal/objective dates synced.

## 5. Flow diagrams (in `ProtoVillage Ops/`)

`ProtoVillageOps_Flow_Diagrams.pdf` (one page per flow) + editable mermaid
sources: 1 planning cadence · 2 task lifecycle · 3 quick capture · 4 budget
approval · 5 money flow · 6 values & visibility.

## 6. Graamam Connect — what changes, what doesn't

- **Doesn't change**: every existing feature and screen of
  `Graamam Connect/graamam_v2.html` (132 products, 47 recipes, 23 B2B + 185
  B2C customers embedded; FY-stamped tokens; GST invoicing; approvals;
  role-based sidebars; light/dark themes). Feature history + pending list:
  `Graamam Connect/graamam_notes.md`.
- **Changes**: storage migrates localStorage → Firestore (`graamam/*`);
  login replaced by the shared platform login + app-switcher; roles come from
  the shared user directory.
- **Must preserve**: the `gc2demo_` demo account exactly as-is — local-only,
  zero backend, never syncs with real data.

## 7. Build order

0. Firebase project + shared invite-only login + app-switcher (two tiles)
1. Ops core: planning cadence, verticals/goals/objectives/tasks, verification
   + assessment, quick capture, notifications, calendar, PWA
2. Ops money layer: budgets + tokens + wallets + weekly close
3. Values module + daily slider + Founder/personal dashboards
4. Graamam migration into the switcher (localStorage → Firestore)
5. Later: payroll layer; WhatsApp channel; two-way calendar; Education

## 8. Open items (do not block build)

- Community values list — Founder supplies; build as Admin-configurable.
- Verification team names — assigned in-app.
- Hosting: app subdomain (e.g. app.graamam.in) on Netlify/Vercel + Firebase
  backend (graamam.in itself stays on Shopify).

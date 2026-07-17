# ProtoVillage — Emergent Build Guide (screen-by-screen)

This app is built **one screen at a time** against a complete Stitch UI kit.
Each screen has a pixel-target mockup; Emergent reproduces it and wires it to
Firebase. This guide is the index; each phase gets its own prompt.

## The design system (binding)

`DESIGN_SYSTEM.md` — "Modern Humanist" token set. Raleway (headings) +
Nunito Sans (body), Material Symbols icons, primary teal `#005158`, warm
background `#fcf9f5`, terracotta/gold tertiary accents. Light + OLED dark.
Every screen uses these tokens; nothing invented.

## The Stitch UI kit

`stitch_ui_kit/` — 25 screens, most in light + OLED dark, each a folder with
`code.html` (Tailwind implementation) + `screen.png` (target). These ARE the
UI; Emergent matches them.

### Graamam Connect (enterprise) screens
orders · inventory · warehouse · production · procurement · producers ·
dispatch · store · dashboard · reports · new_batch_form

### Proto Village Ops (management) screens
my_week · goals · board · task_detail · quick_capture · triage_queue ·
budgets_lead_view · approvals_founder_view · founder_dashboard · wallet ·
accounts

### Shared
login_1 / login_2 · admin_console_1 / admin_console_2

## Build order (each = its own prompt, built + approved before the next)

**Phase 1 (current):** Graamam Orders page — trial to lock the component
library + Firebase wiring. Prompt: `PHASE_1_PROMPT.md`.

**Then, screen by screen (indicative):**
2. Shared login + app-switcher (login_1/2) + invite-only Firebase Auth
3. Graamam: Dashboard, Inventory, Warehouse, Production, Procurement,
   Producers, Dispatch, Store, Reports — migrate `graamam_v2.html` logic to
   Firestore behind these screens
4. Ops core: My Week, Goals, Board, Task Detail, Quick Capture, Triage Queue
5. Ops money: Budgets (lead), Approvals (founder), Wallet, Accounts
6. Dashboards: Founder Dashboard, Admin Console
7. Cross-cutting: FCM notifications, Google Calendar, PWA, English/Telugu,
   demo modes

## Product references (for logic behind each screen)

- `PLATFORM_OVERVIEW.md` — the whole platform in one file
- `ops_spec_v3.md` — authoritative Ops spec (rules behind Ops screens)
- `flow_1…6.mermaid` + `ProtoVillageOps_Flow_Diagrams.pdf` — Ops process flows
- `graamam_v2.html` — existing Graamam app (source of truth for Graamam logic)
- `graamam_notes.md`, `graamam_process_flow.mmd`, `graamam_demo_scenarios.md`,
  `Graamam_Master_Data.xlsx` — Graamam supporting detail

## Non-negotiables (every phase)

- Firebase backend (Auth shared; Firestore `graamam/*` + `ops/*`; FCM; Storage)
- Installable PWA (Android 13+, desktop); English + Telugu toggle
- Invite-only auth; simple, high-literacy-friendly UI
- Match the Stitch screen exactly; reuse the Phase-1 component library
- Preserve Graamam's `gc2demo_` demo account (local-only, never in Firestore)
- Don't add features not in the docs; don't drop features that are

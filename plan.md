# plan.md — ProtoVillage Phase 1 (Orders Screen)

## 1) Objectives
- Deliver **only** the Graamam Connect **Orders** screen (light + OLED dark) matching Stitch mockups pixel-for-pixel.
- Use **DESIGN_SYSTEM.md** tokens exclusively (fonts, colors, radii, spacing) and Material Symbols (FILL 1).
- Implement real data flow (no hardcoded rows): **FARM stack** backend as a **Firestore stand‑in** now; keep a repository interface that can be swapped to Firebase later.
- Extract reusable UI components: **Sidebar, TopBar, PageHeader, PillTabs, DataTable, StatusPill** (+ CreateOrderDialog).
- Core interactions: seed sample orders, filter by status tabs, create order writes + live refresh, row expand toggle, dark-mode persistence.

## 2) Implementation Steps

### Phase 1 — Core Flow POC (data contract + live updates)
(POC is small but mandatory here because the architecture must be swappable to Firebase later.)

**User stories (POC)**
1. As a user, I can call an endpoint to list orders and receive a stable document shape.
2. As a user, I can filter orders by status via `?status=`.
3. As a user, I can create an order and immediately see it in subsequent list calls.
4. As a user, seeded orders appear on first run without duplicates.
5. As a developer, I can swap the repository implementation later without changing UI components.

**POC tasks**
- Backend (FastAPI + MongoDB)
  - Define `Order` schema mirroring Firestore-doc style (id, order_id, customer{}, items_count/summary, date, total, status, created_at).
  - Implement `GET /api/graamam/orders?status=` and `POST /api/graamam/orders`.
  - Add idempotent seeding on startup (match mockup rows + a few extras for tab counts).
- Frontend contract proof
  - Implement `ordersRepository` with `list({status})` + `create(payload)` using `REACT_APP_BACKEND_URL`.
  - Minimal script/page to verify: fetch → render JSON count; create → re-fetch.
- Fix until stable: correct status enum mapping, sorting (newest first), validation errors returned cleanly.

### Phase 2 — V1 App Development (Orders screen + components)

**User stories (V1)**
1. As a producer ops user, I see the Orders page layout: fixed sidebar, top bar, header, tabs, and table.
2. As a user, the table renders orders from the backend with correct columns and visual chips/pills.
3. As a user, clicking a status pill tab filters the table and updates the active tab count badge.
4. As a user, clicking **Create Order** opens a modal; submitting creates a record and updates the table without refresh.
5. As a user, I can toggle dark mode via the moon icon; preference persists in localStorage.
6. As a user, I can expand/collapse a row to reveal a simple details section (MVP).

**V1 build tasks**
- Styling system
  - Tailwind (CDN) + token mapping copied from Stitch `code.html` and DESIGN_SYSTEM.md; `darkMode: 'class'`.
  - Load Google Fonts (Raleway, Nunito Sans) and Material Symbols.
- App scaffolding
  - React app with single route `/` → `OrdersPage` (no other screens).
  - `ThemeProvider` toggles `document.documentElement.classList` and persists setting.
- Reusable components (match Stitch markup)
  - `Sidebar` (220px fixed, active Orders item + badge).
  - `TopBar` (right-aligned toggle + avatar).
  - `PageHeader` (title/subtitle + Create Order button).
  - `PillTabs` (New/Packing/Dispatched/Delivered; active styling).
  - `StatusPill` (maps status → exact color tokens per mockup).
  - `DataTable` (columns, hover, action chevron, expandable rows).
  - `CreateOrderDialog` (minimal form; uses tokens/forms styling).
- Data wiring
  - `OrdersPage` composes components, holds `activeStatus`, calls repository, computes counts, handles optimistic UI or refetch.
  - Ensure **no hardcoded HTML rows**; only seed data in backend.
- End-to-end testing
  - Run testing agent to validate all V1 user stories (light/dark, filter, create, persistence).

### Phase 3 — Hardening (still Phase 1 scope; no new screens)

**User stories (Hardening)**
1. As a user, I see clear loading and empty states for each tab.
2. As a user, I get a readable error toast when the backend is unavailable.
3. As a user, form validation prevents invalid totals/statuses.
4. As a user, table remains usable on smaller widths via horizontal scroll.
5. As a developer, repository swap to Firebase requires changing only the adapter module.

**Hardening tasks**
- Add loading/empty/error UI states (token-consistent).
- Validate Create Order inputs (required fields, numeric total, status enum).
- Add basic sorting and stable keys; prevent duplicate submits.
- Document the Firebase swap path (one paragraph + module boundaries).
- Run testing agent again after fixes.

## 3) Next Actions
1. Implement Phase 1 POC: FastAPI routes + Mongo seed + repository adapter + quick verification.
2. Build Phase 2 UI: replicate Stitch Orders light theme markup into React components; add dark-mode classes.
3. Wire data: list/filter/create + live refresh; verify pixel match against screenshots.
4. Run automated E2E testing; fix any regressions.
5. Produce the Phase 1 delivery note: stack + how next screens plug into the same component/repo pattern.

## 4) Success Criteria
- Only the **Orders** page exists and is reachable; no Inventory/Dashboard/Ops screens implemented.
- Light + OLED dark modes match Stitch screenshots closely (spacing, typography, colors, radii).
- Components extracted: Sidebar, TopBar, PageHeader, PillTabs, DataTable, StatusPill (+ CreateOrderDialog).
- Orders data is loaded from backend (Firestore stand-in), seeded idempotently.
- Tabs filter by status; active tab shows correct count badge.
- Create Order writes to backend and appears immediately without refresh.
- Dark mode toggle works and persists.
- Testing agent passes end-to-end without critical issues.

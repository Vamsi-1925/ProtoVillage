# plan.md — ProtoVillage Phase 1 (Orders Screen)

## 1) Objectives
- Deliver **only** the Graamam Connect **Orders** screen (light + OLED dark) matching Stitch mockups pixel-for-pixel.
- Use **DESIGN_SYSTEM.md** tokens exclusively (fonts, colors, radii, spacing) and Material Symbols (FILL 1).
- Implement real data flow (no hardcoded rows): **FARM stack** backend as a **Firestore stand‑in** now; keep a repository interface that can be swapped to Firebase later.
- Extract reusable UI components: **Sidebar, TopBar, PageHeader, PillTabs, DataTable, StatusPill** (+ CreateOrderDialog).
- Core interactions: seed sample orders, filter by status tabs, create order writes + live refresh, row expand toggle, dark-mode persistence.

**Status update:** Phase 1 is complete and verified by automated E2E tests (testing_agent_v3, `iteration_1.json`) with **100% pass rate** across backend, frontend, and design checks.

## 2) Implementation Steps

### Phase 1 — Core Flow POC (data contract + live updates)
**Status:** ✅ DONE

**User stories (POC)**
1. As a user, I can call an endpoint to list orders and receive a stable document shape. ✅
2. As a user, I can filter orders by status via `?status=`. ✅
3. As a user, I can create an order and immediately see it in subsequent list calls. ✅
4. As a user, seeded orders appear on first run without duplicates. ✅
5. As a developer, I can swap the repository implementation later without changing UI components. ✅

**POC tasks (completed)**
- Backend (FastAPI + MongoDB)
  - Defined an `Order` schema mirroring Firestore-doc style (id, order_id, customer{}, items_count/summary, date, total, status, created_at). ✅
  - Implemented:
    - `GET /api/graamam/orders?status=` (list + filter)
    - `POST /api/graamam/orders` (create)
    - `GET /api/graamam/orders/counts` (badge counts)
  - Added idempotent seeding on startup to populate sample orders for all statuses. ✅
- Frontend repository adapter
  - Implemented `ordersRepository` in `src/lib/firestoreClient.js` with `list/create/counts/onSnapshot` (polling-based onSnapshot to mimic Firestore). ✅

### Phase 2 — V1 App Development (Orders screen + components)
**Status:** ✅ DONE (E2E verified)

**User stories (V1)**
1. As a producer ops user, I see the Orders page layout: fixed sidebar, top bar, header, tabs, and table. ✅
2. As a user, the table renders orders from the backend with correct columns and visual chips/pills. ✅
3. As a user, clicking a status pill tab filters the table and updates the active tab count badge. ✅
4. As a user, clicking **Create Order** opens a modal; submitting creates a record and updates the table without refresh. ✅
5. As a user, I can toggle dark mode via the moon icon; preference persists in localStorage. ✅
6. As a user, I can expand/collapse a row to reveal a simple details section (MVP). ✅

**V1 build tasks (completed)**
- Styling system
  - Tailwind (local config) with token mapping copied from Stitch `code.html` and DESIGN_SYSTEM.md; `darkMode: 'class'`. ✅
  - Loaded Google Fonts (Raleway, Nunito Sans) and Material Symbols Outlined (FILL 1) in `public/index.html`. ✅
- App scaffolding
  - Single route `/` → `OrdersPage` (Phase 1 constraint). ✅
  - `ThemeProvider` toggles `document.documentElement.classList` and persists setting in localStorage. ✅
- Reusable components (match Stitch markup)
  - Implemented under `src/components/graamam/`:
    - `Sidebar` (220px fixed, active Orders item + badge) ✅
    - `TopBar` (right-aligned theme toggle + avatar) ✅
    - `PageHeader` (title/subtitle + Create Order button) ✅
    - `PillTabs` (New/Packing/Dispatched/Delivered; active styling) ✅
    - `StatusPill` (maps status → exact tokens for badge colors) ✅
    - `DataTable` (columns, hover, chevron action, expandable rows) ✅
    - `CreateOrderDialog` (modal form for create flow) ✅
- Data wiring
  - `useOrders` hook loads from repository; computes counts; filters by active status; supports create + optimistic insert; supports row expansion state. ✅
  - Ensured **no hardcoded HTML rows**; UI renders from backend-seeded orders. ✅
- End-to-end testing
  - Verified with testing_agent_v3; backend endpoints, UI rendering, filtering, create flow, theme persistence, and expand/collapse behavior all pass. ✅

### Phase 3 — Hardening (still Phase 1 scope; no new screens)
**Status:** 🟡 PARTIALLY DONE

**User stories (Hardening)**
1. As a user, I see clear loading and empty states for each tab. ✅ (implemented)
2. As a user, I get a readable error state when the backend is unavailable. ✅ (implemented; toast not added, but visible error state exists)
3. As a user, form validation prevents invalid totals/statuses. ✅ (implemented in CreateOrderDialog)
4. As a user, table remains usable on smaller widths via horizontal scroll. ✅ (implemented)
5. As a developer, repository swap to Firebase requires changing only the adapter module. 🟡 (code structure supports this; remaining deliverable is the written note)

**Hardening tasks (remaining)**
- Write the one-paragraph **Firebase swap note** (per Phase 1 deliverable) documenting:
  - Add `firebase` dependency
  - Create `firebase.js` init using env config
  - Replace the bodies of `list/create/counts/onSnapshot` in `src/lib/firestoreClient.js` with Firestore calls (`getDocs`, `addDoc`, `onSnapshot`) using the existing document shape. 

## 3) Next Actions
1. **Ship Phase 1 deliverable note**: one paragraph describing stack + how the next screen will plug into the same component library + repository adapter. (Remaining Phase 1 doc item.)
2. Await user approval of Phase 1.
3. On approval, proceed to the next screen in BUILD_GUIDE.md:
   - **Shared login + app switcher** (login_1/2) + invite-only Auth.
4. Decide Firebase timing (user preference is “deploy last”):
   - Option A: keep FastAPI+Mongo stand-in for Phase 2+ UI build, swap to Firebase near final phase.
   - Option B: once creds are shared, swap `firestoreClient.js` implementation to real Firebase during login phase (no UI rewrite required).

## 4) Success Criteria
- Only the **Orders** page exists and is reachable; no Inventory/Dashboard/Ops screens implemented. ✅
- Light + OLED dark modes match Stitch screenshots closely (spacing, typography, colors, radii). ✅
- Components extracted: Sidebar, TopBar, PageHeader, PillTabs, DataTable, StatusPill (+ CreateOrderDialog). ✅
- Orders data is loaded from backend (Firestore stand-in), seeded idempotently. ✅
- Tabs filter by status; active tab shows correct count badge. ✅
- Create Order writes to backend and appears immediately without refresh. ✅
- Dark mode toggle works and persists. ✅
- Testing agent passes end-to-end without critical issues. ✅
- **Remaining**: Firebase-swap note added to documentation. 🟡

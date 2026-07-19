# plan.md — ProtoVillage (Graamam Connect) — Phase-wise Build

## 1) Objectives
- Deliver the **complete Graamam Connect** product (all core screens + flows) as provided in the Stitch UI kit inputs.
- Use **DESIGN_SYSTEM.md** tokens exclusively (fonts, colors, radii, spacing) and Material Symbols (FILL 1).
- Implement real end-to-end data flow (**no hardcoded rows**) using the current **FARM stack** backend as a **Firestore stand‑in**.
- Keep repository interfaces **Firestore-shaped** so we can swap to real Firebase later by changing only adapter method bodies.
- Build and reuse a consistent component library across all Graamam screens.
- Localize for **India-first context**:
  - Currency: **₹ INR** with `en-IN` digit grouping
  - Time: **IST** (`Asia/Kolkata`) formatting for dates/timestamps
  - India GST concepts: state codes, GSTIN/PAN fields, CGST/SGST vs IGST
- Privacy-first public build:
  - Ensure seed/master data contains **no real customer / company / recipe / producer / village / product** data.

**Status update (current):**
- Phase 1 (Orders POC) completed earlier and E2E-verified (testing_agent_v3 `iteration_1.json`) ✅
- Privacy hardening completed ✅
- Orders feature upgraded to match `graamam_v2.html` (New/Edit Order modal + Orders list structure/logic) ✅
- **Warehouse stock-check gate implemented (pipeline continuity):** orders created at `warehouse_check` now appear in Warehouse and can advance to `ready_dispatch` or `production_pending` ✅
- **Invoice timing fixed (UI gating):** “Raise Invoice” action is now visible/usable only when order status is `dispatched` ✅
- Automated testing policy:
  - By standing instruction, **no automated testing agents** are run unless explicitly requested.
  - Self-checks performed: backend/FE compile + targeted endpoint checks via curl ✅

---

## 2) Implementation Steps

### Phase 1 — Core Flow POC (Orders data contract + live-ish updates)
**Status:** ✅ DONE

**User stories (POC)**
1. As a user, I can call an endpoint to list orders and receive a stable document shape. ✅
2. As a user, I can filter orders by status via `?status=`. ✅
3. As a user, I can create an order and immediately see it in subsequent list calls. ✅
4. As a user, seeded orders appear on first run without duplicates. ✅
5. As a developer, I can swap repository implementation later without changing UI components. ✅

**POC tasks (completed)**
- Backend (FastAPI + MongoDB)
  - Implemented `GET /api/graamam/orders?status=` (list + filter) ✅
  - Implemented `POST /api/graamam/orders` (create) ✅
  - Implemented `GET /api/graamam/orders/counts` (badge counts) ✅
  - Added idempotent seeding on startup ✅
- Frontend repository adapter
  - Implemented `ordersRepository` interface: `list/create/counts/onSnapshot` ✅

---

### Phase 2 — Complete Graamam Connect (all screens + flows, India-localized)
**Status:** ✅ DONE (build completed; user validation ongoing)

#### Phase 2A — India localization layer
**Status:** ✅ DONE
- Currency formatting switched to INR (`₹`) using `en-IN` digit grouping ✅
- Added helpers:
  - `formatCurrency` (INR)
  - `formatCompactINR` (K/L/Cr)
  - `formatOrderDate` (IST)
  - `formatDateTimeIST` (IST timestamps)
  - `formatTimeAgo` (activity feed)
- Added India GST states library for forms:
  - `frontend/src/lib/indianStates.js` mirroring v2’s GST state list + helpers ✅

#### Phase 2B — Backend expansion (Firestore stand-in for all Graamam domains)
**Status:** ✅ DONE
All routes are registered under `/api` and seeded idempotently on startup.

- Orders (upgraded to v2 replica)
  - `GET /api/graamam/orders` ✅
  - `GET /api/graamam/orders/counts` ✅
  - `POST /api/graamam/orders` ✅ (rich payload; generates FY tokens)
  - `POST /api/graamam/orders/{order_id}/edit` ✅
  - `POST /api/graamam/orders/{order_id}/cancel` ✅
  - `POST /api/graamam/orders/{order_id}/status` ✅
  - FY token counter store: `graamam_counters` ✅

- **Warehouse (stock-check gate; v2 pgWarehouse replica)** ✅
  - `GET /api/graamam/warehouse/pending` ✅ — orders at `warehouse_check` with per-line availability vs finished-goods stock
  - `POST /api/graamam/warehouse/{order_id}/ready` ✅ — if all lines available: status → `ready_dispatch` + audit + warehouse outcome fields
  - `POST /api/graamam/warehouse/{order_id}/raise-production` ✅ — if short: status → `production_pending`, mint `PROD-<FY>-####`, create production token doc, audit
  - `GET /api/graamam/warehouse/processed` ✅ — warehouse-processed orders (ready_for_dispatch | production_raised)
  - `GET /api/graamam/warehouse/finished-goods` ✅ — finished-goods stock reference from Products + Inventory
  - Design choice: no separate `wh_tokens` collection; processed metadata stored on order (`wh_outcome`, `wh_processed_by`, `wh_processed_at`) ✅

- Master data (feeds Orders/Warehouse)
  - `GET /api/graamam/master/products` ✅
  - `GET /api/graamam/master/customers/b2b` ✅
  - `GET /api/graamam/master/customers/b2c` ✅
  - `GET /api/graamam/master/company` ✅

- Producers ✅
- Inventory ✅
- Batches ✅
- Production ✅
- Procurement ✅
- Dispatch ✅
- Store ✅
- Reports ✅
- Dashboard ✅

**Invoice integration update**
- `POST /api/graamam/invoices/from-order/{order_id}` prefers order snapshot `bill_to` (state/GSTIN) + `items[]` when present, falls back to legacy matching logic ✅

**Legacy compatibility / migration**
- Seeded/legacy orders (GC-####) remain valid: new fields are Optional and list endpoints return both shapes ✅
- Warehouse availability for legacy orders with no `items[]` is treated as **not verifiable** (forces “Raise Production” path instead of guessing) ✅

**Warehouse demo stock seeding**
- Updated `_seed_qty()` in `graamam_master.py` so finished-goods stock is intentionally scarce:
  - Only `P001` (qty 10) and `P006` (qty 15) are stocked; all other SKUs start at 0 ✅
  - Ensures out-of-the-box demo of both paths: Ready for Dispatch vs Raise Production ✅

**Bug note & fix during implementation**
- Removed an accidental side-effect: `/warehouse/pending` previously backfilled WH tokens on GET, which could collide with real WH tokens due to shared counters. GET is now side-effect free; WH tokens are only minted at order creation or explicit actions ✅

#### Phase 2C — Frontend expansion (all screens wired + reusable component library)
**Status:** ✅ DONE

**Routes/screens built (Graamam Connect complete)**
1. `/` — DashboardPage ✅
2. `/orders` — OrdersPage ✅ (v2 replica)
3. `/inventory` — InventoryPage ✅
4. `/production` — ProductionPage ✅
5. `/procurement` — ProcurementPage ✅
6. `/warehouse` — WarehousePage ✅ (now the stock-check gate)
7. `/dispatch` — DispatchPage ✅
8. `/producers` — ProducersPage ✅
9. `/store` — StorePage ✅
10. `/reports` — ReportsPage ✅
11. `/settings` — SettingsPage ✅

**Orders UI (rebuilt to match graamam_v2.html)**
- New/Edit Order modal (B2B/B2C toggle, customer autofill, items grid, live ₹ totals, notes, create tokens) ✅
- Orders list columns + action gating ✅
- Order History modal (audit trail) ✅

**Warehouse UI (rebuilt to match graamam_v2.html pgWarehouse)** ✅
- Removed old producer-batches table, fake godown copy, hardcoded KPIs ✅
- New structure:
  1) Pending Stock Check (cards with ✓/✗ per item + single action button)
  2) Processed table (WH token, ORD token, outcome, processed by/date)
  3) Collapsible Finished Goods reference (closed by default)

**Invoice timing (UI-only gating)** ✅
- “Raise Invoice” icon action is shown only when `order.status === 'dispatched'`.
- Backend invoice generation logic remains unchanged (gating is intentionally UI-only per requirements).

**Frontend data layer**
- Extended repositories in `src/lib/firestoreClient.js` ✅
  - `ordersRepository.update/cancel/history` ✅
  - `masterRepository` ✅
  - `threadsRepository` ✅
  - **`warehouseRepository`** ✅ (pending/processed/finishedGoods/markReady/raiseProduction)

---

### Phase 3 — Privacy hardening (contest-safe seed/master data)
**Status:** ✅ DONE

**Scope completed**
- Removed all real customer/recipe data from seed master JSON ✅
- Removed all real legal/financial/company/operational data from backend `COMPANY` + frontend hardcoded lines ✅
- Replaced real-sounding producers/villages/products in seed routers with dummy names ✅
- Reduced `products` to 12 dummy SKUs and `costing` to 4 dummy rows ✅
- Reseeded Mongo collections by dropping affected collections and restarting (idempotent seeding) ✅
- Verified via grep for forbidden strings (zero matches outside `/context/`) ✅

---

### Phase 4 — Hardening + Verification (post-build)
**Status:** 🟡 NOT RUN (deferred by user request)

**Scope**
- Manual validation checklist-driven QA (no automated testing agent unless explicitly requested).
- Improve resilience (edge cases, validation completeness, better error recovery).

**Known environment note**
- Headless browser in this environment intermittently fails to complete login UI flow (backend login works via curl). Treated as environment-specific and not pursued further per “no deep QA sweeps” instruction.

---

### Phase 5 — Firebase/Auth swap + Deployment (final phase)
**Status:** ⏳ Planned

**Goal**
- Replace the FastAPI/Mongo stand-in with real Firebase Auth + Firestore while keeping the UI intact.

**Tasks**
- Add Firebase (`firebase` npm dependency) and create `firebase.js` initialization from env config.
- Swap repository adapter method bodies in `src/lib/firestoreClient.js` to real Firestore calls:
  - `list` → `getDocs(query(...))`
  - `create` → `addDoc(...)`
  - `counts` → derived aggregation strategy (client-side compute or Cloud Function)
  - `onSnapshot` → Firestore `onSnapshot(query(...))`
- Enable invite-only auth (per BUILD_GUIDE/login phases) and ensure `gc2demo_` remains local-only.
- Deployment steps only after functional sign-off.

---

## 3) Next Actions
1. **User review (targeted to pipeline continuity):**
   - Create a new B2B order → confirm it appears in **Warehouse → Pending Stock Check** with ✓/✗ per item.
   - Confirm **Ready for Dispatch** path works when stock is sufficient.
   - Confirm **Raise Production** path generates a PROD token and moves to Production.
2. **User review (invoice timing):**
   - Confirm “Raise Invoice” icon is hidden until an order reaches status **Dispatched**, then appears.
3. Optional: if desired, add a sidebar badge for warehouse pending count (UI nicety; not required).
4. When you explicitly say “RUN THE TESTING AGENT”, run `testing_agent_v3` for full app coverage.
5. After functional sign-off, execute the Firebase + Auth swap.

---

## 4) Success Criteria
- Graamam Connect is fully functional end-to-end (all screens listed above working with backend data + write flows). ✅ (build implemented)
- India-first localization is consistent:
  - ₹ INR formatting and Indian digit grouping ✅
  - IST date/time formatting across UI ✅
  - India GST state selection + CGST/SGST vs IGST logic consistent ✅
- Orders page is an exact functional replica of `graamam_v2.html` (structure/fields/logic), restyled with Modern-Humanist design system ✅
- **Warehouse page acts as the real stock-check gate**: orders at `warehouse_check` are visible and can advance ✅
- **Invoice raising is only exposed after dispatch (UI gating)** ✅
- No "$" / USD anywhere in the UI ✅
- Privacy: no real company/customer/recipe/producer/village/product data anywhere in seed/master data ✅
- Firestore swap remains a single-module change (repository adapter bodies) ⏳ planned
- Automated testing remains deferred unless explicitly requested 🟡

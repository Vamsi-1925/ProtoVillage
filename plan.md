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
  - Sample entities: Indian names, villages, products, addresses, couriers, suppliers.

**Status update:**
- Phase 1 (Orders screen) was completed earlier and E2E-verified (testing_agent_v3 `iteration_1.json`) ✅
- Phase 2 (Complete Graamam Connect app: 10+ routes/screens + flows) is now **implemented and wired** ✅
- Per user request for Phase 2: **no automated testing was run** (only Phase 1 testing remains on record).

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
**Status:** ✅ DONE (build completed; user validation pending)

#### Phase 2A — India localization layer
**Status:** ✅ DONE
- Currency formatting switched to INR (`₹`) using `en-IN` digit grouping ✅
- Added helpers:
  - `formatCurrency` (INR)
  - `formatCompactINR` (K/L/Cr)
  - `formatOrderDate` (IST)
  - `formatDateTimeIST` (IST timestamps)
  - `formatTimeAgo` (activity feed)
- Seed data updated across the product:
  - Indian customers, producers, villages/states, products, addresses ✅
  - Indian couriers (Delhivery, Blue Dart, DTDC, Ecom Express, Shiprocket, India Post Speed Post, XpressBees) ✅
  - Indian suppliers (Kadalundi Apiary Co., Kumta Ceramics, Bengaluru Packaging Ltd.) ✅

#### Phase 2B — Backend expansion (Firestore stand-in for all Graamam domains)
**Status:** ✅ DONE
All routes are registered under `/api` and seeded idempotently on startup.
- Orders
  - `GET /api/graamam/orders` ✅
  - `GET /api/graamam/orders/counts` ✅
  - `POST /api/graamam/orders` ✅
  - `POST /api/graamam/orders/{order_id}/status` ✅ (dispatch integration)
- Producers
  - `GET /api/graamam/producers` ✅
  - `GET /api/graamam/producers/villages` ✅
  - `GET /api/graamam/producers/counts` ✅
  - `POST /api/graamam/producers` ✅
- Inventory
  - `GET /api/graamam/inventory` ✅
  - `GET /api/graamam/inventory/summary` ✅
  - `POST /api/graamam/inventory` ✅
  - `POST /api/graamam/inventory/{sku}/adjust` ✅
- Batches
  - `GET /api/graamam/batches` ✅
  - `GET /api/graamam/batches/summary` ✅
  - `POST /api/graamam/batches` ✅
- Production
  - `GET /api/graamam/production` ✅
  - `POST /api/graamam/production` ✅
  - `POST /api/graamam/production/{token_id}/status` ✅
- Procurement
  - `GET /api/graamam/procurement` ✅
  - `GET /api/graamam/procurement/summary` ✅
  - `POST /api/graamam/procurement` ✅
  - `POST /api/graamam/procurement/{request_id}` ✅ (kanban transitions)
- Dispatch
  - `GET /api/graamam/dispatch/queue` ✅ (orders in packing)
  - `GET /api/graamam/dispatch/recent` ✅
  - `GET /api/graamam/dispatch/history` ✅
  - `POST /api/graamam/dispatch/mark` ✅ (creates shipment + flips order status to dispatched)
- Store
  - `GET /api/graamam/store` ✅
  - `POST /api/graamam/store/receive` ✅
  - `POST /api/graamam/store/sale` ✅
  - `GET /api/graamam/store/sales` ✅
  - `GET /api/graamam/store/summary` ✅
- Reports
  - `GET /api/graamam/reports/orders|inventory|producers|sales` ✅
- Dashboard
  - `GET /api/graamam/dashboard/kpis` ✅
  - `GET /api/graamam/dashboard/production-overview` ✅
  - `GET /api/graamam/dashboard/activity` ✅
  - `GET /api/graamam/dashboard/alerts` ✅
  - `GET /api/graamam/dashboard/warehouse` ✅

**One-time migration handling**
- Legacy dollar-priced seed orders are detected and cleared automatically on startup, then reseeded with INR data ✅

#### Phase 2C — Frontend expansion (all screens wired + reusable component library)
**Status:** ✅ DONE

**Routes/screens built (Graamam Connect complete)**
1. `/` — **DashboardPage** ✅
   - KPIs, weather advisory, production overview tabs, activity feed
2. `/orders` — **OrdersPage** ✅
   - Phase 1 screen retained + upgraded to INR/IST + Indian samples
3. `/inventory` — **InventoryPage** ✅
   - Status filter pills, category checkboxes, search, inventory table
   - **New Batch** slide-over → creates a batch
4. `/production` — **ProductionPage** ✅
   - Token list, production slip, shortage → Procure link, start/complete/cancel
5. `/procurement` — **ProcurementPage** ✅
   - Kanban columns + flows: approve → PO raised → mark purchased → finalize
6. `/warehouse` — **WarehousePage** ✅
   - Warehouse KPIs + latest batches + CTA to dispatch
7. `/dispatch` — **DispatchPage** ✅
   - Queue from packing orders + courier selection + mark dispatched → updates order status
8. `/producers` — **ProducersPage** ✅
   - Producer cards + village filter + register producer drawer
9. `/store` — **StorePage** ✅
   - Store stock + record sale drawer (UPI/Cash/Card) + sales table
10. `/reports` — **ReportsPage** ✅
   - Report builder + quick ranges + CSV/PDF export
11. `/settings` — **SettingsPage** ✅
   - Preference cards (appearance/language/currency/GSTIN/notifications/data)

**Reusable components (BUILD_GUIDE.md compliance)**
- Phase 1 components (reused across screens):
  - `Sidebar`, `TopBar`, `PageHeader`, `PillTabs`, `DataTable`, `StatusPill`, `CreateOrderDialog` ✅
- New shared components for full app:
  - `AppShell` (sidebar + topbar chrome) ✅
  - `KPICard` ✅
  - `ActivityFeed` ✅
  - `SlideOver` (right-drawer pattern; used for New Batch + other forms) ✅
  - `EmptyState` ✅
  - `SearchInput` ✅
  - `Icon` ✅

**Frontend data layer**
- Expanded `src/lib/firestoreClient.js` into multiple Firestore-shaped repositories:
  - `ordersRepository`, `producersRepository`, `inventoryRepository`, `batchesRepository`, `productionRepository`, `procurementRepository`, `dispatchRepository`, `storeRepository`, `reportsRepository`, `dashboardRepository` ✅

---

### Phase 3 — Hardening + Verification (post-build)
**Status:** 🟡 NOT RUN (deferred by user request)

**Scope**
- Run full end-to-end verification across all Graamam screens and actions.
- Improve resilience (edge cases, empty states per screen, form validation completeness, better error recovery).

**Notes**
- Phase 1 Orders testing remains valid; Phase 2 testing intentionally skipped.

---

### Phase 4 — Firebase/Auth swap + Deployment (final phase)
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
1. **User review**: Inspect the full Graamam Connect build across all routes (Dashboard, Orders, Inventory, Production, Procurement, Warehouse, Dispatch, Producers, Store, Reports, Settings).
2. Confirm any copy/terminology changes needed for Indian context (units, GST, addresses, language toggles).
3. When you say “go”, run `testing_agent_v3` for full app coverage (all screens and write flows).
4. After functional sign-off, execute the **Firebase + Auth swap** and only then proceed to deployment.

---

## 4) Success Criteria
- Graamam Connect is fully functional end-to-end (all screens listed above working with backend data + write flows). ✅ (build implemented)
- India-first localization is consistent:
  - ₹ INR formatting and Indian digit grouping ✅
  - IST date/time formatting across UI ✅
  - Indian sample data (names, villages, products, couriers, suppliers) ✅
- UI remains consistent with DESIGN_SYSTEM.md tokens; light + OLED dark modes work across the app ✅
- All Graamam screens reuse the shared component library and repository adapters ✅
- Firestore swap remains a single-module change (repository adapter bodies) ⏳ planned
- Testing is pending for the whole app (intentionally deferred) 🟡

# ProtoVillage — Phase 1 delivery note

## Stack

- **UI**: React 19 (CRA + Craco) + Tailwind CSS (local config, `darkMode: 'class'`).
  All Modern Humanist tokens from `DESIGN_SYSTEM.md` are mirrored 1:1 in
  `frontend/tailwind.config.js` (colors like `primary-container`,
  `tertiary-fixed-dim`, `inverse-surface`, `outline-variant`; fonts
  `headline`/`display` → Raleway, `body`/`label` → Nunito Sans; icons via
  Material Symbols Outlined with `FILL 1`). No shadcn styles are used on the
  Orders page — components are built directly against the token set to match
  the Stitch UI kit reference `stitch_ui_kit/orders_light_theme/code.html`.
- **Data layer**: FastAPI + MongoDB, exposing `/api/graamam/orders`
  (`GET` list/filter, `POST` create, `GET /counts`). Documents mirror the
  target Firestore shape (`{ id, order_id, customer{name,initials,avatar_url},
  items_count, items_summary, date, total, status, created_at }`). Seed
  orders are inserted idempotently on startup so first-run rendering + tab
  counts work without any manual action.
- **Repository adapter** (`frontend/src/lib/firestoreClient.js`): thin module
  exposing `ordersRepository.{ list, counts, create, onSnapshot }` — the
  exact surface a real Firestore repo will have. `onSnapshot` is polling-based
  today (mimicking Firestore's live updates); every UI component consumes
  this adapter, so **no component code changes when we swap to real Firebase.**

## How the next screen plugs in

Every future Graamam screen (Inventory, Dashboard, Producers, Reports, …) and
every Ops screen (My Week, Board, Wallet, …) reuses the exact same primitives
delivered in Phase 1:

1. **Shell**: `<Sidebar />` + `<TopBar />` provide the fixed nav + toggles.
   Add a new nav entry in `Sidebar.jsx` when a screen is built, and pass an
   `activeKey` to highlight it.
2. **Layout**: `<PageHeader />` gives the title + subtitle + primary action
   pattern; screens with filters keep `<PillTabs />`, screens with tabular
   data keep `<DataTable />`, and any status column keeps `<StatusPill />`.
3. **Data**: Each screen ships a `useX` hook + a per-collection adapter (e.g.
   `producersRepository`, `inventoryRepository`) that mirrors
   `ordersRepository`. When Firebase is finally wired, only these adapter
   files change — component code stays untouched.
4. **Theme**: `ThemeProvider` continues to control the `dark` class on
   `<html>`; every new component only needs to spell out both light and dark
   token classes (as done throughout the Orders page).

## Firebase swap path (for a later phase)

- `yarn add firebase` in `frontend/`.
- Add a `frontend/src/lib/firebase.js` that reads
  `REACT_APP_FIREBASE_*` env vars and initialises Firestore + Auth.
- Replace the body of the four methods in `firestoreClient.js`
  (`list`, `counts`, `create`, `onSnapshot`) with `getDocs(query(collection(db,
  'graamam_orders'), where('status','==',status)))`, `addDoc(...)`, and
  Firestore's native `onSnapshot(query(...))`. Document shape is already
  Firestore-native, so **no UI, hook, or component code needs to change.**
- Preserve the `gc2demo_` local demo path per Phase 1 constraint: it must
  never be wired into Firestore.

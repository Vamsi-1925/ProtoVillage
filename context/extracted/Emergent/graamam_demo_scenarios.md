# Graamam Connect — Demo Scenarios

_Example situations for every feature. Use these to present or walk a team through the app._

**Demo logins**

| Login ID | Password | Name | Role |
|---|---|---|---|
| `admin` | admin123 | Admin (You) | Admin |
| `arjun` | wh123 | Arjun Kumar | Warehouse Lead |
| `ravi` | prod123 | Ravi Mohan | Production Lead |
| `suresh` | stock123 | Suresh Pillai | Stock Team |
| `divya` | acc123 | Divya Rani | Accounts |
| `krishna` | proc123 | Krishna Das | Procurement |

**Sample products:** Coconut Oil 500ml · Groundnut Oil 500ml · Mixed Oil 200ml

---

## PART A — Two end-to-end stories (these touch most features)

### Story 1 — "Stock is available, ship it" (the fast path)

**Situation:** A retailer, *Sri Lakshmi Stores*, orders **40 bottles of Coconut Oil 500ml**. The warehouse already has enough finished stock.

1. **Admin** logs in → **Orders → New Order** → picks Coconut Oil 500ml, qty 40, customer "Sri Lakshmi Stores".
   - System generates **Order Token `ORD-0001`** and a linked **Warehouse Token `WH-0001`**.
2. **Arjun (Warehouse)** logs in → sees `WH-0001` waiting. The system has **already checked finished-goods stock automatically** and shows a green **"✓ Stock Available — 35 in stock, need 40"**… (or red "Insufficient" if short). He clicks **"Mark Ready for Dispatch."**
3. The order appears on the **Dispatch** screen. Arjun (or whoever handles dispatch) clicks **"Dispatch Order"** → finished stock is reduced, **Invoice `INV-0001`** is raised, order closed.
4. **Divya (Accounts)** sees `INV-0001` → clicks **Mark Paid**.

**What to point out:** one order, three people, zero paperwork. The token `ORD-0001` carried through automatically and every step is stamped with who did it.

---

### Story 2 — "We have to make it, and we're short on material" (the full path)

**Situation:** A distributor, *Annapurna Traders*, orders **100 bottles of Groundnut Oil 500ml**. There isn't enough finished stock, and raw groundnuts are running low.

1. **Admin** creates the order → `ORD-0002` + `WH-0002`.
2. **Arjun (Warehouse)** checks stock → **"Not in Stock — Raise Production."**
   - System raises **Production Token `PROD-0002`**.
3. **Ravi (Production)** → **Create Production Slip.**
   - App multiplies the **recipe × 100 bottles** and shows the raw material table: *Groundnuts 400 kg required vs 80 kg available — short!*
   - Slip `SLP-0002` created, and because material is short, **Procurement Token `PROC-0002`** is auto-raised.
4. **Krishna (Procurement)** → opens `PROC-0002` → enters **unit price** for groundnuts → total auto-calculates → **Submit for Approval.**
5. **Admin** → **Approve.** (Or Reject with a reason → goes back for revision.)
6. **Krishna** → **Raise PO → Goods Received.**
7. **Suresh (Stock Team)** → **QC Check → Pass.**
   - Inventory is **incremented**, and the **purchase price is saved to Price History**.
8. **Ravi (Production)** → **Start Production** (raw material now deducted) → **Mark Complete.**
   - **Invoice `INV-0002`** auto-raised, order forwarded for dispatch.
9. **Divya (Accounts)** → **Mark Paid.**

**What to point out:** `ORD-0002` linked four tokens (`WH`, `PROD`, `PROC`, `INV`) and passed through five different team members — all traceable from one screen.

---

## PART B — Feature-by-feature example situations

### 1. Login & Authentication
**Situation:** Ravi joins the morning shift.
He opens the app, types his login ID `ravi` and password, and is signed in as **Production Lead**. He only ever sees production work — no admin controls, no accounts.
> *Demo tip:* try a wrong password to show the "Invalid login ID or password" message.

### 2. Role-based sidebar
**Situation:** Arjun (Warehouse) and Divya (Accounts) sit side by side.
Arjun's sidebar shows only **Dashboard · Orders · Warehouse.** Divya's shows **Dashboard · Accounts · Reports.** Nobody sees modules irrelevant to their job.
> *Demo tip:* log in as two different roles back-to-back to show the menu change.

### 3. Dashboard
**Situation:** The owner wants a 5-second health check.
Admin opens the Dashboard: total orders, open orders, in-production, pending procurement, dispatched, and low-stock items — plus a live "Recent Activity" feed of the latest actions.

### 4. Orders + Token generation
**Situation:** A new wholesale order comes in by phone.
Admin enters it in seconds; the system assigns `ORD-XXXX` and starts the pipeline. The **History** button on any order shows its full token trail.

### 5. Warehouse — automatic stock check
**Situation:** A token lands for 20 bottles of Mixed Oil.
The Warehouse screen shows a live **Finished Goods Stock** panel, and for each pending order it **automatically compares** order qty against finished stock — showing a green "Stock Available" or red "Insufficient Stock" verdict. Arjun doesn't guess: if available he clicks **Mark Ready for Dispatch**; if short, only **Raise Production** is offered. Every action is logged with his name.

### 5b. Dispatch — separate screen
**Situation:** Orders confirmed ready need to ship.
The **Dispatch** screen lists everything marked *Ready for Dispatch* (from warehouse stock confirmation **or** completed production). Clicking **Dispatch Order** reduces finished stock, raises the invoice, and closes the order. Warehouse confirms availability; Dispatch handles the actual send — two clean steps.

### 6. Production — recipe × quantity
**Situation:** Ravi must produce 100 bottles and wants the exact ingredients.
He clicks **Create Slip** and the app instantly computes every raw material: *per-unit amount × order qty*, with a green tick or red "Low" against current stock. No manual math.

### 7. Procurement — pricing & approval
**Situation:** Groundnuts must be bought from a supplier.
Krishna lists the shortfall, enters unit prices, and the grand total auto-calculates. He submits; Admin approves or rejects with a reason. Approved requests become payables.

### 8. Procurement — QC gate
**Situation:** The supplier's delivery arrives.
Suresh inspects it: **Pass** updates stock and records the price; **Fail** marks "Return to Supplier" and stock is *not* updated. Bad goods never silently enter inventory.

### 9. Inventory + Price tracking
**Situation:** Coconut prices have been climbing and the owner wants proof.
Open **Inventory → Price History** for "Raw Coconut": a mini bar-chart of unit price over time plus a dated list (qty received · unit price · who recorded it). Works for raw materials, packaging, ingredients, utensils, safety gear.

### 10. Accounts — invoices & payables
**Situation:** Month-end reconciliation.
Divya sees every invoice (raised/paid), each linked to its order and tokens, plus open payables from procurement. She marks invoices paid as money clears.

### 11. Reports — selectable + date range
**Situation:** The owner wants "all orders this month" as a spreadsheet.
Reports → pick **Orders** → **This Month** → **Run** → **Download CSV.** Same for Production, Procurement, Invoices, Price History, Audit Trail, or Login History — weekly, monthly, yearly, or any custom dates.

### 12. Admin Panel — user management
**Situation:** A new stock-team member, Ramu, is hired.
Admin → **Add User** → sets login ID, password and role **Stock Team.** Ramu can log in immediately. If someone leaves, Admin **Deactivates** them — login blocked, but their history is preserved.

### 13. Admin Panel — change a role
**Situation:** Arjun is promoted to also handle procurement.
Admin → **Edit User** → changes role. The sidebar and permissions update on his next login. The change itself is logged.

### 14. Login History
**Situation:** "Who was working in the system last Friday?"
Admin → **Admin Panel → Login History:** every sign-in with user, role, login time, logout time, and session duration — plus today's active sessions. Exportable to CSV.

### 15. Audit Trail
**Situation:** A customer disputes when their order shipped.
Open the order's **History** (or Admin → Audit Log): the exact timestamp, action, and the person who dispatched it — full accountability, no guesswork.

### 16. End-to-end token traceability
**Situation:** Auditor asks to follow one order completely.
Open `ORD-0002` → History shows the whole journey: order → warehouse → production slip → procurement → approval → PO → goods received → QC pass → stock updated → production → invoice → dispatched — every line stamped with a name, role and time.

---

## Suggested 5-minute demo flow

1. Log in as **admin** → show Dashboard.
2. Run **Story 1** (fast dispatch) end-to-end across admin → arjun → divya.
3. Run **Story 2** (production + procurement) — the headline demo.
4. Open the order **History** to show the full token trail.
5. Show **Reports** → download a CSV.
6. Show **Admin Panel** → Login History + add a user.
7. Log in as **arjun** to prove the sidebar only shows his modules.

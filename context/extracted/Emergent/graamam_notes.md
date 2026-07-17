# Graamam Connect — TODO / Notes

_Last updated: 7 July 2026_

All project files live in `D:\Claude\Graamam Connect\` — old/superseded versions and one-off scripts are archived in `D:\Claude\Graamam Connect\old dump\`.

App: **truly single-file** `D:\Claude\Graamam Connect\graamam_v2.html` (localStorage, no backend yet) — master data is now inlined directly into the HTML, no external `.js` needed to run it. `graamam_master.js` stays on disk as the source-of-truth data file (regenerated from `Graamam_Master_Data.xlsx` / the Excel exports); after refreshing it, run `D:\Claude\Graamam Connect\embed_master_data.ps1` to fold the new data back into `graamam_v2.html`.

---

## ★ ACTIVE TODO

All of P1–P4 are done. Remaining work is **Phase 2 infrastructure** only, plus anything new you raise.

### Phase 2 — infrastructure / later
1. **Backend + hosting**: graamam.in is on **Shopify** (can't host the app). Plan → `app.graamam.in` subdomain pointing to **Netlify/Vercel** frontend + **Firebase/Supabase** backend (shared data, persistence, real push).
2. **Login password hashing → full server-side auth** (after deploy). **Must preserve the client-side demo account as-is when this lands** — it should keep working exactly as now (separate, local-only, no login required against the new backend) so it stays a free, always-on sandbox for training.
3. **Master Data edit lock** behind **password + OTP**.
4. **COGS breakdown** into RM / Packaging / Transport / **Producer-entrepreneur fees** (method/specs from user).
5. **Shopify POS connection** (store / B2C sales auto-sync).
6. **Mobile PWA** (installable on phones).
7. **Fuller CRM** (per-customer 360, history, receivables, comms).
8. **WhatsApp / push notifications** (needs backend + creds).

### Supplied by user later
9. Real **batch-code pattern**.
10. **WhatsApp API credentials**.

---

## ✅ DONE (built & verified — do not re-add)

1. Login history.
2. Role-based sidebar.
3. Audit log (collapsible by order).
4. Selectable Reports grouped into Operations/Finance/Inventory/Admin, with sort, PDF+CSV, admin row-delete.
5. **Persistent demo account** (seed-once, never wiped).
6. Order→warehouse→production→procurement→dispatch pipeline with **FY-stamped tokens** (ORD-2627-0001 etc.).
7. Multi-item orders.
8. Unique item selection.
9. **B2B/B2C order types.**
10. Customer capture.
11. **Invoice generator** (B2B "INVOICE" + B2C "TAX INVOICE", GST IGST vs CGST/SGST, FY numbering, editable builder, Print + Download, bulk PDF).
12. Warehouse auto stock-check + separate Dispatch screen + dispatch form.
13. Production raw-material guard + slip live-update.
14. **Procurement**: approve = raise per-category PO (printable) → receive → enter cost.
15. **QC per-item Pass/Fail** + supplier comment + rating.
16. **Vendor master** + ratings + best-vendor suggestion.
17. Inventory category blocks.
18. **Finished-goods as expiry-dated batches** + **Store (Experience Center)** separate stock + **expiry alerts**.
19. Stock reconciliation (per location).
20. **Master Data editor** (Products, Materials, Vendors, Customers, Recipes-manual) + **Load real data** import.
21. **Accounts**: Receivables/Payables split, B2B payment terms + due date + Record Payment, B2C auto-paid, **analytics dashboard with pie charts + B2B/B2C/All toggle**.
22. **Namma "Graamam Lead" approval role** (Approvals-only sidebar).
23. Clickable token numbers.
24. Order cancellation (stage-aware inventory).
25. Deletion tickets.
26. Team reminders (basic notifications + bell).
27. **Order line items** have Product dropdown → Qty → manual Rate (invoice computes off it + GST).
28. Real data loaded: 132 products, 23 B2B customers + rate cards, 185 unique B2C customers, costing.
29. **[P1, #13]** Recipes now sync — **47 recipes / 59 raw ingredients** extracted from `2.0 Graamam Food Recipes.xlsx` → merged into `graamam_master.js`, imported by Load Master Data (30 Jun 2026).
30. **[P1, #7]** **Recipe** tab shows real ingredients + qty with per-ingredient add/edit/remove + conversion% + search.
31. **[P1, #3]** Customer **state mapping fixed** (GSTIN-prefix → name → GST code; 22/23 B2B resolved, UK left as export; B2C defaults to home state 37).
32. **[P1, #1]** Order entry: **B2C auto-fills MRP** + per-line **Disc %** + **live running totals** (Subtotal/Disc/Taxable/GST/Grand) for B2B & B2C, discount flows into the invoice.
33. **[P1, #14]** **Two-stage role-gated PO approval**: production → Lead approves in Approvals only → Procurement team approves & raises per-category PO → print/receive (no approving a pending request inside Procurement).
34. **[P3, #4]** **Sorting + search everywhere** — every table header is click-to-sort (numeric/date/text aware, ▲▼ indicator); tables with 7+ rows get a 🔍 quick-search box; the order form's customer dropdown gets a type-to-filter (shows name · mobile) (3 Jul 2026).
35. **[P3, #6]** **Accounts dashboard filter bar aligned** — Period/From/To/Channel now share the same label style and 37px control height.
36. **[P3, #2]** **Light & dark themes** — 🌙/☀️ toggle in the top bar, preference persists across sessions and workspaces; whole app themed via CSS variables (cards, tables, forms, modals, alerts, pill-tabs); printable invoices/POs/labels always stay light.
37. **[P2, #9]** **Material types** — Raw / Primary packaging / Secondary packaging / Labels / Other in Materials master + Inventory blocks, with auto-migration of old "Packaging" items (3 Jul 2026).
38. **[P2, #12]** **Warehouse collapsible tabs** (tap-to-open): Finished Goods · Primary Packing · Secondary Packing with low-stock badges.
39. **[P2, #8]** **Recipe calculator** (admin-only 🧮 per recipe): required output ÷ conversion% = raw mix, scales every ingredient; conversion editable + saveable.
40. **[P2, #10]** **Full vendor form** — contact, email, GSTIN, PAN, address/city/PIN/state, payment terms, bank.
41. **[P2, #11]** **Vendor↔material mapping** — type dropdown + item checkboxes (ticks persist across types); PO raise now **auto-recognises** mapped vendors (best-rated first) with a pick-list + prefill.
42. **[P2, #5]** **Order edit** — Edit on Orders (until dispatched), "data will be updated" prompt; **B2B edit by non-admin → Admin Panel → Order Edits approval queue** (order untouched until approved); admin & B2C edit apply directly; customer master stays in sync; archived-product lines survive edits.
43. **[P2, #15]** **Dispatch form → A5 shipping label** — no items/qty, big DELIVER TO address + customer contact, Order ID / Invoice # / order & dispatch dates, Graamam identity + return-address, **no personal phone numbers**.
44. **[Crucial fix, 5 Jul 2026]** **Recipes → production RM accounting** fixed end-to-end — recipe ingredients imported as inventory raw materials (canonical names, e.g. Corriander/Corrionder→Coriander), **auto-link** matches recipes to products (spelling-aware: Sabudhana/Sabudana, Ravva/Rava, Palak→Spinach, Gungura→Gongura) and computes **per-pack material needs = ingredient × pack ÷ (recipe total × conversion)**; slips show real requirements, shortfalls raise procurement, **starting production deducts RM stock** (verified: 30g Classic ×100 → 0.22 kg Dry Coconut, exact). Recipes tab shows **Linked To** + per-recipe **🔗 Link** (manual attach) + admin **Auto-link products** button. 13 products remain unlinked (no recipe in the workbook, or ambiguous — link manually via 🔗).
45. **[P4, #16]** New **Discussions** section (💬, every role except Namma/Lead who stays Approvals-only) backed by a `threads` store — subject + message, optional link to any Order/WH/PROD/PROC token, reply thread, unread badge on the nav item (5 Jul 2026).
46. **[P4, #16]** Quick **💬 Discuss** button on each Orders row opens a thread pre-linked to that order, **only shown while the order is open/in-process** (hidden once dispatched/cancelled).
47. **[P4, #17]** The **Discussions page's own "+ New Discussion"** lets you link *any* Order/Process ID including already-dispatched ones — the broader platform.
48. **[P4, #16/#17]** Threads **auto-close** the moment their linked order is dispatched or cancelled (reason recorded), or can be **closed manually** by the creator or admin; closed threads stay visible under Closed/All tabs; the Discussions table gets sort/search automatically via the global table enhancer.
49. **[Layout fix, 6 Jul 2026]** Fixed a whole-app **horizontal overflow bug**: `#main`/`.app-body` are flex items and most modal/page grids default to `min-width:auto`, so a wide table or a long real customer/product name (e.g. a 77-char customer name) forced the *entire app* wider instead of scrolling internally. Fixed at the root — `min-width:0` on the flex containers, `minmax(0,Nfr)` on every bare grid column across pages and modals. Verified with the longest real names in the dataset across all 13 pages, every sub-tab, and 5+ modals — zero overflow, both themes, no console errors.
50. **[Single-file + demo, 6 Jul 2026]** `graamam_master.js` **inlined into `graamam_v2.html`** (between `GRAAMAM_MASTER_DATA` markers) — verified the app boots and loads all data correctly with the external `.js` file completely absent. Distributing the app is now copying **one file**. `embed_master_data.ps1` re-does the inlining any time `graamam_master.js` is regenerated from a new Excel export.
51. **[Demo hardening, 6 Jul 2026]** Re-verified the **demo account fully satisfies "always available, never syncs with the main account"**: separate localStorage namespace (`gc2demo_` vs `gc2_`), demo seeds only synthetic sample data, changes made in demo persist across visits but never leak into the real workspace and vice versa — confirmed with a live isolation test. Needs zero backend, so it survives any future hosting/deployment change unchanged.
52. **[Order-form UI polish, 7 Jul 2026]** Rebalanced the order-items row column widths (Product/Qty/Rate/Disc %) — Product now gets more relative room and Qty/Rate/Disc % are close to equal instead of Rate looking oddly wide.
53. **[Order-form UI polish, 7 Jul 2026]** Fixed a pixel-drift bug where the item row's inputs crept progressively left of their column headers — the header row's trailing empty cell and the item row's ✕ delete button were sized differently (`auto` vs real content), skewing the other columns between the two rows. Both now use a fixed `34px` trailing column so header and input line up exactly.
54. **[Native-control styling, 7 Jul 2026]** Removed the native browser **number-input spinner box** (up/down arrows) app-wide — it rendered with its own light OS chrome regardless of theme, which is what made numeric fields look "boxy," especially in dark mode.
55. **[Native-control styling, 7 Jul 2026]** Removed the native browser **select dropdown-arrow chrome** app-wide the same way, replaced with a custom theme-matched chevron (different gray for light vs dark) so dropdowns no longer show a mismatched native arrow box.

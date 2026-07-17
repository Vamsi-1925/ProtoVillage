# Emergent — Phase 1 prompt (paste this as your message)

> Build ONE screen only. This is a trial to lock the visual system and the
> Firebase wiring before we build the rest of the app screen by screen. Do
> NOT build any other page. I will prompt you for the next screen after I
> approve this one.

---

## What to build in Phase 1

The **Graamam Connect → Orders page**, matching the provided Stitch mockup
**exactly** (layout, spacing, colors, typography, components). Reference files:

- `stitch_ui_kit/orders_light_theme/` → `code.html` (Tailwind implementation)
  and `screen.png` (the target rendering). Match this pixel-for-pixel.
- `stitch_ui_kit/orders_oled_dark_theme/` → the dark-mode version. The moon
  icon in the top bar toggles between them.
- `DESIGN_SYSTEM.md` → the binding design tokens (colors, typography, radii,
  spacing) in the YAML front-matter. Every color and font must come from here.

## Design system — apply exactly (from DESIGN_SYSTEM.md, "Modern Humanist")

- **Framework**: Tailwind (CDN with `plugins=forms,container-queries` is fine
  for the trial), `darkMode: "class"`, tokens mapped into `tailwind.config`
  exactly as in the reference `code.html`.
- **Fonts**: Raleway (display/headline), Nunito Sans (body/label). Load from
  Google Fonts. Icons: Material Symbols Outlined, `FILL 1`.
- **Core colors**: background `#fcf9f5`, primary `#005158`,
  primary-container `#1e6a72`, on-primary `#ffffff`, tertiary accents for
  status badges (`tertiary-fixed-dim #f8bc5a` for "New Order",
  `secondary-container #91f2f7` for "Packing"), surface-container-lowest
  `#ffffff` for the table card, outline-variant `#bec8ca` for borders.
- **Dark theme**: OLED black sidebar/background per the dark reference.

## The Orders screen must contain (all visible in screen.png)

1. **Fixed left sidebar** (220px, `inverse-surface` bg): Graamam Connect brand
   lockup (eco icon in a primary-container circle + "Graamam Connect /
   Producer Operations"); nav items Dashboard, Inventory, Orders (active,
   primary bg, "12" badge), Producers, Settings, each with a Material Symbol.
2. **Top bar**: dark-mode toggle + user avatar, right-aligned.
3. **Page header**: "Orders" (display-lg, Raleway bold) + subtitle "Manage and
   track your producer fulfillments." + a "＋ Create Order" button
   (primary-container) on the right.
4. **Pill status tabs**: New (active, with count badge), Packing, Dispatched,
   Delivered — filter the table.
5. **Orders table** in a rounded white card: columns ORDER ID (chip like
   `#GC-8902`), CUSTOMER (avatar + name), ITEMS, DATE, TOTAL, STATUS (colored
   pill), ACTION (expand chevron). Rows expandable.

## Data — wire it real, not hard-coded HTML

- Back the page with **Firebase** (Auth + Firestore, `graamam/*` namespace).
  Seed a handful of sample orders in Firestore so the table renders live data,
  the pill tabs filter by status, and "Create Order" writes a new document.
- Keep it minimal but real: this trial proves the Stitch UI renders from
  Firestore data, so later screens plug into the same backend.
- Preserve the future path for the existing local demo account (`gc2demo_`) —
  do not wire the demo data into Firestore.

## Deliverable for Phase 1

1. The running Orders page (light + dark), visually matching `screen.png`.
2. Reusable components extracted so later screens reuse them: **Sidebar,
   TopBar, PillTabs, DataTable, StatusPill, PageHeader** — this component
   library is the whole point of the trial.
3. A one-paragraph note on the stack you used and how the next screen will
   plug in.

Do not build Inventory, Dashboard, or any Ops screen yet. Confirm the stack
you'll use, then build only this.

---

## Files to attach with THIS phase-1 prompt (4)

| # | File | Why |
|---|---|---|
| 1 | DESIGN_SYSTEM.md | Binding design tokens |
| 2 | stitch_ui_kit/orders_light_theme/code.html | Exact target markup |
| 3 | stitch_ui_kit/orders_light_theme/screen.png | Exact target rendering |
| 4 | stitch_ui_kit/orders_oled_dark_theme/screen.png | Dark-mode target |

(Everything else — the full kit, the specs, graamam_v2.html — stays for later
phases; see BUILD_GUIDE.md.)

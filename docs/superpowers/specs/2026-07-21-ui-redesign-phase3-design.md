# Phase 3 design: shared dashboard content shell

## Scope

Build the primitives every authenticated dashboard content screen should sit on top of, and wire them into the three role "hub" screens as the pilot:

- `DoctorHomeScreen.jsx`
- `RetailerDashboard.jsx`
- `AdminPage.jsx` (component `AdminDashboard`)

Out of scope: the deeper feature screens under each role (e.g. `AppointmentSlots`, `MyItems`, `AdminBlogs`) — those get migrated screen-by-screen in later phases, reusing the same shell.

## Problem

All three hub screens hand-rolled their own layout: `DoctorHomeScreen.css` / `RetailerDashboard.css` (Arial, hardcoded hex, bespoke button classes) or inline `style={}` objects (`AdminPage.jsx`). None used design tokens, none matched the Phase 1/2 visual language, and each duplicated the same "grid of nav buttons" concept with different markup.

## Architecture

- **`components/layout/DashboardShell.jsx`** — `DashboardShell` (page container: `pt-20 lg:pt-28` to clear the fixed navbar, matching `HomeScreen.jsx`'s convention, plus `max-w-7xl` centered content) and `DashboardPageHeader` (title/description/actions row).
- **`components/layout/DashboardNavCard.jsx`** — `DashboardNavCard`, a `NavLink`-wrapped shadcn `Card` tile (icon, label, description, optional destructive badge for counts). Replaces each role's bespoke button grid.
- Role hub screens now: pull `auth.user` for the greeting, define a `navCards`/`sections` data array, and render `<DashboardShell><DashboardPageHeader .../><div className="grid ..."> {array.map(...)} </div></DashboardShell>`.

## DRY rules carried from Phase 1/2

- One shell, one nav-card primitive — not per-role copies.
- No new colors: all surfaces use `bg-background`, `bg-card`, `bg-primary/10`, `text-muted-foreground`, etc.
- Icons from `lucide-react` (project's configured icon library), sized via `size-*`, no raw `w-*/h-*`.

## Verification

- `npm run build`, `npm test -- --run` — both clean.
- Grep for raw hex/rgb across changed files — none.
- Confirmed `DoctorHomeScreen.css` and `RetailerDashboard.css` had no other importers before deleting.

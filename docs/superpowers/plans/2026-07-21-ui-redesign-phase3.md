# Phase 3 plan: shared dashboard content shell

See design doc: `docs/superpowers/specs/2026-07-21-ui-redesign-phase3-design.md`.

## Tasks

1. **`components/layout/DashboardShell.jsx`** — `DashboardShell` + `DashboardPageHeader` primitives. Done.
2. **`components/layout/DashboardNavCard.jsx`** — shared nav-tile primitive (`NavLink` + `Card`). Done.
3. **`DoctorHomeScreen.jsx`** — rewritten on the shell; deleted dead `DoctorHomeScreen.css`. Done.
4. **`RetailerDashboard.jsx`** — rewritten on the shell; deleted dead `RetailerDashboard.css`. Done.
5. **`AdminPage.jsx`** — rewritten on the shell (dropped inline `style={}`). Done.
6. **Verification** — `npm run build` clean, `npm test -- --run` (7 files / 15 tests) clean, grep for raw hex/leftover CSS imports clean. Done.

## Not done this phase

- Individual feature screens per role (appointment slots, manage products, admin blogs/users tables, etc.) — not migrated to `DashboardShell` yet. Migrate incrementally, reusing `DashboardShell`/`DashboardNavCard`/`DashboardPageHeader` rather than inventing new per-screen containers.
- Patient role hub/screens — untouched this phase (Phase 2 scope was Doctor/Retailer/Admin only).

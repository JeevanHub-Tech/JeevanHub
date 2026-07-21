# JeevanHub UI Redesign Phase 2 Implementation Plan

**Goal:** Fix the Phase-1-introduced navbar regression and redesign the Doctor, Retailer, and Admin dashboard navbars on shared shadcn/ui primitives, matching the public nav's visual language.

**Architecture:** See `docs/superpowers/specs/2026-07-21-ui-redesign-phase2-design.md`.

## Global Constraints (carried over from Phase 1)

- Preserve the olive/cream/turmeric/bark palette; no new raw hex, everything through `--jh-*` / semantic tokens.
- One `navItems` data array per role, rendered once — no duplicated desktop/mobile lists.
- Reuse installed shadcn primitives (`Button`, `Input`, `Select`) instead of hand-rolled markup.
- Preserve all existing routes, auth behavior, and role-specific data fetching (SSE badge counts, path-aware sublinks).
- Run `npm run build` and targeted tests after each task.

---

### Task 1: Shared location hook

**Files:**
- Create: `frontend/src/hooks/useUserLocation.js`
- Modify: `frontend/src/screens/Navbar.jsx`

- [ ] Extract the geolocation → OpenCage reverse-geocode effect (currently duplicated in public `Navbar.jsx` and all three dashboard navbars) into `useUserLocation()`.
- [ ] Refactor public `Navbar.jsx` to consume the hook instead of its inline effect.
- [ ] `npm run build`.

### Task 2: Shared `DashboardNavbar` primitive

**Files:**
- Create: `frontend/src/components/layout/DashboardNavbar.jsx`

- [ ] Build the shared navbar shell per the design doc: fixed olive header, `Select`-based Explore control reusing `publicNavigation.exploreOptions`, one `navItems` array rendered responsively, profile block, notifications link, `useUserLocation`.
- [ ] `npm run build`.

### Task 3: Doctor navbar

**Files:**
- Modify: `frontend/src/screens/Doctors/DoctorNavBar.jsx`
- Delete: `frontend/src/screens/Doctors/DoctorNavbar.css`

- [ ] Rebuild on `DashboardNavbar`, keeping the SSE pending-count badge on "Current Requests" and all existing routes.
- [ ] Delete the dead `DoctorNavbar.css` and its import.
- [ ] `npm run build`.

### Task 4: Retailer navbar

**Files:**
- Modify: `frontend/src/screens/Retailers/RetailerNavBar.jsx`
- Delete: `frontend/src/screens/Retailers/RetailerNavbar.css` (if present)

- [ ] Rebuild on `DashboardNavbar`, resolving the path-aware manage-products sublinks into the `navItems` array before render.
- [ ] `npm run build`.

### Task 5: Admin navbar

**Files:**
- Modify: `frontend/src/screens/admin/AdminNavbar.jsx`
- Delete: `frontend/src/screens/admin/AdminNavbar.css`

- [ ] Rebuild on `DashboardNavbar` with the admin nav items and `/admin/profile` / `/notifications` routes.
- [ ] Delete the dead `AdminNavbar.css` and its import.
- [ ] `npm run build`.

### Task 6: Retire the dead shared stylesheet

**Files:**
- Delete: `frontend/src/screens/NavBar.css`

- [ ] Confirm no remaining `import "../NavBar.css"` / `import "./NavBar.css"` references (public `Navbar.jsx` already doesn't use it), then delete the file.

### Task 7: Final verification and phase commit

- [ ] Run `npm test -- --run` and `npm run build` from `frontend/`.
- [ ] Grep changed files for raw hex colors and duplicated nav arrays.
- [ ] Manually confirm each role's nav items still point at their existing routes.
- [ ] Commit as `feat: redesign dashboard navbars for doctor, retailer, and admin`.

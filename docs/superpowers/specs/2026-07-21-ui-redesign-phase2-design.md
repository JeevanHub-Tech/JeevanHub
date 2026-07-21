# JeevanHub UI Redesign — Phase 2 Design

## Goal

Redesign the Doctor, Retailer, and Admin dashboard **shells** (navbar only — not individual feature screens) on the shadcn/ui primitives established in Phase 1, and fix the navbar regression Phase 1 introduced for those three roles.

## Regression being fixed

Phase 1 gutted `screens/NavBar.css` down to a comment once the public `Navbar.jsx` moved to Tailwind. `DoctorNavBar.jsx`, `RetailerNavBar.jsx`, and `AdminNavbar.jsx` still `import "../NavBar.css"` expecting its old rules — all three currently render unstyled.

## Scope

- `DoctorNavBar.jsx`, `RetailerNavBar.jsx`, `AdminNavbar.jsx` and their dead per-role `.css` files.
- A new shared `DashboardNavbar` primitive plus a shared `useUserLocation` hook (all three roles, and the existing public `Navbar.jsx`, duplicate the same geolocation → OpenCage reverse-geocode effect).
- Does **not** cover: `DoctorHomeScreen`, `RetailerDashboard`, `AdminPage`, or any other authenticated feature screen — those stay on their current (unstyled or ad-hoc) layout until a later phase. No shared "DashboardShell" content wrapper is built yet; only the navbar.

## Current-state findings

All three navbars are structurally identical, 100% legacy inline-CSS/img-icon markup:

- Native `<select>` "Explore" dropdown (same anti-pattern already replaced on the public nav's `Select`).
- Desktop and mobile nav links are two separately-authored `<ul>` copies of the same items (`nav-sidebar` for mobile, `nav-center-menu` for desktop) — violates the "one nav data array" rule from the Phase 1 spec.
- Raw `<img>` icons (menu, close, location, notifications) instead of `lucide-react`.
- Doctor navbar additionally polls booking counts via SSE for a "Current Requests" badge — the only role with per-item badge state.
- Retailer navbar conditionally swaps a nav item's sublinks based on `location.pathname` (manage-products add/items).
- Explore-dropdown destinations differ slightly per role (Doctor's list is missing "Diet & Yoga" that Retailer/Admin have) — an unintentional copy-paste drift, not a deliberate difference. Phase 2 unifies all three on the existing `exploreOptions` array from `publicNavigation.js`.

## Architecture

### `useUserLocation` hook (`frontend/src/hooks/useUserLocation.js`)

Extracts the geolocation → OpenCage reverse-geocode effect duplicated across the public `Navbar.jsx` and all three dashboard navbars into one hook: `const location = useUserLocation()` → returns a display string (`"Fetching location..."`, city name, or an error/denied string). Public `Navbar.jsx` is refactored to use it too, so there is exactly one implementation of this effect in the codebase.

### `DashboardNavbar` primitive (`frontend/src/components/layout/DashboardNavbar.jsx`)

A single configurable component parallel to the public `Navbar`, built on the same shared primitives (`Button`, `Input`, `Select`) and token classes as Phase 1's public nav — fixed olive header, `Select`-based Explore control reusing `publicNavigation.exploreOptions`, one `navItems` array rendered once and shown responsively (desktop inline row + mobile disclosure) rather than duplicated markup, profile block, and a notifications link. Props:

- `navItems`: `{ label, to, badge? }[]` — one array, no desktop/mobile duplication.
- `profileTo`, `notificationsTo`: route strings.
- `logoTo`: defaults to the role's home route.

Each role file (`DoctorNavBar.jsx`, `RetailerNavBar.jsx`, `AdminNavbar.jsx`) shrinks to: its own data-fetching (Doctor's SSE pending-count, Retailer's path-aware sublinks resolved into a plain `navItems` array before render) plus a `<DashboardNavbar navItems={...} profileTo="..." notificationsTo="..." />` call. Business logic (auth, SSE, badge counts) stays in the role file; `DashboardNavbar` owns presentation only, matching the Phase 1 DRY rule.

## DRY rules (carried over from Phase 1, still binding)

- No new raw brand hex values.
- No duplicated desktop/mobile navigation arrays — enforced this phase for the three dashboard roles.
- No one-off button/input class strings where a shared primitive/variant applies.
- Use installed shadcn primitives (`Button`, `Input`, `Select`) over hand-rolled markup; icons from `lucide-react`, not `<img>`.

## Verification

- Run `npm test -- --run` and `npm run build` from `frontend/`.
- Confirm `NavBar.css`, `DoctorNavbar.css`, `RetailerNavbar.css`, `AdminNavbar.css` are deleted and no file imports them.
- Manually sanity-check each role's nav links still resolve to their existing routes (no route changes in this phase).

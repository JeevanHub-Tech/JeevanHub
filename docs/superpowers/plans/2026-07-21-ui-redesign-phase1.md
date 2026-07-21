# JeevanHub UI Redesign Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish a shadcn/ui-compatible, token-driven visual foundation and apply it to the public navigation, footer, and homepage shell.

**Architecture:** Keep the existing Vite React application and route-level lazy loading. Install shadcn/ui into `frontend/`, map its semantic CSS-variable theme to the existing JeevanHub `--jh-*` palette, and put reusable primitives in `frontend/src/components/ui/`. Migrate the public shell to shared primitives while leaving feature modules functional for later phases.

**Tech Stack:** React 18, Vite, Tailwind CSS v4, shadcn/ui CLI, lucide-react, Vitest, CSS variables.

## Global Constraints

- Preserve the current olive, cream, turmeric, and bark brand palette.
- `frontend/src/tokens.css` is the source of truth for color, radii, shadows, typography, semantic states, and motion.
- New UI uses Tailwind utilities and shared primitives; do not add raw brand hex values to screen or component files.
- Keep mobile and desktop navigation driven by one data array.
- Preserve route-level lazy loading and avoid adding heavy dependencies.
- Reusable controls must support visible focus, disabled, loading, and reduced-motion states.
- Run targeted tests after each task and `npm run build` before the phase commit.

---

### Task 1: Establish shadcn/ui and semantic theme plumbing

**Files:**
- Create: `frontend/components.json`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/vite.config.js`
- Modify: `frontend/src/index.jsx`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/tokens.css`

**Interfaces:**
- Produces the `@/` source alias, Tailwind semantic classes, and shadcn/ui component path expected by later tasks.

- [ ] Install shadcn/ui in the existing Vite app using the official CLI flow (`npx shadcn@latest init -t vite` or the existing-project equivalent if the CLI detects the app is already configured).
- [ ] Confirm `components.json` uses CSS variables and JavaScript/JSX-compatible paths.
- [ ] Add or preserve the Vite React and Tailwind plugins plus the `@` alias to `frontend/src`.
- [ ] Move the Tailwind import into the active global stylesheet and remove the stale `output.css` entry import.
- [ ] Extend `tokens.css` with shadcn semantic variables mapped to the existing `--jh-*` brand tokens and expose them with `@theme inline`.
- [ ] Add base body, border, and typography rules using semantic variables.
- [ ] Run `npm run build` and verify Tailwind generates `bg-background`, `text-foreground`, `bg-primary`, and `ring-ring` utilities.

### Task 2: Add reusable UI primitives with test coverage

**Files:**
- Create: `frontend/src/lib/utils.js`
- Create: `frontend/src/components/ui/button.jsx`
- Create: `frontend/src/components/ui/card.jsx`
- Create: `frontend/src/components/ui/input.jsx`
- Create: `frontend/src/components/ui/label.jsx`
- Create: `frontend/src/components/ui/skeleton.jsx`
- Create: `frontend/src/components/ui/calendar.jsx`
- Create: `frontend/src/components/ui/date-picker.jsx`
- Create: `frontend/src/components/ui/ui.test.jsx`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

**Interfaces:**
- `Button({ variant, size, loading, className, ...props })`
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Input`, `Label`, `Skeleton`
- `Calendar({ selected, onSelect, ...props })`
- `DatePicker({ value, onChange, placeholder, disabled })`

- [ ] Write failing tests for button variant/disabled/loading behavior, accessible input labeling, and date-picker value selection.
- [ ] Run the targeted test file and confirm it fails because the primitives do not exist.
- [ ] Add the smallest shadcn-style primitive implementations using `cn()` and the semantic tokens.
- [ ] Add `Calendar` and `DatePicker` using the lightest compatible date-picker dependency supported by the installed shadcn component, or a native date input boundary if the dependency is not already present.
- [ ] Run the targeted tests and confirm they pass.
- [ ] Refactor repeated class composition only after the tests are green.

### Task 3: Redesign the public navigation and footer

**Files:**
- Modify: `frontend/src/screens/Navbar.jsx`
- Modify: `frontend/src/screens/NavBar.css`
- Modify: `frontend/src/screens/Footer.jsx`
- Modify: `frontend/src/screens/Footer.css`
- Create: `frontend/src/screens/publicNavigation.js`
- Create or modify: `frontend/src/screens/PublicShell.test.jsx`

**Interfaces:**
- `publicNavigation` exports one navigation item array consumed by desktop and mobile menus.
- `Navbar` keeps existing route destinations and location lookup behavior.

- [ ] Write failing tests for rendering the shared navigation labels and mobile menu labels from the same data source.
- [ ] Replace the legacy navbar structure with a responsive Tailwind/shadcn-aligned shell using shared `Button`, `Input`, and `Sheet`/drawer behavior where appropriate.
- [ ] Keep location status, search destination selection, login link, and profile fallback behavior intact.
- [ ] Replace raw colors, generic shadows, and duplicated responsive declarations with semantic utilities and token-backed styling.
- [ ] Redesign the footer with a constrained grid, readable headings, route links, and responsive stacking.
- [ ] Run the public shell tests and build.

### Task 4: Apply the new shell to the homepage

**Files:**
- Modify: `frontend/src/screens/HomeScreen.jsx`
- Modify: `frontend/src/screens/HomeScreen.css`
- Modify: `frontend/src/screens/HeroSection.jsx`
- Modify: `frontend/src/screens/HeroSection.css`
- Create or modify: `frontend/src/screens/HomeScreen.test.jsx`

**Interfaces:**
- Home remains available at `/` and keeps existing content modules and navigation behavior.

- [ ] Write failing tests for the consultation-first hero heading and primary CTA route.
- [ ] Refactor the homepage wrapper to use semantic background/text utilities, shared container spacing, and a stable top offset for the redesigned navbar.
- [ ] Redesign the hero around practitioner-led consultation as the primary action, using the shared button primitive and existing image assets.
- [ ] Retain existing sections below the hero, applying shared spacing and surface treatment without rewriting their business behavior.
- [ ] Run homepage tests and verify responsive build output.

### Task 5: Final verification and phase commit

**Files:**
- Verify all modified frontend files.

- [ ] Run `npm test -- --run` from `frontend/`.
- [ ] Run `npm run build` from `frontend/`.
- [ ] Search changed source files for new raw hex colors and duplicated nav/button definitions.
- [ ] Review the diff for accidental generated files, stale imports, or route behavior changes.
- [ ] Commit all Phase 1 implementation changes with `feat: redesign public UI foundation`.

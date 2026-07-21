# JeevanHub UI Redesign — Phase 1 Design

## Goal

Create the reusable visual foundation and redesigned public shell for JeevanHub while preserving the existing olive, cream, turmeric, and bark palette.

## Scope

Phase 1 covers:

- A shadcn/ui-compatible theme using CSS variables and Tailwind utilities.
- `frontend/src/tokens.css` as the single source of truth for brand and semantic colors, radii, shadows, typography, and motion.
- Shared UI primitives for buttons, cards, fields, labels, navigation links, and loading/skeleton states.
- A reusable calendar/date-picker boundary for future appointment and scheduling screens, using the shadcn/ui component conventions rather than bespoke markup.
- A responsive public navbar and footer.
- The public homepage shell and its primary consultation call-to-action.
- Accessibility and performance verification for the changed surfaces.

Phase 1 does not rewrite every authenticated dashboard or feature screen. Those will be handled in later phases using the same primitives.

## Visual direction

The direction is “Modern Apothecary”: warm cream surfaces, deep olive actions and navigation, turmeric accents used sparingly, botanical imagery as context, and generous spacing for an older-leaning patient audience. The interface should feel grounded and practitioner-led rather than like a supplement store, generic SaaS dashboard, hospital portal, or mystical wellness brand.

The existing palette remains the identity anchor. The redesign adds semantic aliases so components use stable roles such as `background`, `foreground`, `primary`, `primary-foreground`, `card`, `muted`, `border`, `input`, `ring`, `success`, `warning`, and `destructive`. Brand-specific `--jh-*` tokens remain available for expressive composition.

## Architecture

### Theme and Tailwind

Use the official shadcn/ui CSS-variable approach. `components.json` will enable CSS variables and point to the frontend global stylesheet. Tailwind utilities will consume semantic variables through the Tailwind v4 `@theme inline` mapping, allowing components to use classes such as `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `border-border`, and `ring-ring`.

The legacy `output.css` import will be removed from the entry point once the new global stylesheet owns the Tailwind import. Existing screen styles can continue to coexist during migration, but new shared UI will not add raw color literals or page-specific duplicates.

### Reusable components

Shared primitives will live under `frontend/src/components/ui/` and use shadcn/ui’s composable patterns:

- `button.jsx`: variants for primary, secondary, outline, ghost, and destructive actions; sizes for default, small, and large; loading and disabled states.
- `card.jsx`: consistent surface, border, radius, and elevation vocabulary.
- `input.jsx` and `label.jsx`: shared form control treatment and accessible labeling.
- `calendar.jsx` and `date-picker.jsx`: reusable date selection boundary for later appointments and checkout flows.
- `skeleton.jsx`: content-shaped loading states rather than inline spinners.

Class composition will use a small `cn()` utility so consumers can extend primitives without duplicating conditional class logic. Components will remain framework-agnostic React modules with no data fetching or route-specific behavior.

### Public shell

The public navbar will be one responsive component with:

- Brand link and readable wordmark.
- Search/explore control with existing navigation destinations.
- Primary links for home, treatments, doctors, medicines, and blogs.
- Location status and account action.
- Mobile drawer with the same navigation data, avoiding duplicated desktop/mobile link definitions.

The homepage will use a shared constrained container, clear consultation-first hierarchy, reusable CTA/button primitives, and calm section spacing. Existing content modules will remain functional while the outer shell and highest-visibility styling are migrated.

## DRY rules

- No new raw brand hex values in component or screen files.
- No duplicated desktop/mobile navigation arrays.
- No one-off button class strings when a shared button variant applies.
- No direct `box-shadow`, radius, or focus-ring values outside tokens or primitive definitions unless a component has a documented exceptional visual requirement.
- Repeated layout widths and page gutters use shared Tailwind classes or a single container primitive.
- Existing feature behavior remains in its feature module; shared components own only presentation and interaction primitives.

## Accessibility and motion

- Body text and controls target WCAG 2.1 AA contrast.
- Interactive controls have visible `:focus-visible` states using the semantic ring token.
- Buttons, nav links, and fields provide disabled, hover, active, error, and loading states where applicable.
- Touch targets remain at least 44px on public controls.
- Existing reduced-motion support is retained and extended to new transitions.

## Verification

- Run the frontend test suite after each cohesive sub-step.
- Run `npm run build` before the phase commit.
- Inspect changed files for raw color literals and duplicated primitives.
- Verify public routes render without import or alias failures.
- Commit Phase 1 as one reviewable branch commit after verification.

## Reference

The semantic token mapping follows the official shadcn/ui theming guidance: CSS variables define semantic background/foreground pairs, Tailwind maps them through `@theme inline`, and dark mode can later override the same variables under `.dark` without rewriting component classes.

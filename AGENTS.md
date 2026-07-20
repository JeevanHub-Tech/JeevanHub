# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this is

JeevanHub — an Ayurvedic healthcare platform (doctor consultations, medicine e-commerce, diet/yoga plans, blogs, an AI chatbot). Two independent apps in one repo, no shared package/monorepo tooling between them:

- `backend/` — Express + Mongoose (MongoDB), plain MVC (`models/`, `controllers/`, `routes/`, `middleware/`, `services/`, `config/`).
- `frontend/` — Create React App (React 18, react-router-dom v6), no TypeScript.

The root `package.json` is not a workspace root — it has no scripts and only a stray `moment` dependency. Always `cd backend` or `cd frontend` before running anything.

## Running locally

**Preferred: Docker Compose** (not tracked in git — local-only):
```
docker compose -f docker-compose.local.yml up      # mongo + mongo-express + backend + frontend
docker compose -f docker-compose.local.yml down     # stop
docker compose -f docker-compose.local.yml down -v  # stop + wipe DB and node_modules cache
```
Backend → http://localhost:5000, frontend → http://localhost:3000, mongo-express UI → http://localhost:8081. `npm install` runs automatically inside the containers on `up`; node_modules persist in named volumes.

**Manual, without Docker:**
```
cd backend && npm start     # nodemon index.js — needs backend/.env (copy from .env.example) and a running MongoDB
cd frontend && npm start    # react-scripts start, port 3000
```
Backend `.env` must set `MDB`, `JWT_SECRET` (≥32 chars — the auth middleware logs a CRITICAL warning otherwise), `ADMIN_EMAIL`/`ADMIN_PASSWORD`, and optionally `GROQ_API_KEY` (Sanjeevani AI chatbot), Cloudinary keys, Razorpay, WhatsApp, Google API keys — see `backend/.env.example` for the full list.

Note the port mismatch: `backend/.env.example` sets `PORT=5000`, but `backend/index.js` falls back to `8080` if `PORT` is unset, and `frontend/src/context/AuthContext.js` also falls back to `http://localhost:8080` if `REACT_APP_AYURVEDA_BACKEND_URL` is unset. `frontend/.env` sets `REACT_APP_AYURVEDA_BACKEND_URL=http://localhost:5000`. Always check which port is actually in play rather than assuming 5000 or 8080.

**Seeding local test accounts:** `node backend/seed.local.js` creates one login per role. Credentials are in `documentation/LOCAL_TEST_LOGINS.md` (all local-only, password `Test@1234`).

## Testing / linting

- Frontend: `cd frontend && npm test` runs CRA's Jest runner (`react-scripts test`). Coverage is minimal (essentially just the CRA-generated `App.test.js`) — don't assume behavior is tested.
- Backend: no test runner configured. `npm start` only.
- No repo-wide lint command; frontend relies on CRA's built-in `eslintConfig` (`react-app`, `react-app/jest`) surfaced through dev-server warnings, not a standalone `lint` script.

## Architecture

### Auth model (backend)

Four separate Mongoose models — `Admin`, `Doctor`, `Retailer`, `Patient` — each with their own password field, not a single polymorphic User model. `backend/middleware/auth.js` decodes the JWT, reads `role` from the payload, and looks up the right model via a `modelMap`. Any new authenticated feature that needs "the current user" goes through this middleware and gets `req.user = { ...doc, role }`.

Frontend auth (`frontend/src/context/AuthContext.js`) keeps the access token in `localStorage` and role-switches the whole app: `App.js`'s `renderNavBar()` picks `PatientNavBar`/`DoctorNavBar`/`RetailerNavBar`/`AdminNavBar`/`NavBar` off `auth.role`. Token refresh is silent via an httpOnly refresh-token cookie (`/api/auth/refresh-token`) — a single axios response interceptor retries any 401 once, and concurrent 401s are deduped through a shared `refreshPromiseRef` so only one refresh call fires.

`ProtectedRoute` (`frontend/src/components/ProtectedRoute.js`) only checks `auth.token && auth.user` — it does **not** check role. Route-level role gating, if needed, has to be added explicitly per-route; don't assume `ProtectedRoute` alone restricts a route to its intended role.

### Frontend structure

`frontend/src/screens/` is organized by role: `admin/`, `Doctors/`, `Patients/`, `Retailers/`, plus shared/public screens (`HomeScreen`, `Medicines`, `Cart`, `SignInScreen`, etc.) directly under `screens/`. All routing lives in one flat `frontend/src/App.js` — there's no per-feature router, so adding a screen means adding both the import and a `<Route>` there.

`App.js` also special-cases a hash-based PWA mode: visiting with `#chatbot` in the URL renders *only* `MobileChatApp` (a full-screen chatbot), skipping the router/navbar/footer entirely. This is intentional (mobile "Add to Home Screen" shortcut), not a bug.

### Design tokens

`frontend/src/tokens.css` defines the canonical `--jh-*` CSS variables (olive/cream Ayurvedic palette) and mirrors `.impeccable/context/DESIGN.md`, which is the source-of-truth design doc used by the `impeccable` skill. When restyling a page, prefer these tokens over new hex values. Recent pattern (see `fix(medicines)` commits): scope page-specific token overrides to a page-root class (e.g. `.ay-meds-page`) rather than redefining on `:root`, so one page's theme doesn't bleed into others.

## Git workflow

Do NOT open a GitHub PR for every change. Each PR sends a notification to all team members, and opening one per small fix is noisy. Instead: commit to a branch (or push it), and let the user pull/merge/review locally themselves. Only open a PR if the user explicitly asks for one.

### Known issues to be aware of

`documentation/BUGS_AND_IMPROVEMENTS.md` is a standing audit of real bugs and security gaps in this codebase (role-gating holes, checkout/cart using a `localStorage` key nothing writes to, hardcoded demo payment amounts, password hashes not excluded from queries, etc.). Skim the relevant section before assuming an existing flow works correctly — several core flows (checkout, admin user management) are documented as broken rather than working-as-intended.

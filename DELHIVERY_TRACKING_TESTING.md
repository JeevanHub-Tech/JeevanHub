# Delhivery order tracking — run & test guide

Everything for this feature is built. This is how to run it and walk each flow.

Ports in this repo: **backend `5000`** (`backend/.env` sets `PORT=5000`), **frontend `3000`**
(`frontend/vite.config.mjs`). The frontend already points at the backend via
`VITE_AYURVEDA_BACKEND_URL=http://localhost:5000`.

---

## 1. One-time setup

### Environment (already done, verify only)

`backend/.env` now contains:

| Key | Value | Purpose |
| --- | --- | --- |
| `DELHIVERY_ENCRYPTION_KEY` | 64 hex chars (generated) | AES-256-GCM key for credentials at rest. **Required** — without it, connecting Delhivery fails. |
| `CRON_SECRET` | 64 hex chars (generated) | Guards `/api/cron/*`. It did not exist before; the payout cron was unprotected. |
| `BASE_URL` | `http://localhost:5000` | Builds the webhook URL shown to retailers. |
| `DELHIVERY_SANDBOX` | `true` | Simulates tracking so the flow can be tested with no Delhivery account. See §4. |
| `DELHIVERY_WEBHOOK_SECRET` | commented out | Only for a single platform-wide Delhivery registration. Per-retailer secrets are generated automatically. |

Confirm the key is well-formed:

```bash
cd backend && node -e "require('dotenv').config();console.log(/^[0-9a-f]{64}$/i.test(process.env.DELHIVERY_ENCRYPTION_KEY)?'key OK':'KEY BAD')"
```

> Rotating `DELHIVERY_ENCRYPTION_KEY` makes every stored credential undecryptable — retailers must re-enter theirs.

### Dependencies

I ran `npm install` in `frontend/` (added 32, removed 67 packages) because `node_modules/@lexical/*`
was missing and `npm run build` failed on an unrelated pre-existing import. If you see that error again:

```bash
cd frontend && npm install
```

---

## 2. Start the app

Two terminals.

```bash
cd backend && npm start
```

Expect: `Server running on http://localhost:5000`, `Connected to MongoDB`, and the two cron lines —
`📦 Delivery polling active. Running at: 0 */6 * * *`.

```bash
cd frontend && npm start
```

Open **http://localhost:3000**.

---

## 3. Retailer flow — connect Delhivery

Log in as a **retailer** → **My Orders** → **Accepted** tab → **Ship order** on any order.

The dialog has three steps. Step 1 is the partner (Delhivery active; Blue Dart/DTDC disabled).
Step 2 is the part you specified: three options, each a **row that expands in place** with its own
form, and a **Help button on the right of each row** that prints the steps to obtain (or install)
the credentials.

| Option | Form fields | What to expect |
| --- | --- | --- |
| **API token** (Recommended) | one token field | Verified with Delhivery, then saved encrypted; button enables at ≥10 chars |
| **OAuth2 / MCP** | paste MCP JSON + Client ID, secret, Auth URL, Realm | "Fill fields" parses the pasted config into the four inputs; Connect mints a real token |
| **Webhook push** | none | "Generate webhook details" returns URL + `X-Secret` header + secret, each with a Copy button |

Things worth checking:

- Clicking a row's **Help** opens the steps *and* the form together; clicking the row header alone
  toggles just that row. Only one row is open at a time.
- The **webhook secret is shown once**. That panel deliberately stays open after saving so you can
  copy it; the other two methods collapse to a green **Connected** chip.
- On the webhook option you should see a red warning that the URL is `localhost` and Delhivery
  cannot reach it (see §6 for the tunnel).
- **Change method** re-opens the three options after connecting.
- The OAuth2 paste box accepts either a real MCP JSON block or plain `D1_CLIENT_ID=...` lines.

Verify from the API that nothing leaks:

```bash
curl -s -H "Authorization: Bearer <RETAILER_JWT>" http://localhost:5000/api/retailers/<RETAILER_ID>/shipping-integration/status
```

Returns only `{ isConfigured, method, configuredAt }` — never the token. All six credential fields
are `select: false` in the schema, so ordinary retailer fetches can't return them.

### Connect verifies before it says "Connected"

Connect makes a live call to Delhivery and only marks the retailer connected if Delhivery answers:

| Method | What is checked | Failure looks like |
| --- | --- | --- |
| **API token** | tracking API is called with an impossible waybill — auth is judged before the lookup, so `401`/`403` means the token is wrong, any other answer means it was accepted | red *"Not connected — Delhivery rejected these details"* with the HTTP status |
| **OAuth2 / MCP** | a real access token is minted, which proves auth domain + realm + client id + secret together | red panel naming the realm and host that failed |
| **Webhook** | nothing — we mint the secret and Delhivery pushes to us, so there is no credential of theirs to test | n/a; the first scan is the confirmation |

Nothing is written to the database until verification passes, so a failed attempt **cannot** overwrite a
previously-working integration. On success you get *"Verified with Delhivery"* saying what happened
(e.g. "Delhivery issued an access token").

> **Sandbox is the exception.** With `DELHIVERY_SANDBOX=true` no request leaves the server, so
> credentials are only checked for *decryptability*, not validity — any fake values connect. The badge
> reads **Sandbox — not verified** and the panel says *"Saved, but not verified"* so it can't be mistaken
> for a real connection. To test real credential rejection, set `DELHIVERY_SANDBOX=false` and restart.

### If the OAuth2 method fails

The token endpoint is `{D1_AUTH_URL}/realms/{D1_REALM}/protocol/openid-connect/token` — the realm is a
**path segment**, not a form field. Delhivery's own `d1-mcp-mint` package builds it the same way.
Diagnose any auth failure with:

```bash
cd backend && D1_AUTH_URL='...' D1_REALM='...' D1_CLIENT_ID='...' D1_CLIENT_SECRET='...' node scripts/probe.delhiveryAuth.js
```

Read the response, not just the failure:

| Delhivery says | Means |
| --- | --- |
| `404 RESTEASY003210` | the URL isn't a token endpoint at all — our bug, report it |
| `404 Realm does not exist` | URL shape is right; that realm isn't hosted on that auth domain |
| `401 invalid_client` | URL **and** realm are right; the client id/secret was rejected |
| `200` + `access_token` | all four values are valid |

Tested against the credentials from our first onboarded retailer
(`D1_AUTH_URL=https://ucp-auth.delhivery.com/holyknight`, `D1_REALM=ucp-3UJVGQIPW7FX`): realm
`ucp-3UJVGQIPW7FX` returns **`404 Realm does not exist`**, while realm `master` on that same host
returns **`401 invalid_client`**. Same host, same URL shape, two different errors — so the path is
correct and the realm genuinely isn't there. Those credentials cannot mint a token until Delhivery
confirms the right auth domain and realm id. Use sandbox mode (§4) meanwhile.

---

## 4. Ship an order with an AWB

Step 3 of the same dialog. It stays disabled until step 2 is connected.

- **API token / OAuth2:** the AWB is checked against Delhivery before saving, so a typo is rejected
  at ship time with the courier's error.
- **Webhook:** no up-front check is possible (nothing to call), so the form says so.

On success the order moves to **Shipped**, the list refetches, and an AWB strip appears with the last
known scan and a **Track** button.

### Testing without a Delhivery account — sandbox mode

`backend/.env` now has `DELHIVERY_SANDBOX=true`. With it on, tracking is simulated and **no request
leaves the server**, so any fake credentials in step 2 are accepted and any waybill works. The dialog
shows a **Sandbox** badge next to *Connected*, and every simulated scan is labelled
`SANDBOX - simulated scan, not from Delhivery` in the timeline, so it can't be mistaken for real data.

The **AWB you type picks the scenario**:

| Type an AWB containing | Result | Use it to check |
| --- | --- | --- |
| `DL` — e.g. `MOCK-DL-1` | Delivered (5 scans) | order → delivered, 48 h payout hold starts |
| `RT` — e.g. `MOCK-RT-1` | RTO Initiated | order → cancelled |
| `UD` — e.g. `MOCK-UD-1` | Undelivered attempt | stays **shipped** (the "Undelivered" trap) |
| `BAD` — e.g. `MOCK-BAD-1` | Unknown waybill | the ship-time rejection message |
| anything else — `JH12345` | In transit | the normal live timeline |

Sandbox still exercises the real code: it builds a Delhivery-shaped payload and runs it through the
same `parseTrackingResponse` and status mapping as production, and it still requires the retailer to be
connected and their stored credentials to decrypt. Webhook-only retailers are still refused (nothing
to poll with) — that's correct, not a bug.

Turn it off by setting `DELHIVERY_SANDBOX=false` and restarting. It is ignored entirely when
`NODE_ENV=production`, so it can never fake a delivery — and therefore release a payout — on the live
site.

> Caveat: the match is a substring, so a genuine numeric waybill that happens to contain `404` is
> treated as unknown. Only affects sandbox mode.

**Verified:** with `NODE_ENV=production` set, `SANDBOX_ENABLED` is `false` even with
`DELHIVERY_SANDBOX=true` in `.env`.

---

## 5. Patient flow — tracking

Log in as the **patient** who placed the order → **Your Orders**. The order now shows a courier strip
(latest status + location, `Delhivery AWB … · shipped <date>`) and **Track shipment**, which opens the
timeline: newest scan first, icon per Delhivery status type, location and remarks per row, plus a
**Refresh** button. If Delhivery is unreachable you get a red banner *above* the last-known timeline
rather than an empty dialog.

The same dialog is reachable from the retailer's **Track** button.

---

## 6. Webhook method end to end (needs a tunnel)

Delhivery must reach your machine, so `localhost` won't do.

```bash
ngrok http 5000
```

Put the HTTPS forwarding URL in `backend/.env` as `BASE_URL`, restart the backend, then re-open the
webhook option — the URL now shows the tunnel and the red warning disappears. Register that URL in
Delhivery with header `X-Secret: <the generated secret>`.

To test without Delhivery, push a scan yourself (use a **real AWB already attached to an order**):

```bash
curl -i -X POST http://localhost:5000/api/webhooks/delhivery -H "Content-Type: application/json" -H "X-Secret: <SECRET>" -d '{"Shipment":{"AWB":"1234567890123","Status":{"Status":"Delivered","StatusType":"DL","StatusLocation":"Kolkata_Behala (West Bengal)","StatusDateTime":"2026-08-27T11:20:00.000+05:30","Instructions":"Delivered to consignee"}}}'
```

Expected: **200** and the order flips to delivered. Then confirm the guards:

- wrong/missing `X-Secret` → **401** (compared with `crypto.timingSafeEqual`)
- unknown AWB → **200** (a retry would never fix it, so Delhivery shouldn't keep trying)
- more than 240 calls/minute → **429**

This matters because a forged "Delivered" would start a payout hold and then release retailer money.

---

## 7. The 6-hourly sweep, on demand

The cron runs at 00/06/12/18 IST and is the safety net for retailers who don't get webhooks. Don't
wait for it:

```bash
curl -s -H "x-cron-secret: <CRON_SECRET>" http://localhost:5000/api/cron/poll-deliveries
```

Returns `{ polled, updated, delivered, skipped, errors }`. Webhook-method retailers are counted in
`skipped` — correct, since Delhivery pushes to them. A courier error is recorded on the order as
`shipping.lastPollError` instead of failing the whole run.

---

## 8. Payout hold (the reason carrier-verified delivery matters)

For an **online-paid** order, delivery sets `deliveredAt` and holds the retailer payout for 48 hours,
which is the patient's window to use **Report an Issue**. Release it early to test:

```bash
curl -s -H "x-cron-secret: <CRON_SECRET>" http://localhost:5000/api/cron/settle-payouts
```

Nothing releases until 48 h after `deliveredAt`; temporarily backdate `payoutHoldUntil` in Mongo to
watch a release. COD orders are never held.

---

## What I verified without a browser

- `applyTrackingToOrder` / `recomputeOrderStatus`, 8 cases: single-retailer delivery holds the payout
  for exactly 48 h; **multi-retailer delivery does not deliver the whole order**; re-applying
  "Delivered" doesn't restart the hold; COD isn't held; RTO after delivery doesn't reverse it;
  duplicate webhook pushes don't double the timeline; an in-transit scan bumps `accepted` → `shipped`.
- Status mapping incl. the traps: `UD`/"Undelivered" and "Not Delivered" stay `shipped`, `DL` →
  delivered, `RT`/"RTO" → cancelled.
- AES-256-GCM round-trip, and tampered ciphertext rejected rather than silently returned.
- All six credential fields `select: false`, and `CREDENTIAL_SELECT` matches the schema paths exactly
  (a mismatch would silently decrypt `undefined`).
- `parseWebhookPayload` on both PascalCase and snake_case bodies.
- All 14 new/changed backend modules load; every handler the routers reference is exported.
- `npm run build` succeeds (`✓ built in 13.15s`).

Two things to know:

1. **A bug I introduced and fixed:** I had appended a second `BASE_URL=http://localhost:8080` to
   `backend/.env`, but the file already had `BASE_URL=http://localhost:5000`. dotenv keeps the *last*
   occurrence, so mine was silently winning and every webhook URL handed to a retailer would have
   pointed at a dead port. Removed, in both `.env` and `.env.example`.
2. **Pre-existing, unrelated:** `npm test` in `frontend/` fails one file,
   `src/screens/Home/HomeScreen.test.jsx` — `Cannot destructure property 'fetchCartCount'`, a
   CartContext provider issue in a file this feature never touches. 14/15 tests pass.

As agreed, I did no browser testing — that part is yours.

# Backend — Booking, Payment & Fairness Flow

This doc covers how appointment booking, payment, video calls, and payout
fairness fit together. It does not cover the medicine-order flow (see
`controllers/orderController.js` for that — similar escrow pattern, simpler
state machine).

## 1. Booking lifecycle

Appointments confirm **by default** — there is no doctor accept/deny step.

| Trigger | `requestAccept` | Notes |
|---|---|---|
| Patient books a **free** slot | `accepted` immediately | `createBooking` (`controllers/bookingController.js`) |
| Patient books a **paid** slot | `pending` | Held for up to 10 min awaiting payment |
| Razorpay payment verified | `pending` → `accepted` | `verifyBookingPayment` |
| Manual UPI screenshot uploaded | `pending` → `accepted` | `uploadPaymentScreenshot` — trust-first, not cryptographically verified; the payout-hold/dispute system (§3) is the fraud net, not a review gate |
| Doctor cancels a confirmed appointment | `accepted` → `denied` | `cancelBookingByDoctor` — refunds immediately, notifies patient |
| Patient never pays within the window | booking auto-deleted client-side | 10-min countdown in `DoctorDetailPage.jsx`, backend slot-capacity queries also expire unpaid `pending` bookings so the slot frees up |

Slot capacity (`createBooking`'s `activeBookings`/`confirmBookings` queries)
counts a booking as "holding the slot" if it's `accepted`, OR `pending` with
proof of payment in flight (screenshot uploaded, `paymentStatus: 'Completed'`,
or created within the last 10 minutes). This is also where a race between two
patients booking the same slot concurrently gets resolved — see the comment
above `confirmBookings` in `createBooking`.

There is no "Current Requests" queue for doctors — it was removed because
appointments confirm automatically. A doctor's only lever is **cancel**.

## 2. Video calls (Daily.co)

`getDailyJoinInfo` (`GET /api/bookings/:id/daily-join`) lazily creates a
private Daily.co room per booking and mints a per-user meeting token (doctor
joins as room owner so the call actually starts).

**Time-gated**: join is only allowed from 10 minutes before the slot through
15 minutes after it ends (`JOIN_WINDOW_BEFORE_MS` / `JOIN_WINDOW_AFTER_GRACE_MS`
in `bookingController.js`). Outside that window the endpoint 403s. Admins are
exempt (support/troubleshooting).

**Self-expiring**: the room and the meeting token both expire at the same
"slot end" timestamp instead of a flat 6h — a leaked join link stops working
once the appointment is actually over, not up to 6h later.

**Attendance signal**: the first time the *doctor* successfully calls this
endpoint for a booking, `doctorJoinedAt` is set. This is the technical proof
the settlement cron (§3) uses to tell a real no-show apart from a disputed-but-
attended call.

A doctor can also set an optional backup meeting link (`updateMeetLink`) —
surfaced in the UI only as a fallback if Daily.co fails to connect, not as a
default option at booking/accept time.

## 3. Payout escrow (fairness)

Doctor and retailer payouts are **held**, not released immediately, so a
no-show or an undelivered order can be caught and refunded instead of paying
out regardless.

### State machine (`Booking.payoutStatus` / `Order.payoutStatus`)

```
not_applicable → held → released
                      ↘ disputed → released
                                 ↘ refunded
```

- `not_applicable` — free consult, or payment method has no platform-held
  money to hold (e.g. cash on delivery).
- `held` — payout is waiting out its hold window. Set when a booking is
  confirmed (any path in §1, if `amountPaid > 0`) or when an order first
  reaches `orderStatus: 'delivered'` (online payment only).
- `disputed` — a patient flagged a problem, or the settlement cron
  auto-flagged a no-show. Frozen — the cron will never touch it again; only
  an admin can move it forward.
- `released` — payout cleared. **This only updates the tracked state — it
  does not move money.** Actually paying the doctor/retailer is still a
  manual step for whoever's watching the admin queue, until Razorpay
  Route/RazorpayX Payouts is wired up (needs KYC + onboarding per
  doctor/retailer — a business process, not something to bolt on blind).
- `refunded` — same caveat: tracked state, not an executed Razorpay refund.

`payoutHoldUntil` = slot-end (or delivery time) + 48h
(`PAYOUT_HOLD_GRACE_MS` in `bookingController.js`, `PAYOUT_HOLD_GRACE_MS` in
`orderController.js`). This is the patient's dispute window.

### Patient actions

- `POST /api/bookings/:id/dispute` / `POST /api/orders/:id/dispute` —
  `{ reason }`. Only works while `payoutStatus === 'held'`. Wired into:
  - The Appointments tab and Order History screens ("Report an Issue"),
    shown whenever `payoutStatus === 'held'`.
  - The post-consult feedback screen (`PatientFeedback.jsx`) — the natural
    place to flag a bad appointment right after rating it.

### Doctor actions

- Cancelling a confirmed appointment (`PUT /api/bookings/:id/cancel`) refunds
  immediately — no waiting on the hold window, since a doctor self-cancelling
  is an admission, not a claim that needs adjudicating.

### Admin actions

- `GET /api/bookings/payout/queue` / `GET /api/orders/payout/queue` — lists
  open disputes (plus, for bookings, anything `held` past its window with no
  `doctorJoinedAt` — a likely no-show the cron hasn't swept yet).
- `PUT /api/bookings/:id/dispute/resolve` / `PUT /api/orders/:id/dispute/resolve`
  — `{ resolution: 'released' | 'refunded' }`.
- Surfaced in the admin Transactions screen (`frontend/src/screens/admin/transactions.jsx`)
  as a "Payout Disputes Awaiting Review" panel above the transaction table.

### Settlement cron

`GET`/`POST /api/cron/settle-payouts` — **not** a long-running worker.
Render's free tier can't keep one alive between requests, so this is designed
to be hit by an external pinger (cron-job.org or similar) every 15–30 min.

Protected by a shared secret, not a user session — send header
`x-cron-secret: <CRON_SECRET>` (see `.env.example`). Returns 401 without it.

On each sweep, for every `held` booking/order past its `payoutHoldUntil`:

- **Booking, `doctorJoinedAt` set** → `released`.
- **Booking, `doctorJoinedAt` missing** → `disputed`, with an auto-generated
  reason ("the doctor never opened the video call room"). Lands in the same
  admin queue as a patient-raised dispute instead of silently paying out an
  unattended appointment.
- **Order** → `released`. There's no attendance-equivalent signal for
  deliveries yet (no patient "I received this" confirmation flow), so an
  order's payout just releases once its window passes — a patient who never
  got their delivery has to dispute before then.

If `CRON_SECRET` is unset, the endpoint 401s unconditionally (fails closed).

## 4. Known gaps / next steps

- **No actual money movement.** Release/refund/cancel-refund all flip tracked
  state; the bank transfer or Razorpay refund is a manual step. Full
  automation needs Razorpay Route or RazorpayX Payouts, which requires KYC
  and onboarding for every doctor/retailer.
- **Order delivery has no attendance-equivalent proof signal.** Consider a
  patient-facing "I received this" confirmation before trusting retailer-
  reported `delivered` status the same way `doctorJoinedAt` is trusted for
  bookings.
- **Redis/worker queue**: not used. The cron-hits-an-endpoint pattern was
  chosen specifically because it survives Render's free-tier sleep/wake cycle
  without needing a persistent process. Revisit once off the free tier —
  Upstash Redis (HTTP-based, works fine even across sleep cycles) plus a
  proper job queue would let disputes/settlement react faster than a 15–30
  min poll.

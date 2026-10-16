# Caidea — handoff notes (as of v1.14, 2026-10-16)

Read this first in a new chat, then SPECIFICATION.md (v1.14), BUILD_GUIDE.md and CLARIFICATIONS.md.

## Where the build stands
- Done: Milestones 1–9 (scaffold, design system, database, login with mandatory 2FA, stock engine, vendors / purchase orders / stock ledger / stock counts / product CSV, cart + colour picker + catalogue filters, checkout + order tracking + expiry job + Shop settings, **counter sale / POS**), v1.2 enterprise design brief, v1.3 home-page refresh, Milestone 10 Phase A (Online orders admin, v1.11).
- Next: **Milestone 10 Phase B** — PACKED / IN_TRANSIT / DELIVERED steps, courier adapters (Leopards, PostEx) when API keys arrive, labels, COD remittance. Then M11 Returns (must also handle counter sales — see BUILD_GUIDE "For M11" under M9).
- Last delivered: `caidea-v1.14.zip` (§26: slower hero phones, per-phone motions, merging five-layer scene, always-play hero and repair section). The zip has no `.git` folder; commit it in your own copy as `v1.14: slow per-phone hero animations, merging layers, always-play`. (v1.13 = M9 counter sale, §25.)
- Go-live checklist (shared doc, tick as you go): https://claude.ai/code/artifact/1640fa4e-990f-4aea-b1a2-4227bec4606e

## Stack
Next.js 16 (App Router, `proxy.ts` instead of middleware), TypeScript, Tailwind v4 (only the six Caidea colour tokens), Drizzle + SQLite (one file, `data/caidea.db`), Better Auth with TOTP 2FA. Prices are integer paisa, shown PKR-only ("Rs 12,500").

## Stock engine (M5) — how later milestones must use it
- `src/server/inventory/stock.ts` is the only code allowed to change stock. A unit test fails if any other file writes `current_stock`.
- Wrap work in `withStockTransaction(db, (tx) => { … })` (BEGIN IMMEDIATE, synchronous only — no `await`, no API calls inside).
- Call `applyStockMovement(tx, { variantId, delta, type, referenceId, operatorId, unitCostPaisa, notes })`. Sales/write-offs need negative `delta`, receipts/restocks positive; `MANUAL_ADJUST` needs notes.
- Catch `InsufficientStockError` to show "just sold out"; everything in the transaction is already rolled back.
- Callers check roles themselves (manual adjustments: MANAGER/OWNER) and refresh caches after commit.

## Decisions so far
- Payments: Pakistani aggregator; manual transaction-ID entry first. Couriers: Leopards and PostEx. Hosting: PC/server in the shop.
- v1.2: PKR-only storefront; glass/glow only on dark midnight areas; lightweight CSS 3D (no 3D library); cards + table toggle on /store.
- v1.3: cities map removed from home (delivery fees per city still used at checkout); generated repair video file; home figures are display-only (edited in Admin → Home page); grades are "OEM Original", "OLED A Grade", "Compatible A Grade".
- v1.4: engine enforces one direction per movement type and notes on manual adjustments (additive, no schema change).
- v1.5 (M6): rules in SPECIFICATION §17; ★ defaults Q24–Q29 in CLARIFICATIONS (close short, edit locks, landed-cost split, CSV never changes existing stock or average cost, browser PDF). Stock pages are OWNER/MANAGER only.
- v1.6 (M7): rules in SPECIFICATION §18; ★ defaults Q30–Q33. Cart lives in the browser (ids + quantities only) and is re-priced on the server every view. No currency selector (PKR-only). Caching stays on immediate path revalidation, not tags (§18 explains).
- v1.7 (M8): rules in SPECIFICATION §19; ★ defaults Q34–Q39. Guest checkout; wallet/bank payments are manual (customer sends money, enters the transaction ID; staff verify in M10). Unpaid wallet/bank orders expire after 24 h via `/api/cron/expire-unpaid` (needs a timer on the shop server, M18). Owner-only Admin → Shop settings holds phone, WhatsApp, methods on/off, waiting time.
- v1.8 (owner): COD limit `COD_MAX_ORDER_PKR` = Rs 20,000 and all wallet/bank account numbers come ONLY from the environment file (edit + restart); Shop settings shows them read-only. Above the limit checkout lists the other methods with account numbers. `tests/unit/constitution.test.ts` enforces the Constitution's code rules.
- v1.9 (security review, §21): environment file kept for payment details; IBAN check digits verified; every start fingerprints the payment details — a change is audited, alerted in Admin (dashboard + Shop settings) until the OWNER confirms, and emailed via `SMTP_*` to `ALERT_EMAIL_TO` (and the old address). Server hardening for go-live is BUILD_GUIDE M18 step 8.
- v1.10 (owner, §22): ALL email through one Gmail account — `src/server/notify/email.ts` `sendEmail()` is the only sender (test-enforced); `GMAIL_AUTH` app_password (default) or oauth2; free-tier guard `GMAIL_DAILY_LIMIT` 450/day, security alerts up to 500; `SMTP_*` retired. Shop settings shows Gmail status and has "Send a test email".
- v1.11 (owner, §23; answers Q48–Q51): email required at checkout; above the COD limit or while COD is **paused** (Shop settings switch + message) customers order by bank / wallet, pay with the order number in the remarks and send the screenshot (WhatsApp / call / **sales email** setting); staff record the proof (stops expiry), confirm payment, dispatch with CN, or cancel in **Admin → Online orders** (OWNER/MANAGER, audited, idempotent; cancel uses the stock engine). Payment wait 48 h. Customer emails (order placed + sales copy after commit; payment confirmed / dispatched / cancelled from admin) through `sendEmail`, logged in `email_log`, max 3 order emails/address/day. Full order details + server-side PDF (pdf-lib) only with the private token: random 30-day token, SHA-256 stored in `order_access_tokens`, httpOnly cookie + email link (`/order/CODE/open?t=`). CSS-3D scenes on the last three home sections inside `MotionScene` (pause button, off-screen pause, reduced motion starts still).
- v1.12 (owner, §24; Q52–Q53): checkout payment step = **Cash on delivery** or **Place order & pay in advance** (then pick the account). Pay-in-advance orders get **free delivery** (`prepaid_free_delivery`, Shop settings, default on; computed in `placeOrder`). Customers are told to send the payment slip + transaction ID with the order number within **24 hours** by WhatsApp or email (wait is 24 h again; migration 0007).

- v1.13 (M9, §25; Q54–Q61): **Admin → Counter sale** (keyboard/scanner till, 80 mm receipt sized to its length, auto-print), **End of day** (per cashier, cash in drawer), **Technicians** (approve for wholesale). Owner rules: **cashiers and managers take cash only** (cash received → change); **only the OWNER** takes JazzCash / Easypaisa / bank / card with a transaction ID + "genuine and checked" tick (unique across all orders, card slips stored as `CARD-…`); **manager/owner ticket discount** with a reason; wholesale only for APPROVED technicians (manager/owner approve; cashier registrations wait). Counter codes `CA-POS-YYMMDD-NNNN`; `COUNTER_POS` with the cashier as operator; counter prices = website price (sale + promotions), wholesale never above it; unpublished (not archived) stock can be sold. Logic in `src/server/counter/pos.ts`; modules `counter`, `technicians`; migration 0008 adds `orders.cash_received_paisa`, `orders.discount_reason`. No void/refund of a counter sale yet (M11).
- v1.14 (§26; Q62–Q64): hero slides 8 s; five slow phone motions (assemble = screen placed onto the phone's base, turn, float, rise, sway) in `globals.css` `pm-*`, picked per model in `device-profiles.ts` (`assignMotions`, `deviceProfileForSlide` — reads the slide text when no product is linked); five-layer scene starts apart and merges (12 s); hero, repair video and layers scene always play until paused (`.motion-always` is skipped by the global reduced-motion rule). No schema change, no new dependency.
- Migration timestamps: Drizzle skips a migration whose `when` is older than the last applied one. 0007 was stamped ahead of real time, so 0008 is stamped after it; `tests/unit/constitution.test.ts` now fails if the order is ever wrong. When you generate 0009, check its `when` in `drizzle/meta/_journal.json` is larger than 0008's (`1791187967456`), or bump it.

## Working rules from the owner
- Before any change, check it against the specification; if it conflicts, offer options and apply the owner's choice.
- After changes, confirm nothing that worked before is broken (unit tests, `npm run db:verify`, lint, typecheck, build, browser tests).
- Ask about major decisions with options; otherwise keep going.

## Open items for the owner
- Replace sample figures "48,000+ screens sold" and "1,200+ repair shops" in Admin → Home page.
- Sample prices, photos, promotion and coupons are placeholders.
- Some internal SKUs still contain "AAA" (never shown to shoppers).
- Confirm or change the M6 defaults Q24–Q29 and M7 defaults Q30–Q33 (CLARIFICATIONS.md, sections F–G).
- Put the real JazzCash / Easypaisa / NayaPay and bank details in the environment file (`.env.production` on the shop server) and restart — the SAMPLE values from `.env.example` must not reach customers (Shop settings warns while they're in use). Set shop phone and WhatsApp in Admin → Shop settings.
- Set up the shop's Gmail (2-Step Verification + app password) in `GMAIL_USER` / `GMAIL_APP_PASSWORD`, set `ALERT_EMAIL_TO`, then Admin → Shop settings → Send a test email. After any payment-details change, confirm it in Shop settings.
- Work through the go-live checklist doc before opening (link above).
- Online orders can now be handled in Admin → Online orders (M10 Phase A). Courier booking is still manual (paste the CN); Phase B courier APIs, PACKED/DELIVERED steps and COD remittance remain in M10.
- Set the **sales email** and WhatsApp in Shop settings, and on the live server set `BETTER_AUTH_URL` to the real https address (email links use it; Shop settings warns while it's localhost).
- Performance note: the home page's JavaScript is ~185 KB gzip, mostly the Next.js/React framework, which was already over the §12 100 KB target before v1.11 (v1.11 added 268 bytes). Review in M17.
- Schedule `/api/cron/expire-unpaid` (e.g. every 15 min) when the shop server is set up (M18).
- (v1.13) Counter: decide whether managers should also take wallet/card payments (currently owner only, per your answer), set up the receipt printer on the till PC (80 mm roll; `--kiosk-printing` for no dialog), create a CASHIER login for each person at the till, register your regular technicians. Undo/refund of a counter sale comes with M11 Returns.
- Before go-live: enter real opening stock by counting each colour (product page → Count or correct stock) or with the CSV `opening_stock` column.

## Upgrading an existing copy to v1.14
From v1.13: replace the files → `npm install` → `npm test` → `npm run build` → restart. No database change.

## Upgrading an existing copy to v1.13
From v1.12: `npm install` → `npm run db:migrate` (migration 0008 adds two order columns; backs up first) → `npm test` → `npm run db:verify` → `npm run build` → restart. Then: sign in as owner/manager → Admin → Technicians (add your regular repair technicians) → Admin → Counter sale (try one cash sale, check the receipt prints on the 80 mm printer — printer notes in BUILD_GUIDE M9). Staff need role CASHIER for the till (`npm run staff:create -- --role CASHIER`). From v1.11 or older, do the v1.12 steps below first.

## Upgrading an existing copy to v1.12
From v1.11: `npm install` → `npm run db:migrate` (migration 0007 sets the payment wait back to 24 h unless you changed it) → `npm test` → `npm run build` → restart → Admin → Shop settings: check "Free delivery when the customer pays in advance" and the waiting time. From v1.10: do the v1.11 steps below first.

## Upgrading an existing copy to v1.11
`npm install` (adds `pdf-lib`) → `npm run db:migrate` (migration 0006: `order_access_tokens`, `email_log`; moves the 24 h payment wait to 48 h unless you changed it; backs up first) → `npm test` → `npm run db:verify` → `npm run build` → restart → Admin → Shop settings: set the sales email, check Cash on delivery is On (or Paused) and "Links in emails go to". From v1.9 or older, run `npm run setup:env` first (Gmail keys, v1.10).

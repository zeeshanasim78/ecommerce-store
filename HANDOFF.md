# Caidea — handoff notes (as of v1.6, 2026-10-03)

Read this first in a new chat, then SPECIFICATION.md (v1.6), BUILD_GUIDE.md and CLARIFICATIONS.md.

## Where the build stands
- Done: Milestones 1–7 (scaffold, design system, database, login with mandatory 2FA, stock engine, vendors / purchase orders / stock ledger / stock counts / product CSV, **cart + colour picker + catalogue filters**), v1.2 enterprise design brief, v1.3 home-page refresh.
- Next: **Milestone 8 — checkout with COD + manual wallet** (BUILD_GUIDE.md; see the "For M8" note under M7).
- Last delivered: `caidea-v1.6.zip` (v1.5 + Milestone 7). The zip has no `.git` folder; commit it in your own copy as `M07: cart, colour picker, catalogue filters`.

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

## Working rules from the owner
- Before any change, check it against the specification; if it conflicts, offer options and apply the owner's choice.
- After changes, confirm nothing that worked before is broken (unit tests, `npm run db:verify`, lint, typecheck, build, browser tests).
- Ask about major decisions with options; otherwise keep going.

## Open items for the owner
- Replace sample figures "48,000+ screens sold" and "1,200+ repair shops" in Admin → Home page.
- Sample prices, photos, promotion and coupons are placeholders.
- Some internal SKUs still contain "AAA" (never shown to shoppers).
- Confirm or change the M6 defaults Q24–Q29 and M7 defaults Q30–Q33 (CLARIFICATIONS.md, sections F–G).
- Set the real shop phone number in settings: the cart shows it as "call to order" until checkout exists.
- Before go-live: enter real opening stock by counting each colour (product page → Count or correct stock) or with the CSV `opening_stock` column.

## Upgrading an existing copy to v1.6
`npm install` → `npm test` → `npm run db:verify`. No database migration in this version.

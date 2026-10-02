# Caidea Build Guide — step-by-step for a beginner

This guide turns `SPECIFICATION.md` into working software in **20 small milestones**. Each milestone has: the goal, exact steps, what you'll learn, and a **"Done when"** checklist. Don't start a milestone until the previous one's checklist is all ticked.

> You only need basic Next.js knowledge to start. New concepts are introduced one at a time, and each milestone ends with something you can click and see.

---

## How the SDD loop works in practice

```
 ┌──────────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐
 │ Constitution │ → │ Research │ → │ Specify  │ → │ Clarify │ ─┐
 └──────────────┘   └──────────┘   └──────────┘   └─────────┘  │
                                         ▲                     ▼
                                         │  gap found?   ┌─────────┐
                                         └────────────── │  Build  │
                                          (stop, update  └─────────┘
                                           spec, re-ask)
```

**Your daily rhythm**
1. Open `SPECIFICATION.md` and find the section for today's milestone.
2. Create a Git branch: `git checkout -b m05-stock-engine`.
3. Build only what the spec says. If you discover something the spec doesn't cover (e.g. "what happens if a PO is received twice?"), **stop**, write the question at the bottom of `CLARIFICATIONS.md`, decide, update the spec + change log, then continue.
4. Run `npm run lint && npm run test` and click through the feature.
5. Commit with a clear message: `git commit -m "M05: applyStockMovement with ledger + tests"`.
6. Merge into `main`.

**Working with Claude:** for each milestone you can say, e.g., *"Build Milestone 5 from BUILD_GUIDE.md following SPECIFICATION.md §6"*. Ask it to explain anything you don't understand — understanding the stock engine (M5) and auth (M4) is essential because they protect your money and stock.

---

## Glossary (read once)

| Term | Plain meaning |
|---|---|
| **App Router** | Next.js folders under `app/` become URLs. `app/store/page.tsx` → `/store`. |
| **Server Component** | Default React component that runs on the server — can read the database directly, sends HTML (fast on slow mobile networks). |
| **Client Component** | Has `'use client'` at the top; runs in the browser — needed for clicks, state, cart. Use sparingly. |
| **Server Action** | A function with `'use server'` that a form can call. Where all writes (create order, add product) happen. |
| **Drizzle schema** | TypeScript file describing your tables. Drizzle turns it into SQL migrations. |
| **Migration** | A versioned SQL file that changes the database structure. Committed to Git. |
| **Transaction** | A group of DB writes that all succeed or all fail together. |
| **Ledger** | An append-only history of every stock change. Never edited, only added to. |
| **TOTP / 2FA** | 6-digit codes from Google Authenticator/Authy, required for admin login. |
| **Webhook** | A payment/courier company calling your server to say "payment succeeded" / "parcel delivered". |
| **CSP** | Content Security Policy — a browser rule list that blocks injected scripts. |

---

## Milestone 0 — Prepare your machine & accounts *(½ day + paperwork in background)*

**Install**
- **Node.js 22 LTS** (https://nodejs.org) — Next.js 16 needs Node 20 or newer. Check: `node -v`.
- **Git** and a **GitHub** account (private repository).
- **VS Code** + extensions: ESLint, Tailwind CSS IntelliSense, Prettier, SQLite Viewer.
- An authenticator app on your phone (Google Authenticator / Microsoft Authenticator / Authy).

**Start paperwork now — approvals take 1–6 weeks**
- Wallet/aggregator merchant account(s) per your answer to Clarify Q2.
- Courier business account + API credentials (Leopards/TCS/Trax) per Q4.
- Stripe only if you chose Q1(a).
- Domain name (e.g. `caidea.pk` via PKNIC reseller, or `.com`).

**Done when:** `node -v` shows v22.x, `git --version` works, merchant/courier applications submitted.

---

## Milestone 1 — Scaffold the project *(1 hour)*

```bash
npx create-next-app@latest caidea --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd caidea
npm run dev        # open http://localhost:3000
```
Then:
```bash
git init && git add . && git commit -m "M01: scaffold Next.js 16"
mkdir data && echo "data/*.db*" >> .gitignore && echo ".env*.local" >> .gitignore
```
Copy `SPECIFICATION.md`, `CLARIFICATIONS.md`, `BUILD_GUIDE.md` into the project root. Turn on strict TypeScript extras in `tsconfig.json`: `"noUncheckedIndexedAccess": true`.

**Learn:** project layout, `npm run dev`, Git basics.
**Done when:** default Next.js page loads; first commit exists; repo pushed to GitHub (private).

> ✅ **Built (2026-10-02)** with Next.js 16.3.8. Pushing to your own private GitHub repo is left for you.

---

## Milestone 2 — Design system *(1–2 days)* — Spec §0.2, §0.3

1. **Fonts** in `src/app/layout.tsx`:
```tsx
import { Epilogue, Plus_Jakarta_Sans } from "next/font/google";
const epilogue = Epilogue({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-epilogue", display: "swap" });
const jakarta  = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-jakarta", display: "swap" });
// <html className={`${epilogue.variable} ${jakarta.variable}`}> <body className="bg-canvas text-midnight font-sans">
```
2. **Tokens** in `src/app/globals.css` (Tailwind v4):
```css
@import "tailwindcss";

@theme {
  --color-*: initial;            /* remove Tailwind's default palette */
  --color-midnight:   #0B1C33;
  --color-terracotta: #A52A2A;
  --color-amber:      #D97706;
  --color-canvas:     #FBF8F1;
  --color-surface:    #F6EFE5;
  --color-white:      #FFFFFF;

  --font-display: var(--font-epilogue), system-ui, sans-serif;
  --font-sans:    var(--font-jakarta), system-ui, sans-serif;

  --radius-bezel-sm: 1.25rem;
  --radius-bezel:    1.5rem;
  --radius-bezel-lg: 1.75rem;
}
```
Now classes like `bg-midnight`, `text-amber`, `rounded-bezel`, `font-display` work. Muted text = `text-midnight/70`.
3. Build primitives in `src/components/ui/`: `Button` (variants: primary midnight, urgent terracotta, ghost; always `rounded-full`), `Badge` (grade badge = amber), `Card` (white, `rounded-bezel`), `Input`, `Select`, `Table`, `Dialog`, `SectionDark` (midnight full-width band).
4. Make a private page `/dev/ui` that shows every primitive — your visual checklist.
5. Build the storefront shell: header (logo, nav, PKR/USD selector pill, cart pill), dark footer.

**Learn:** Tailwind v4 `@theme`, component variants, `next/font`.
**Done when:** `/dev/ui` shows all components in the Caidea palette; using `bg-blue-500` produces no colour (proves defaults are off); header/footer look right on a 375px-wide phone view.

> ✅ **Built (2026-10-02).** Also includes the landing page (hero spec plate, delivery map, grade panel, values, stock table) reading live data from the M3 database.

---

## Milestone 3 — Database foundation *(2 days)* — Spec §4, §5

```bash
npm i drizzle-orm better-sqlite3 zod
npm i -D drizzle-kit @types/better-sqlite3 tsx
```
1. `drizzle.config.ts`:
```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url: "./data/caidea.db" },
});
```
2. `src/db/client.ts` — one connection with the pragmas from Spec §6.2:
```ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("./data/caidea.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("busy_timeout = 5000");
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("foreign_keys = ON");
export const db = drizzle(sqlite, { schema });
```
3. Paste the three **blueprint tables exactly** into `src/db/schema/inventory.ts`, then add the amendments A-1…A-5 and the other tables from §4 (one file per area: `catalog.ts`, `purchasing.ts`, `orders.ts`, `returns.ts`, `content.ts`, `settings.ts`). Re-export all in `schema/index.ts`.
4. Add `package.json` scripts:
```json
"db:generate": "drizzle-kit generate",
"db:migrate":  "drizzle-kit migrate",
"db:studio":   "drizzle-kit studio",
"db:seed":     "tsx src/db/seed.ts"
```
5. `npm run db:generate` → **open and read the SQL file** in `drizzle/` → `npm run db:migrate`.
6. Create a custom migration for triggers (A-6): `npx drizzle-kit generate --custom --name=ledger_guards` and write the three `CREATE TRIGGER` statements from Spec §6.5.
7. Write `seed.ts`: system user, delivery zones (Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar, Multan…), ~10 sample products with variants and `OPENING_BALANCE` ledger rows.
8. `npm run db:studio` to browse your data.

**Learn:** schemas, foreign keys, migrations, why SQLite needs `foreign_keys = ON`.
**Done when:** `npm run db:reset && npm run db:setup` runs cleanly from an empty folder (migrate → seed → verify) and ends with "All checks passed"; Drizzle Studio shows seeded data; trying `DELETE FROM stock_ledger` in SQLite Viewer fails with the trigger error.

> ✅ **Built (2026-10-02).** In the finished project `db:migrate` runs `src/db/migrate.ts` (backs up the database first) and `npm run db:verify` runs the guard checks — see README.md.

---

## Milestone 4 — Authentication, mandatory 2FA, admin shell *(2–3 days)* — Spec §10

```bash
npm i better-auth
```
1. `src/server/auth.ts`: `betterAuth({ database: drizzleAdapter(db, { provider: "sqlite" }), emailAndPassword: { enabled: true }, plugins: [twoFactor({ issuer: "Caidea" })] })`.
2. Generate auth tables: `npx @better-auth/cli generate` → move output into `src/db/schema/auth.ts`, add `role`, `phone`, `is_active` → `db:generate` + `db:migrate`.
3. Route handler `src/app/api/auth/[...all]/route.ts` (from Better Auth's Next.js docs).
4. `/login`: email + password → if 2FA enabled, show 6-digit code step; if staff user has no 2FA yet → `/admin/setup-2fa` (QR code + backup codes).
5. `src/server/dal.ts`: `requireUser()` and `requireRole(roles)` — read session server-side, throw/redirect if not allowed. **Call it at the top of every admin page and Server Action.**
6. `src/proxy.ts` (Next 16's renamed middleware): redirect `/admin/*` to `/login` when there's no session cookie (fast UX check only).
7. Admin layout: sidebar with all modules from Spec §2, items hidden by role.
8. Seed an OWNER user; log in; enrol 2FA with your phone.

**Learn:** sessions, cookies, why checking auth only in `proxy.ts` is unsafe.
**Done when:** logged-out visit to `/admin/products` → `/login`; owner without 2FA cannot reach any admin page; CASHIER role cannot open `/admin/reports` even by typing the URL; wrong TOTP code fails.

> ✅ **Built (2026-10-02)** with Better Auth 1.7.7 — pulled forward so the v1.2 admin screens could sit behind it. Staff are created with `npm run staff:create` (public sign-up is off). Tested in a real browser: redirect when signed out, enrolment required before any admin page, wrong codes rejected, backup codes work, cashier blocked from hero/catalogue/discount pages.

---

## v1.2 — Enterprise design brief (built 2026-10-02)

Added between M4 and M5 at the owner's request (see SPECIFICATION.md §15 for the decisions):
- Two-tier header (dark utility bar + single-line main menu + phone drawer) and promotion banner
- CSS-3D hero carousel managed in **Admin → Hero carousel**
- Product cards (2–3 photos, angle toggle, colour chips, feature tags, sale prices) with a Cards / Spec-table toggle on `/store`; `/categories`, `/deals`, product pages
- Admin: products with photo galleries and flags, categories, brands, promotions, coupons
- PKR-only storefront; discount engine with tests (`npm test`)

What later milestones must reuse: **M7** builds the cart on `listCatalog()` prices; **M8** checkout must call `redeemCoupon(tx, …)` inside the order transaction and store the discount in `orders.discount_paisa`.

## v1.3 — Home page refresh (built 2026-10-02)

See SPECIFICATION.md §16. Hero 20% shorter (desktop 744→570 px, phone 934→706 px) and promo bar 20% shorter; each slide has its own colour theme and phone position, and the 3D phone matches the model the slide names; a “Caidea in numbers” band; the delivery-cities map replaced by “Changing a screen, explained” (6 steps + a 6-second generated animation) and “Before you buy a screen”; AAA+ grades renamed to “A Grade”. New admin screen **Home page** for the figures and the video.

What later milestones must reuse: **M8** checkout still uses `getDeliveryCities()` for fees (only the map was removed); **M12** can replace the hand-typed “screens sold” figure with a live count from the stock ledger.

---

## Milestone 5 — The stock engine ⭐ most important *(2 days)* — Spec §6

`src/server/inventory/stock.ts`:
```ts
import { and, eq, sql } from "drizzle-orm";
import { productVariants, stockLedger } from "@/db/schema";

export class InsufficientStockError extends Error {
  constructor(public variantId: string) { super(`Insufficient stock for ${variantId}`); }
}

// Must be called INSIDE db.transaction(...). Synchronous on purpose (better-sqlite3).
export function applyStockMovement(tx: Tx, m: StockMovement): number {
  const rows = tx.update(productVariants)
    .set({ currentStock: sql`${productVariants.currentStock} + ${m.delta}`, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(and(eq(productVariants.id, m.variantId), sql`${productVariants.currentStock} + ${m.delta} >= 0`))
    .returning({ newStock: productVariants.currentStock })
    .all();

  const row = rows[0];
  if (!row) throw new InsufficientStockError(m.variantId);

  tx.insert(stockLedger).values({
    id: crypto.randomUUID(),
    variantId: m.variantId,
    transactionType: m.type,
    quantityChanged: m.delta,
    previousStock: row.newStock - m.delta,
    newStock: row.newStock,
    referenceId: m.referenceId ?? null,
    // + referenceType and unitCostPaisa once amendment A-4 columns exist
    operatorId: m.operatorId,
    notes: m.notes ?? null,
  }).run();

  return row.newStock;
}
```
Using it:
```ts
db.transaction((tx) => {
  // insert order + items ...
  for (const line of lines) applyStockMovement(tx, { variantId: line.variantId, delta: -line.qty, type: "STORE_SALE", referenceId: orderId, operatorId: "system" });
}, { behavior: "immediate" });   // BEGIN IMMEDIATE = take the write lock first
```
⚠️ **Never use `await` or call an external API inside the transaction callback** — with better-sqlite3 it must be synchronous.

**Tests** (`npm i -D vitest`), using a fresh temp DB per test:
- selling 3 of 5 → stock 2, one ledger row with previous 5 / new 2;
- selling 6 of 5 → throws, stock still 5, **zero** ledger rows (rollback worked);
- 50 simulated concurrent sales of a 10-unit variant → exactly 10 succeed;
- `SUM(quantity_changed) == current_stock` after a random sequence of movements.

**Learn:** atomic updates, transactions, rollback, why stock is never edited directly.
**Done when:** all four tests pass. This engine is reused by checkout, POS, POs and returns.

> ✅ **Built (2026-10-02).** `src/server/inventory/stock.ts` exports `applyStockMovement`, `withStockTransaction` (use it instead of calling `db.transaction` yourself) and `findLedgerDrift`. Tests in `tests/unit/stock.test.ts`: the four above — the race test runs 10 real threads with their own database connections — plus multi-line rollback, input guards, and a check that no other file writes `current_stock`. Seed opening stock now goes through the engine.
>
> **For M6:** the manual-adjustment dialog must call `requireStaff` for MANAGER/OWNER itself and pass the notes; PO receiving passes `unitCostPaisa` (landed cost) and `referenceId` = the PO id; refresh caches after the transaction commits.

---

## Milestone 6 — Admin catalog, vendors, purchase orders, ledger *(4–5 days)* — Spec §4.5–4.6, §7

- **Products:** list with search/filters → create/edit form (Zod-validated Server Action) → variants sub-table → image upload (sharp re-encode) → publish toggle → CSV import.
- **Vendors:** CRUD.
- **Purchase orders:** create draft, add lines, mark ordered, **Receive** screen (enter received qty per line → one transaction: update PO, `applyStockMovement(+qty, 'INBOUND_PO')`, recompute weighted average cost).
- **Stock ledger page:** read-only table, filters, CSV export.
- **Manual adjustment dialog:** MANAGER only, notes required.
- Every mutation also writes `admin_audit_log`.

**Done when:** receiving a PO for 20 units raises stock by 20 and shows a ledger row with your user as operator; partial receipt works; editing a product's price is visible in audit log.

> ✅ **Built (2026-10-03).** Admin → Stock: Purchase orders, Vendors, Stock ledger. Product page: "Count or correct stock" and "Change history". Products list: Import / Export CSV. Rules in SPECIFICATION.md §17; logic in `src/server/purchasing/`, `src/server/inventory/adjust.ts`, `ledger.ts`, `src/server/catalog/product-csv.ts` (all unit-tested). Checked in a real browser as a 2FA manager: 20 units received in two parts (8 + 12) with the manager as operator, a stale second receipt refused, a price edit shown in change history, cashier blocked from every stock page and download.
>
> **For M7/M8:** sales call `withStockTransaction` + `applyStockMovement` (`STORE_SALE` / `COUNTER_POS`) and then `revalidateStorefront()`; the ledger page already shows order codes for `reference_type = ORDER` rows.

---

## Milestone 7 — Storefront *(4–5 days)* — Spec §0.3, §12

1. **Landing:** hero → "Cities we deliver to" (SVG Pakistan map + pins from `delivery_zones`) → dark midnight pause band → "What We Stand For" 3 columns → featured grades → testimonials → dark footer.
2. **`/store`:** Server Component reads filters from URL search params (`?brand=Samsung&display=AMOLED`) → spec-table catalog. Filters: brand, model search, display type, quality grade, colour, in-stock only. Pagination.
3. **`/store/[slug]`:** spec table, grade badge (amber), variant picker, stock state ("In stock", "Only 2 left", "Out of stock"), compatibility list, warranty note.
4. **Cart:** client component; lines (variant ID + qty only) kept in the browser (localStorage, wrapped in try/catch) — no prices stored there. Prices and stock are always re-checked on the server at checkout.
5. **Currency selector:** cookie `currency=PKR|USD`; prices formatted server-side.
6. Caching: wrap catalog queries with tags; call `revalidateTag` from stock/price mutations.

**Done when:** a product published in admin appears in `/store`; selling the last unit at the counter shows "Out of stock" on the website within seconds; page looks right at 375px.

---

## Milestone 8 — Checkout with COD + manual wallet *(3–4 days)* — Spec §6.3, §8

Steps UI: Contact & address → Delivery city (fee + ETA from `delivery_zones`) → Payment (COD / JazzCash / Easypaisa / NayaPay manual TID / bank transfer) → Review → Place order.
- `placeOrder` Server Action exactly as Spec §6.3 (idempotency key, server-side re-pricing, one transaction).
- Success page with order code + WhatsApp "confirm my order" link.
- Public `/order/[code]` tracking (requires phone number match).
- Cron route `expire-unpaid` (protected by `CRON_SECRET`) cancels expired unpaid orders and restocks via `ORDER_CANCEL_RESTOCK`.

**Done when:** double-clicking "Place order" creates one order; two browsers buying the last unit → one succeeds, the other sees a friendly "just sold out" message; an expired manual-TID order returns stock with a ledger row.

---

## Milestone 9 — Counter sale (POS) *(3 days)* — Spec §6.4

Keyboard-first screen: SKU/barcode input (USB scanners type like a keyboard + Enter) → ticket lines → retail/wholesale toggle (technician lookup by phone) → payment method → **Complete sale** → print 80mm receipt (`@media print` CSS). End-of-day summary per cashier.

**Done when:** a sale completes in under 10 seconds with keyboard only; receipt prints; ledger shows `COUNTER_POS` with the cashier as operator.

---

## Milestone 10 — Orders admin & couriers *(3–4 days, + API work when keys arrive)* — Spec §9

1. Orders list/detail, status transitions, **Verify payment** button for manual TIDs (checks TID uniqueness).
2. **Phase A (no API keys yet):** "Book shipment" form where staff paste the CN number from the courier portal.
3. **Phase B:** implement the `CourierProvider` adapter for your chosen courier(s): city mapping, book → CN + label, bulk book, load sheet, tracking cron.
4. COD remittance: upload courier CSV → mark orders `COD_REMITTED`, show mismatches.

**Done when:** an order goes NEW → CONFIRMED → PACKED → BOOKED → DELIVERED with every step in its history; label prints (Phase B).

---

## Milestone 11 — Returns & warranty *(2–3 days)* — Spec §4.12

Create RMA from an order → automatic warranty check (`warranty_until`) → inspection → disposition: Restock (`REPAIR_RETURN`) / Return to vendor (vendor claim) / Write-off → refund record.

**Done when:** a resellable return increases stock with a `REPAIR_RETURN` ledger row; a defective one does **not** increase sellable stock and appears under the vendor's claims.

---

## Milestone 12 — Dashboard & reports *(3 days)* — Spec §6.6, §7

SQL aggregations (in `src/server/reports/`) for: sales by day/channel, margin by brand & grade, brand velocity, days of cover + reorder suggestions, turnover, dead stock, COD reconciliation, cashier totals. Charts with a light library (e.g. Recharts in a client component) fed by server data. CSV export on every report.

**Done when:** numbers on the dashboard match a hand calculation on seeded data.

---

## Milestone 13 — Content pages *(2–3 days)*

`/about`, `/services`, `/contact` (rate-limited form + honeypot), `/blog` + `/blog/[slug]` (Markdown, sanitised), admin Blog and Testimonials editors with draft/publish. Add `sitemap.ts`, `robots.ts`, Open Graph metadata, `Product` + `Organization` JSON-LD.

**Done when:** a post published in admin appears on `/blog` and in `/sitemap.xml`.

---

## Milestone 14 — Payment automation *(depends on Clarify Q1/Q2 and approvals)* — Spec §8

Implement adapters for the provider(s) you chose, sandbox first: create payment → redirect/form-post → **server-to-server callback with signature verification** → `webhook_events` de-duplication → mark PAID → status-query reconciliation cron. Stripe (if chosen): Checkout Session + `checkout.session.completed` webhook verified with `stripe.webhooks.constructEvent` on the raw body.

**Done when:** sandbox payment marks order PAID only via callback; replaying the same webhook changes nothing; tampered amount is rejected.

---

## Milestone 15 — Security hardening *(2 days)* — Spec §11

Nonce-based CSP + security headers in `proxy.ts`; `serverActions.allowedOrigins`; rate limits on login/contact/checkout; `rehype-sanitize` on blog; upload checks; ESLint rule banning `sql.raw`; `npm audit`. Run OWASP ZAP baseline scan against staging.

**Done when:** securityheaders.com grade A on staging; ZAP baseline has no high-risk findings; browser console shows no CSP violations on any page.

---

## Milestone 16 — Performance *(2 days)* — Spec §12

Lighthouse (mobile, "Slow 4G" throttling) on landing, store, product, checkout. Fix: image `sizes`, LCP image `priority`, move components back to server, remove unused JS, font weights. Add Lighthouse CI budget.

**Done when:** mobile Performance ≥ 95 on landing, store and product pages.

---

## Milestone 17 — End-to-end tests *(2 days)*

Playwright: browse → add to cart → COD checkout; manual TID checkout + admin verify; POS sale; PO receipt; return restock; admin blocked without 2FA. Run in GitHub Actions on every push.

**Done when:** CI is green on `main`.

---

## Milestone 18 — Deploy on the shop server *(2 days)* — Spec §0.1, §11.6–7

**Hardware:** a dedicated mini-PC (e.g. 8 GB RAM, SSD) — not the cashier's computer — on a **UPS**, with a backup internet line (second ISP or 4G router).

1. Install **Ubuntu Server 24.04 LTS** (easiest for Node/SQLite), enable full-disk encryption, auto security updates.
2. Install Node 22, clone the repo, `npm ci && npm run build`, create `.env.production`, run `npm run db:migrate`.
3. Run the app with **systemd** as a single process (`next start -p 3000`; no cluster mode).
4. **Cloudflare Tunnel** (`cloudflared`): connects the shop server to Cloudflare *outbound*, so your domain works over HTTPS without a static IP or opening router ports. Point `caidea.pk` (or your domain) at the tunnel.
5. **Backups:** Litestream → Cloudflare R2 or Backblaze B2 (continuous), plus a nightly snapshot. Test a restore on another computer.
6. systemd timers call `/api/cron/*` with `CRON_SECRET` (expire unpaid orders, tracking sync, stock reconcile).
7. Admin access to the server: SSH key only (or through the tunnel with Cloudflare Access).

**Done when:** site is live on HTTPS at your domain; unplugging the shop router's main line keeps the site up via the backup line; a backup restored on another machine shows the latest orders.

---

## Milestone 19 — Go-live checklist

- [ ] Real products entered with opening stock counted physically
- [ ] All staff accounts created, each with 2FA enrolled
- [ ] Live payment keys swapped in; one real small payment per method tested and refunded
- [ ] Courier live booking tested with one real parcel
- [ ] Delivery zones, fees, COD limit, warranty policy, USD rate set
- [ ] Privacy policy, terms, return policy pages published
- [ ] Backups running + restore tested
- [ ] Uptime monitor (e.g. UptimeRobot) and error tracking (e.g. Sentry) on

---

## Rough timeline (one beginner, part-time help from Claude)

| Weeks | Milestones |
|---|---|
| 1 | M0–M3 |
| 2 | M4–M5 |
| 3–4 | M6–M7 |
| 5 | M8–M9 |
| 6 | M10–M11 |
| 7 | M12–M13 |
| 8 | M14–M16 |
| 9 | M17–M19 |

Payment and courier approvals are usually the slowest part — that's why their paperwork starts in M0 and the system works with manual TID verification and manual CN entry until the APIs are ready.

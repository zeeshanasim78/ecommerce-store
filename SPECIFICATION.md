# Caidea Commerce & POS Engine — SPECIFICATION.md

> **Status:** v1.5 — Milestone 6 (§17: vendors, purchase orders, stock ledger page, stock counts, product CSV) on top of v1.4. Milestones 1–6 done, plus the enterprise design brief (§15) and home-page refresh (§16). Next: Milestone 7 (storefront: cart).
> **Method:** Specification Driven Development — Constitution → Research → Specify → Clarify → Build.
> **Rule:** Any gap found during Build stops coding; this file is updated and re-clarified first.
> **Change log:** every edit to this file gets a line in §14.

---

## 0. The Constitution (absolute rules)

### 0.1 Tech stack (pinned at project start, Oct 2026)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.x (App Router)** | Turbopack is the default bundler. Requires **Node.js 20+** (use Node 22 LTS). In Next 16 the old `middleware.ts` is named **`proxy.ts`**. |
| Language | **TypeScript** (strict mode) | `"strict": true`, `noUncheckedIndexedAccess: true` |
| Styling | **Tailwind CSS v4** | Tokens declared with `@theme` in `app/globals.css` (no `tailwind.config.js` needed) |
| ORM | **Drizzle ORM + drizzle-kit** | SQL-first, type-safe, generated migrations |
| Database | **SQLite** in one file: `./data/caidea.db` | Driver: `better-sqlite3` (synchronous, fastest for single-server). WAL mode. |
| Auth | **Better Auth** + `twoFactor` plugin (TOTP + backup codes) | Official Drizzle adapter, `provider: "sqlite"` |
| Validation | **Zod** | Every server action and route handler input |
| Payments | **Launch:** COD + manual wallet TID verification (JazzCash / Easypaisa / NayaPay) + bank transfer. **Phase 2:** one Pakistani aggregator (cards + wallets). Stripe adapter stubbed, disabled. | Decided Q1 (aggregator), Q2 (manual TID first). Adapter pattern (§8). |
| Couriers | **Leopards + PostEx** | Decided Q4. Manual CN entry until API keys arrive; then adapters (§9). |
| Testing | Vitest (unit), Playwright (E2E) | |
| Hosting | **On-premise server/PC in the shop** (decided Q6) running `next start` as a single process, exposed via **Cloudflare Tunnel** (no static IP or open router ports needed), with Cloudflare caching in front | Requires: UPS (≥ 1 h), backup internet line (second ISP or 4G router), hourly **off-site** encrypted backups (§11.6). Moving later to a VPS is a copy of the `.db` file + repo. |

### 0.2 Design tokens (must be used verbatim — no Tailwind default palette in UI code)

| Token | Hex | Usage |
|---|---|---|
| `--color-midnight` | `#0B1C33` | Headings, primary CTAs, structural containers, dark footer/panels |
| `--color-terracotta` | `#A52A2A` | Checkout urgency, active states, destructive confirmations |
| `--color-amber` | `#D97706` | Quality-grade badges ("OEM Original", "OLED A Grade") |
| `--color-canvas` | `#FBF8F1` | Page background |
| `--color-surface` | `#F6EFE5` | Section bands, sidebars |
| `--color-white` | `#FFFFFF` | Floating cards, modals |

- **Fonts:** `Epilogue` (display/headlines) and `Plus Jakarta Sans` (body, specs, labels), loaded with `next/font/google` (self-hosted, subset `latin`, `display: swap`).
- **Shape:** interactive elements (buttons, chips, inputs, toggles) `rounded-full` (9999px). Containers/cards `rounded-[1.25rem]` → `rounded-[1.75rem]` (bezel radius).
- **Accessibility guard:** amber `#D97706` on canvas is ~3:1 contrast — use it for badges with **bold ≥14px text or as a fill with midnight text**, never for small body copy. Terracotta on white passes AA for normal text.
- Default `tailwind` colours are disabled via `@theme { --color-*: initial; }` then re-declared, so a stray `bg-blue-500` fails visibly.
- **Glass & glow rule (v1.2):** glassmorphism, ambient glow and fine 1px light borders (`rgba(255,255,255,0.1)` = `border-white/10`) are used **only on dark midnight surfaces** — the hero carousel, the utility top bar and the footer. Glass = translucent white fill (5–8 %) + backdrop blur; glow = soft radial amber/terracotta light at ≤ 25 % opacity. Light (cream) sections stay flat and editorial.
- **Discount pricing (v1.2):** original price struck through in `midnight/45`; discounted price in **terracotta**; discount badges terracotta fill with white text. No other accent colours are introduced.
- **Motion (v1.2):** CSS transitions and keyframes only — no animation library. Micro-interactions on buttons (subtle lift), cards (image float on hover) and nav items; one orchestrated hero entrance. Everything is disabled under `prefers-reduced-motion`.

### 0.3 Layout doctrine (structure only, inspired by hamzabhaiseafood.com)
1. Two-tier header (v1.2):
   - **Utility top bar** (dark midnight, glass): About · Contact · Terms · Track order · FAQs, plus the store phone.
   - **Main menu** (cream, elevated, single line, `white-space: nowrap`): logo · Catalogue (`/store`) · Categories (`/categories`) · Deals (`/deals`) · Wholesale & Enterprise (`/services`) · Cart pill. Collapses to a drawer below `lg`.
   - **Promotion banner** above both when an active promotion has `show_banner`.
   - **No currency selector** — the storefront is PKR-only (§3).
1a. **Hero carousel (v1.2):** 4–5 admin-managed slides (§4.16 `hero_slides`) on a dark midnight band. Left: heading, subheading, rich-text description (Markdown, sanitised), primary CTA. Right: a lightweight **CSS-3D phone-screen model** (no 3D library, no model files) showing the linked product's grade and model on its screen, slowly rotating and tilting with the pointer at 60 FPS; or an admin-supplied image (`visual_url`). Auto-advances every **4 s** with eased transitions; pauses on hover, keyboard focus and when the tab is hidden; play/pause button, progress bar, slide triggers, arrow keys. No autoplay under reduced motion.
2. ~~"Cities we deliver to" map~~ — **removed in v1.3 (owner decision, Q20).** Delivery cities stay in `delivery_zones` for checkout fees only. In its place: **"Changing a screen, explained"** — the repair process, a buyer's checklist, and a 6-second looping video of an iPhone screen being changed (§16).
2a. **"Caidea in numbers"** band (v1.3): admin-edited figures such as branches in Pakistan and China and screens sold (`settings.home_stats`). Display only — stock stays one pool (Q22).
3. **"What We Stand For"** 3-column index: Carefully Selected Grades · Handled Properly · Delivered Safely.
4. Horizontal **dark midnight panels** as visual pauses between light sections.
5. Catalogue (v1.2): **product cards** grouped by brand and category, each with 2–3 images (angle toggle, hover swap, colour-variant swatches), feature tags and a clear price hierarchy. `/store` has a **Cards / Spec table toggle** (`?view=table`) so repair shops keep the dense spec-table view (brand · model · display type · grade · colour · stock state · price).
6. **Zero seafood content, copy or imagery.** Only spacing rhythm and component flow are inherited.

### 0.4 Non-negotiable engineering rules
1. Every stock change goes through **one function** (`applyStockMovement`, §6) inside a DB transaction. No other code may write `product_variants.current_stock`.
2. `stock_ledger` is **append-only** (enforced by DB triggers, §6.5).
3. All money math happens in **integer paisa** in TypeScript (`1 PKR = 100 paisa`); see §3.
4. Authorisation is checked **in the data layer** (every server action / route handler), not only in `proxy.ts`.
5. No secrets in the repo. `.env.local` is git-ignored; `.env.example` documents every key.

---

## 1. Research summary (Phase 1)

| Finding | Impact on spec |
|---|---|
| Reference app `caidea-stock-flow.base44.app` exposes: Store, Cart, Checkout, About, Blog, Contact, Services, Login, and Admin: Dashboard, Products, Vendors, Purchase Orders, Orders, Counter Sale, Stock Ledger, Returns, Reports, Blog, Testimonials. | Route map §2 mirrors it 1:1. |
| Reference URLs are `/admin/stock-ledger` and `/admin/blog`; the brief says `admin/stock-ledger-page` and `admin/blog-admin`. | **Default:** use the clean reference URLs (`/admin/stock-ledger`, `/admin/blog`). `/admin` redirects to `/admin/dashboard`. |
| hamzabhaiseafood.com blocks automated access. | Layout doctrine §0.3 is taken from the brief's description. |
| Next.js 16.3 is the current minor; 16 made Turbopack default and renamed middleware → proxy. | §0.1 pins 16.x. |
| **Stripe does not support accounts for Pakistan-registered businesses.** | Stripe is an optional adapter; needs a foreign entity. Clarify Q1. |
| JazzCash/Easypaisa can be integrated **directly** (separate merchant agreements, each with own API) or via **aggregators** (Safepay, Simpaisa, PayFast, bSecure) through one API. | Payment adapter pattern; Clarify Q2. |
| Leopards, TCS, Trax all offer booking + tracking APIs (CN number, label, load-sheet, COD amount). | Courier adapter pattern; Clarify Q4. |
| Better Auth ships a `twoFactor` plugin (TOTP, backup codes, trusted devices) and a Drizzle adapter for SQLite. | Auth §10. |

---

## 2. Route hierarchy

```
app/
├─ (storefront)/                 ← public layout: header, footer, currency selector
│  ├─ page.tsx                   /            Landing (hero carousel, numbers, featured cards, repair guide + video, grades, values)
│  ├─ store/page.tsx             /store       Catalog + hardware filters (brand, model, display, grade, colour, in-stock)
│  ├─ store/[slug]/page.tsx      /store/:slug Product detail (gallery, spec table, variant picker, compatibility)
│  ├─ categories/page.tsx        /categories  Category index (v1.2)
│  ├─ deals/page.tsx             /deals       Discounted products + active promotions (v1.2)
│  ├─ cart/page.tsx              /cart
│  ├─ checkout/page.tsx          /checkout    Address → Shipping → Payment → Review
│  ├─ checkout/success/page.tsx  /checkout/success?order=…
│  ├─ order/[code]/page.tsx      /order/:code Public order tracking (code + phone check)
│  ├─ about/ blog/ blog/[slug]/ services/ contact/
│  └─ account/…                  Customer orders, addresses (if customer accounts enabled — Clarify Q7)
├─ (auth)/login/page.tsx         /login       Email+password → TOTP step
├─ uploads/[...path]/route.ts    /uploads/*   Serves admin-uploaded images from data/uploads (v1.2)
├─ admin/                        ← protected layout: sidebar, role-gated
│  ├─ page.tsx                   → redirect /admin/dashboard
│  ├─ dashboard/ products/ products/[id]/ vendors/ purchase-orders/ purchase-orders/[id]/
│  ├─ orders/ orders/[id]/ counter-sale/ stock-ledger/ returns/ returns/[id]/
│  ├─ reports/ blog/ testimonials/ settings/ users/
│  ├─ setup-2fa/                 Mandatory TOTP enrolment for staff (M4)
│  ├─ hero/                      Hero carousel slides: add, edit, reorder, activate (v1.2)
│  ├─ categories/ brands/        Catalogue taxonomy (v1.2); products/ gains gallery, flags, sale price
│  ├─ coupons/ promotions/       Discount engine (v1.2)
│  ├─ vendors/ purchase-orders/ purchase-orders/[id]/print/  Purchasing (v1.5)
│  ├─ stock-ledger/ (+ /export)  Read-only ledger + CSV (v1.5)
│  ├─ products/import/ products/export  Product CSV (v1.5)
└─ api/
   ├─ auth/[...all]/route.ts           Better Auth handler
   ├─ webhooks/stripe/route.ts         Signature-verified
   ├─ webhooks/[wallet]/route.ts       jazzcash | easypaisa | nayapay | aggregator
   ├─ webhooks/courier/[courier]/route.ts  Tracking status push (where supported)
   └─ cron/[job]/route.ts              Secret-protected: expire unpaid orders, sync tracking, reconcile stock, backup
```

Server Actions (`'use server'`) handle all form mutations; route handlers exist only for webhooks, auth, cron, serving uploads, and read-only CSV downloads (`/admin/products/export`, `/admin/stock-ledger/export`, v1.5) — every one of them calls `requireStaff` itself.

---

## 3. Money & currency rules

- **Base currency PKR.** Inventory, cost basis, reports and accounting are PKR only.
- **PKR-only storefront (v1.2, decided):** every shopper-facing price — cards, product pages, cart, checkout, emails, receipts — shows PKR as `Rs 12,500`. No `$`/USD appears on the storefront or in customer-facing output; the PKR/USD switch is removed. **Exception kept on purpose:** supplier purchase orders (§4.6) still record USD/CNY/AED cost and an FX rate, because imports are invoiced in those currencies; they appear only in admin purchasing screens.
- Blueprint columns `cost_price`, `retail_price_pkr`, `wholesale_price_pkr` stay `real` (as mandated) and hold **rupees with max 2 decimals**. They are read/written only through `toPaisa()` / `fromPaisa()` helpers that round half-up — floats are never summed directly.
- **All new tables store money as `integer` paisa** (`*_paisa` suffix). Order lines snapshot price at time of sale.
- ~~USD display conversion~~ — removed in v1.2. `settings.usd_pkr_rate` is kept only for the disabled Stripe stub; `orders.display_currency` is always `PKR`.
- PKR display: no decimals, grouped `Rs 12,500`.
- **Effective price (v1.2):** `min(retail, active product sale price, best active promotion price)`, computed by one pure function (`src/server/pricing/price.ts`). Coupons apply to the order subtotal at checkout, after line prices (§4.16).

---

## 4. Relational database design

### 4.0 Conventions
- IDs: `text` primary keys generated with `crypto.randomUUID()` (blueprint style). Human-facing codes are separate columns (`CA-ORD-260102-0042`, `PO-0007`, `RMA-0012`).
- Timestamps: ISO-8601 UTC text, `DEFAULT CURRENT_TIMESTAMP`; displayed in `Asia/Karachi`.
- Enums: `text` columns + Zod enum + SQLite `CHECK` constraint.
- Soft delete via `archived_at` on catalogue/vendor/content tables. **Products and variants are never hard-deleted** (protects the ledger; §6.5).
- `PRAGMA foreign_keys = ON` on every connection (SQLite defaults it OFF).

### 4.1 Blueprint tables (incorporated exactly as given)

```typescript
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// 1. Core Product Table
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  brand: text("brand").notNull(), // e.g., 'Samsung', 'Apple', 'Xiaomi'
  model: text("model").notNull(), // e.g., 'Galaxy S23 Ultra', 'iPhone 14 Pro Max'
  displayType: text("display_type").notNull(), // e.g., 'AMOLED', 'OLED', 'IPS LCD'
  qualityGrade: text("quality_grade").notNull(), // e.g., 'OEM Original', 'Compatible Grade AAA+'
  sku: text("sku").unique().notNull(),
  costPrice: real("cost_price").notNull(), // Sourced cost basis
  retailPricePKR: real("retail_price_pkr").notNull(),
  wholesalePricePKR: real("wholesale_price_pkr").notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// 2. Product Variant / Real-time Stock Inventory Table
export const productVariants = sqliteTable("product_variants", {
  id: text("id").primaryKey(),
  productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  color: text("color").notNull(), // e.g., 'Phantom Black', 'Deep Purple'
  currentStock: integer("current_stock").default(0).notNull(),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// 3. Complete Stock Ledger Table (Audit Trail)
export const stockLedger = sqliteTable("stock_ledger", {
  id: text("id").primaryKey(),
  variantId: text("variant_id").references(() => productVariants.id, { onDelete: "cascade" }).notNull(),
  transactionType: text("transaction_type").notNull(), // 'INBOUND_PO', 'STORE_SALE', 'COUNTER_POS', 'REPAIR_RETURN', 'MANUAL_ADJUST'
  quantityChanged: integer("quantity_changed").notNull(), // Positive values for additions, negative for sales/reductions
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  referenceId: text("reference_id"), // Connects to Order ID, Purchase Order ID, or Return ID
  operatorId: text("operator_id").notNull(), // Tracks the admin user executing the shift change
  notes: text("notes"),
  timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`).notNull(),
});
```

**Proposed additive amendments** (no blueprint column is renamed or removed; these are new columns/tables, indexes, triggers):

| # | Amendment | Why |
|---|---|---|
| A-1 | `products` + `slug` (unique), `description`, `compatibility` (JSON text: list of models it fits), `warranty_days` (int, default 7), `is_published` (int 0/1), `archived_at`, `updated_at` | Storefront URLs, publishing workflow, returns/warranty, soft delete |
| A-2 | `product_variants` + `variant_sku` (unique), `variant_label` (e.g. "With Frame"), `bin_location` (shelf code), `archived_at`; `CHECK (current_stock >= 0)` | Screens often vary by frame/no-frame as well as colour (Clarify Q8); never negative stock |
| A-3 | `stock_ledger.transaction_type` allowed values extended with `'ORDER_CANCEL_RESTOCK'`, `'RETURN_TO_VENDOR'`, `'DAMAGED_WRITE_OFF'`, `'OPENING_BALANCE'` | Cancelled unpaid orders, sending defects back to suppliers, breakage and initial stock count must not hide inside `MANUAL_ADJUST` |
| A-4 | `stock_ledger` + `reference_type` (`ORDER`/`PO`/`RETURN`/`ADJUSTMENT`/`COUNT`) and `unit_cost_paisa` (cost at movement time) | Polymorphic reference clarity; COGS & valuation in reports |
| A-5 | Indexes: `stock_ledger(variant_id, timestamp)`, `stock_ledger(reference_id)`, `product_variants(product_id)`, `products(brand, model)` | Ledger page & catalog filters |
| A-6 | Triggers blocking UPDATE/DELETE on `stock_ledger`, and blocking DELETE of a variant that has ledger rows (§6.5) | The blueprint's `onDelete: cascade` would otherwise erase audit history |

### 4.2 Auth tables (generated by Better Auth CLI, then edited)
`user`, `session`, `account`, `verification`, `two_factor`.
Added to `user`: `role` (`OWNER` | `MANAGER` | `CASHIER` | `CONTENT_EDITOR` | `CUSTOMER` | `TECHNICIAN`), `phone`, `is_active`, `two_factor_enabled` (managed by plugin).
A fixed row `id = 'system'` (role `SYSTEM`, cannot log in) is the `operator_id` for automated movements (online sales, cron cancellations).

### 4.3 `customers` *(if accounts are enabled — Clarify Q7; otherwise guest data lives on orders)*
`id, user_id → user.id (nullable for guests), name, phone (unique, E.164 +92…), email, customer_type ('RETAIL'|'TECHNICIAN'), technician_status ('PENDING'|'APPROVED'|'REJECTED'), shop_name, city, notes, created_at`
→ `TECHNICIAN` + `APPROVED` unlocks `wholesale_price_pkr` on storefront and POS.

### 4.4 `addresses`
`id, customer_id → customers, label, line1, line2, area, city_id → delivery_zones, postal_code, phone, is_default`

### 4.5 `vendors`
`id, code (unique), name, contact_person, phone, email, city, country ('PK'|'CN'|'AE'|…), currency ('PKR'|'USD'|'CNY'), payment_terms ('ADVANCE'|'NET_15'|'NET_30'), lead_time_days, rating (1–5), brands_supplied (JSON), notes, archived_at, created_at`

### 4.6 `purchase_orders` / `purchase_order_items`
- `purchase_orders`: `id, code, vendor_id → vendors, status, ordered_at, expected_at, received_at, currency, fx_rate_to_pkr, shipping_cost_paisa, customs_duty_paisa, other_landed_cost_paisa, notes, created_by → user, created_at`
- Status machine: `DRAFT → ORDERED → PARTIALLY_RECEIVED → RECEIVED`, or `DRAFT|ORDERED → CANCELLED`.
- `purchase_order_items`: `id, po_id → purchase_orders (cascade), variant_id → product_variants, qty_ordered, qty_received, unit_cost_foreign (minor units), landed_unit_cost_paisa (computed on receipt)`
- **Landed cost** = unit cost × fx + (shipping + customs + other) allocated by line value. On receipt, `products.cost_price` updates to the **weighted average cost** (Clarify Q9 — default WAC).

### 4.7 `orders` (online + counter, one table)
`id, code (unique), channel ('ONLINE'|'COUNTER'), customer_id (nullable), guest_name, guest_phone, guest_email, shipping_address (JSON snapshot), city_id → delivery_zones, price_tier ('RETAIL'|'WHOLESALE'), subtotal_paisa, discount_paisa, shipping_fee_paisa, cod_fee_paisa, total_paisa, display_currency, fx_rate_used, payment_method ('COD'|'JAZZCASH'|'EASYPAISA'|'NAYAPAY'|'AGGREGATOR'|'CARD_STRIPE'|'BANK_TRANSFER'|'CASH'|'POS_CARD'), payment_status, fulfillment_status, idempotency_key (unique), placed_at, paid_at, cancelled_at, cancel_reason, created_by (cashier for COUNTER), notes`

- `payment_status`: `UNPAID → PENDING_VERIFICATION → PAID` | `FAILED` | `REFUNDED` | `PARTIALLY_REFUNDED` | `COD_PENDING → COD_COLLECTED → COD_REMITTED`
- `fulfillment_status`: `NEW → CONFIRMED → PACKED → BOOKED (courier CN issued) → IN_TRANSIT → DELIVERED` | `RETURNED_TO_ORIGIN (RTO)` | `CANCELLED`. Counter sales are created directly as `DELIVERED` + `PAID`.

### 4.8 `order_items`
`id, order_id → orders (cascade), variant_id → product_variants, product_snapshot (JSON: brand, model, grade, colour, sku), quantity (>0), unit_price_paisa, unit_cost_paisa (snapshot for margin), line_total_paisa, warranty_until`

### 4.9 `payments`
`id, order_id → orders, provider ('STRIPE'|'JAZZCASH'|'EASYPAISA'|'NAYAPAY'|'AGGREGATOR'|'MANUAL'|'CASH'), provider_ref (txn id / payment intent id), manual_reference (customer-entered wallet TID), payer_msisdn, amount_paisa, currency, fx_rate_used, status ('INITIATED'|'PENDING'|'SUCCEEDED'|'FAILED'|'REFUNDED'), verified_by → user (manual), verified_at, raw_response_hash, created_at`
Unique `(provider, provider_ref)` and `(provider, manual_reference)` — the same wallet TID can never be claimed by two orders.

### 4.10 `webhook_events`
`id, provider, event_id (unique per provider), received_at, processed_at, status, payload_sha256` — idempotency: a webhook replay is acknowledged but not re-applied.

### 4.11 `shipments`
`id, order_id → orders, courier ('LEOPARDS'|'TCS'|'TRAX'|'POSTEX'|'SELF'), service_type, cn_number (unique), label_url, weight_grams, cod_amount_paisa, status, last_tracking_event, booked_at, delivered_at, rto_at, loadsheet_id, created_by`

### 4.12 `returns` / `return_items` (RMA + warranty)
- `returns`: `id, code, order_id → orders, customer_id, reason ('DEAD_ON_ARRIVAL'|'TOUCH_FAULT'|'LINES_ON_DISPLAY'|'WRONG_ITEM'|'DAMAGED_IN_TRANSIT'|'CHANGE_OF_MIND'), status, resolution ('REFUND'|'REPLACEMENT'|'STORE_CREDIT'|'REJECTED'), within_warranty (bool, computed), inspected_by, inspection_notes, refund_paisa, created_at, closed_at`
- Status: `REQUESTED → RECEIVED → INSPECTING → APPROVED|REJECTED → CLOSED`
- `return_items`: `id, return_id, order_item_id, quantity, condition ('RESELLABLE'|'DEFECTIVE'|'PHYSICALLY_DAMAGED'), disposition ('RESTOCK'|'RETURN_TO_VENDOR'|'WRITE_OFF')`
- Stock effect only at **disposition** time: `RESTOCK` → `REPAIR_RETURN` (+qty). Defective items are not added to sellable stock; they are tracked in `vendor_claims` (vendor_id, return_item_id, status) for RTV.

### 4.13 `delivery_zones`
`id, city, province, is_active, shipping_fee_paisa, cod_available, cod_fee_paisa, eta_min_days, eta_max_days, default_courier, map_x, map_y (pin coordinates on SVG map, projected from real lat/long), is_hub (dispatch city; routes on the map start here), sort_order` — drives checkout shipping fees (the landing-page map was removed in v1.3).

### 4.14 Content & misc
- `blog_posts`: `id, slug, title, excerpt, body_md, cover_image, tags (JSON), status ('DRAFT'|'PUBLISHED'), published_at, author_id, seo_title, seo_description`
- `testimonials`: `id, author_name, author_role (e.g. "Repair shop, Lahore"), city, rating, quote, is_published, sort_order`
- `services`: `id, slug, title, summary, body_md, icon, sort_order` (e.g. bulk supply, screen fitting, warranty)
- `contact_messages`: `id, name, phone, email, subject, message, status ('NEW'|'REPLIED'|'SPAM'), created_at` (rate-limited + honeypot)
- `settings`: key/value (`usd_pkr_rate`, `usd_rate_updated_at`, `store_phone`, `whatsapp`, `cod_max_order_paisa`, `unpaid_order_ttl_minutes` …)
- `admin_audit_log`: `id, actor_id, action, entity, entity_id, before (JSON), after (JSON), ip, user_agent, created_at` — every admin mutation other than stock (which has its own ledger).

### 4.15 Entity relationship overview

```
vendors 1─* purchase_orders 1─* purchase_order_items *─1 product_variants *─1 products
                                                              │
customers 1─* orders 1─* order_items *────────────────────────┘
              │  1─* payments
              │  1─* shipments
              └ 1─* returns 1─* return_items ─1 order_items
product_variants 1─* stock_ledger (append-only) ── reference_id → orders | purchase_orders | returns | adjustments
delivery_zones 1─* orders, addresses
user 1─* stock_ledger.operator_id, admin_audit_log, orders.created_by
```

### 4.16 Hero, catalogue taxonomy and discount engine (v1.2, additive)
- `brands`: `id, name (unique — matches products.brand), slug, logo_url, sort_order, is_active`. A trigger rejects products whose `brand` isn't in `brands` (no rebuild of the blueprint table).
- `categories`: `id, name, slug (unique), description, sort_order, is_active` (e.g. "OLED & AMOLED screens", "LCD screens", "Display assemblies with frame").
- `products` + `category_id → categories (set null)`, `feature_tags` (JSON string[]), `is_featured` (home-page cards), `is_featured_hero` (has an active hero slide), `sale_price_pkr` (real, nullable — blueprint rupee convention), `sale_starts_at`, `sale_ends_at`.
- `product_images`: `id, product_id → products (cascade), variant_id → product_variants (set null; colour-specific shots), url, alt, angle ('FRONT'|'BACK'|'SIDE'|'DETAIL'), sort_order, created_at`. Files stored in `data/uploads/` as WebP (re-encoded with sharp, ≤ 5 MB in, random names) and served by `/uploads/*`.
- `hero_slides`: `id, heading, subheading, body_md, cta_label, cta_href, product_id → products (set null), visual_type ('PHONE_3D'|'IMAGE'), visual_url, sort_order, is_active, created_at, updated_at`; **v1.3:** `theme` ('MIDNIGHT'|'TERRACOTTA'|'AMBER'|'CREAM'|'DUSK') and `phone_layout` ('RIGHT'|'LOW_LEFT'|'HIGH_RIGHT'|'CENTER'|'FAR_RIGHT'). Storefront shows active slides by `sort_order` (max 5).
- `promotions`: `id, name, banner_text, discount_type ('PERCENT'|'FIXED'), value (basis points for PERCENT — 1500 = 15 %; paisa for FIXED), scope ('ALL'|'BRAND'|'CATEGORY'|'PRODUCT'), scope_value, starts_at, ends_at, is_active, show_banner, created_at`. Active = `is_active AND now ∈ [starts_at, ends_at)`.
- `coupons`: `id, code (unique, upper-case A–Z 0–9 -), description, discount_type ('PERCENT'|'FIXED'), value (bp or paisa), min_order_paisa, max_discount_paisa (cap for %), usage ('SINGLE_USE'|'MULTI_USE'), max_redemptions (null = unlimited for MULTI_USE; forced 1 for SINGLE_USE), redemption_count, starts_at, ends_at, is_active, created_by → user, created_at`.
- `coupon_redemptions`: `id, coupon_id → coupons, order_id → orders, customer_phone, discount_paisa, redeemed_at`; unique `(coupon_id, order_id)`.
- **Redemption is atomic:** inside the checkout transaction, `UPDATE coupons SET redemption_count = redemption_count + 1 WHERE id = ? AND is_active AND (max_redemptions IS NULL OR redemption_count < max_redemptions) AND now within window RETURNING …` — no row ⇒ coupon rejected and the whole order rolls back (same pattern as stock, §6.1). A single-use coupon can never be used twice, even by two simultaneous checkouts.

---

## 5. Migrations

- Source of truth: `src/db/schema/*.ts`. Generate SQL with `drizzle-kit generate`, review the SQL file, commit it, apply with `drizzle-kit migrate` (never `push` in production).
- Triggers, CHECK constraints and partial indexes not expressible in Drizzle are added as **custom SQL migrations** (`drizzle-kit generate --custom`).
- Before every production migration: automatic `.backup` of `caidea.db` (§11.5).
- Seed script `npm run db:seed`: system user, owner account (forced 2FA enrolment on first login), delivery zones, sample brands/products with `OPENING_BALANCE` ledger rows.

---

## 6. Stock velocity & ledger mechanics (core of the system)

### 6.1 The single writer: `applyStockMovement(tx, movement)`
Input: `{ variantId, delta (±int, ≠0), type, referenceType, referenceId, operatorId, unitCostPaisa?, notes? }`
Steps, **inside the caller's transaction**:
1. `UPDATE product_variants SET current_stock = current_stock + :delta, updated_at = now WHERE id = :variantId AND current_stock + :delta >= 0 RETURNING current_stock`.
2. If no row returned → throw `InsufficientStockError(variantId)` → whole transaction rolls back.
3. `newStock = returned value`, `previousStock = newStock - delta`.
4. `INSERT INTO stock_ledger (...)` with previous/new/delta/type/reference/operator.
The conditional `UPDATE … WHERE current_stock + delta >= 0` makes check-and-decrement **one atomic statement** — there is no read-then-write gap.

### 6.1a As built (v1.4, `src/server/inventory/stock.ts`)
- `applyStockMovement(tx, movement)` follows §6.1 exactly and returns `{ ledgerId, previousStock, newStock }`. Errors: `InsufficientStockError` (variant, requested, available), `VariantNotFoundError`, `InvalidStockMovementError` (programming mistakes).
- **Guards added in the engine** (additive, no schema change): `delta` must be a whole number ≠ 0; each type moves stock one way only — `INBOUND_PO`, `REPAIR_RETURN`, `ORDER_CANCEL_RESTOCK`, `OPENING_BALANCE` add; `STORE_SALE`, `COUNTER_POS`, `RETURN_TO_VENDOR`, `DAMAGED_WRITE_OFF` remove; `MANUAL_ADJUST` either way but **notes are required** (§6.5); `unit_cost_paisa` must be a whole number ≥ 0; it refuses to run outside a transaction.
- `reference_type` defaults from the movement type (sales/cancels → `ORDER`, PO → `PO`, returns/RTV → `RETURN`, adjustments/write-offs → `ADJUSTMENT`, opening balance → `COUNT`).
- `withStockTransaction(db, fn)` = `BEGIN IMMEDIATE` wrapper; rejects async callbacks. Every caller (checkout, POS, PO receiving, returns, cron) uses it.
- `findLedgerDrift(db)` = the §6.5 invariant check; used by `npm run db:verify` and, later, the `reconcile-stock` cron.
- The MANAGER-role check for manual adjustments (§6.5) stays in the calling Server Action (M6), because the engine doesn't know who is signed in — it only records `operator_id`.
- Cache refresh after a stock change (§6.4 `revalidateTag`) is done by the caller **after** commit, never inside the transaction.
- The seed now writes opening stock through the engine; a unit test fails if any other file writes `current_stock` (Constitution §0.4.1).

### 6.2 Transactions & concurrency on SQLite
- `better-sqlite3` transactions are synchronous: `db.transaction(fn).immediate()` issues `BEGIN IMMEDIATE`, taking the write lock up front so two checkouts can never interleave. SQLite allows one writer at a time — that is the race-condition guarantee.
- Connection pragmas: `journal_mode = WAL` (readers never block the writer), `busy_timeout = 5000`, `synchronous = NORMAL`, `foreign_keys = ON`.
- **No network calls inside a transaction** (payment/courier APIs are called before or after, never while holding the lock). Write transactions are expected to finish in < 5 ms.
- Run exactly **one** Next.js server process writing to the DB (no PM2 cluster mode against the same file).

### 6.3 Flow: online checkout (`/checkout`, Server Action `placeOrder`)
1. Validate cart (Zod), re-price every line **server-side** from DB (client prices are never trusted), resolve price tier, shipping & COD fee from `delivery_zones`.
2. Check `idempotency_key` (generated when checkout page loads) — duplicate submit returns the existing order.
3. `BEGIN IMMEDIATE` → insert `orders` + `order_items` → for each line `applyStockMovement(delta = -qty, type 'STORE_SALE', ref order.id, operator 'system')` → insert `payments` (INITIATED) → `COMMIT`.
4. After commit: COD → status `COD_PENDING`, order `CONFIRMED`. Online payment → redirect to provider.
5. **Reservation expiry:** unpaid prepaid orders older than `unpaid_order_ttl_minutes` (default 30) are cancelled by cron: in one transaction set `CANCELLED` and `applyStockMovement(+qty, 'ORDER_CANCEL_RESTOCK')`.
6. Stock is therefore **decremented at order placement** (prevents overselling of a last unit while the customer is on the JazzCash page) and returned on cancel/expiry.

### 6.4 Flow: counter sale (`/admin/counter-sale`)
1. Cashier scans/searches SKU, builds a ticket (retail or approved-technician wholesale price), chooses `CASH` / `JAZZCASH` / `EASYPAISA` / `POS_CARD` / `BANK_TRANSFER`.
2. One transaction: `orders` (channel `COUNTER`, `PAID`, `DELIVERED`, `created_by` = cashier) + `order_items` + `applyStockMovement(-qty, 'COUNTER_POS', operator = cashier.id)` + `payments`.
3. After commit: print 80mm thermal receipt (browser print CSS) with warranty terms.
4. Counter and online share the same stock pool, so a POS sale instantly removes the unit from the website (cache revalidated via `revalidateTag('stock:'+productId)`).

### 6.5 Ledger integrity guarantees
- SQL triggers: `BEFORE UPDATE ON stock_ledger → RAISE(ABORT)`, `BEFORE DELETE ON stock_ledger → RAISE(ABORT)`, `BEFORE DELETE ON product_variants WHEN EXISTS (ledger rows) → RAISE(ABORT)`, and `BEFORE INSERT ON stock_ledger WHEN new_stock <> variant.current_stock → RAISE(ABORT)` (forces the update-then-append order of §6.1).
- CHECK constraints on `stock_ledger`: `previous_stock + quantity_changed = new_stock`, `quantity_changed <> 0`, `new_stock >= 0`, known transaction types only.
- Invariant: for each variant `SUM(quantity_changed) = current_stock` and each row's `previous_stock + quantity_changed = new_stock`. Nightly cron `reconcile-stock` checks both and alerts the owner on mismatch.
- Corrections are made by **new** `MANUAL_ADJUST` rows (mandatory notes + MANAGER role), never by editing old rows.
- Physical stock count: manager enters counted qty; system writes the difference as one `MANUAL_ADJUST` per variant with `reference_type = 'COUNT'`.

### 6.6 Velocity metrics derived from the ledger
- **Units sold / day** per variant = −Σ(qty) of `STORE_SALE` + `COUNTER_POS` over 7/30/90 days (net of `REPAIR_RETURN`).
- **Days of cover** = current_stock ÷ 30-day daily velocity → reorder suggestion when `< vendor.lead_time_days + 7`.
- **Low stock** = `current_stock <= products.low_stock_threshold` (dashboard + optional WhatsApp/email alert).
- **Inventory turnover** = COGS (Σ qty × unit_cost_paisa on sale rows) ÷ average inventory value.
- **Dead stock** = variants with zero sales movements in 90 days.

---

## 7. Admin modules — functional spec

| Module | Must do | Roles |
|---|---|---|
| Dashboard | Today / 7d / 30d sales (online vs counter), gross margin, orders needing action (unverified payments, to-pack, RTO), low-stock list, recent ledger activity, COD awaiting remittance | OWNER, MANAGER (CASHIER: own shift only) |
| Products | CRUD product + variants, bulk CSV import/export, image upload (stored in `/public/uploads` → later object storage), publish toggle, compatibility list, price history | OWNER, MANAGER |
| Vendors | Profiles, brands supplied, lead times, PO history, vendor claim (RTV) balance | OWNER, MANAGER |
| Purchase Orders | Draft → order → receive (partial), landed cost, prints PO PDF, receiving writes `INBOUND_PO` | OWNER, MANAGER |
| Orders | Filter by status/channel/city/payment, verify manual wallet payments, book courier, print label & load sheet, cancel/refund | OWNER, MANAGER |
| Counter Sale | Fast SKU search + barcode scanner input, keyboard-first, receipt print, end-of-day cash summary per cashier | OWNER, MANAGER, CASHIER |
| Stock Ledger | Filter by variant/type/date/operator/reference, export CSV, read-only | OWNER, MANAGER |
| Returns | Create RMA from order, warranty check, inspection, disposition, refund | OWNER, MANAGER |
| Reports | Margin by brand/grade, brand sales velocity, turnover, dead stock, COD remittance reconciliation, cashier sales, PO cost analysis | OWNER (MANAGER read) |
| Blog / Testimonials | Markdown editor with preview, draft/publish, SEO fields | OWNER, CONTENT_EDITOR |
| Settings / Users | Roles, force 2FA reset, USD rate, delivery zones, fees | OWNER |

---

## 8. Payments architecture (adapter pattern)

**Decisions (2026-10-02):** launch with `MANUAL` (wallet TID), `COD`, `BANK_TRANSFER`, `CASH`/`POS_CARD` at counter. Next adapter to build: `AGGREGATOR` (vendor to be chosen among Safepay / PayFast / Simpaisa once onboarding terms are compared). `STRIPE` exists as a disabled stub. Each provider is switched on/off in `settings.enabled_payment_methods`.

```ts
interface PaymentProvider {
  id: 'STRIPE' | 'JAZZCASH' | 'EASYPAISA' | 'NAYAPAY' | 'AGGREGATOR' | 'MANUAL';
  createPayment(order): Promise<{ redirectUrl?: string; formPost?: {...}; instructions?: string }>;
  verifyCallback(request): Promise<{ eventId; orderId; status; providerRef; amountPaisa }>; // signature/HMAC check
  queryStatus(providerRef): Promise<Status>;   // used by reconciliation cron
  refund?(providerRef, amountPaisa): Promise<void>;
}
```
Rules: amount and currency in the callback must equal the stored payment; webhook event IDs are de-duplicated (§4.10); order is marked `PAID` only from a verified server-to-server callback or a status query — **never from the browser redirect alone**.

**Manual wallet verification (fallback, works on day one):** customer sends to the shop's JazzCash/Easypaisa/NayaPay number, enters the **Transaction ID (TID)** and sender number at checkout → order `PENDING_VERIFICATION` → staff confirm against the merchant wallet statement in `/admin/orders` → `PAID` (audit-logged, TID unique-constrained).

## 9. Logistics architecture (adapter pattern)

**Decisions (2026-10-02):** couriers are **Leopards** and **PostEx**. `delivery_zones.default_courier` picks one per city (staff can override per order). PostEx is COD-focused, so the COD remittance report (below) must accept both couriers' settlement files. Until API credentials arrive, staff book on each courier's portal and paste the CN (`courier = LEOPARDS|POSTEX`, `label_url` empty).

```ts
interface CourierProvider {
  id: 'LEOPARDS' | 'TCS' | 'TRAX' | 'POSTEX';
  cities(): Promise<CourierCity[]>;                 // map our delivery_zones to courier city codes
  book(shipmentInput): Promise<{ cn: string; labelUrl?: string }>;
  track(cn): Promise<TrackingEvent[]>;
  cancel(cn): Promise<void>;
  loadSheet?(cns: string[]): Promise<{ url: string }>;
}
```
- Booking happens from `/admin/orders` (single or bulk) after the order is `PACKED`; COD amount = `total_paisa` for COD orders, 0 for prepaid.
- Tracking sync: cron every 2 h for non-terminal shipments; maps courier statuses to our `fulfillment_status`.
- **RTO (return-to-origin)**: on courier RTO confirmation + physical receipt, staff run "Receive RTO", which restocks via `ORDER_CANCEL_RESTOCK` after inspection.
- COD remittance: reports reconcile courier payment reports (CSV upload) against `COD_COLLECTED` orders → `COD_REMITTED`.

---

## 10. Authentication & authorisation

- **Better Auth** with email + password (Argon2/scrypt hashing by library), `twoFactor` plugin.
- **Staff (all `/admin` roles): TOTP 2FA mandatory.** A staff user without 2FA enabled is redirected to `/admin/setup-2fa` and can do nothing else. Backup codes shown once.
- Sessions: httpOnly, `Secure`, `SameSite=Lax` cookies; admin session max age 12 h, idle timeout 2 h; session revoked on role change or password reset.
- Login rate-limit: 5 attempts / 15 min per IP + per account; generic error messages.
- **Two layers of protection:**
  1. `proxy.ts` (Next 16) does a fast cookie-presence check on `/admin/:path*` and redirects to `/login` (UX only).
  2. **Data Access Layer** `requireRole(['MANAGER', …])` is called at the top of every admin Server Action, route handler and admin page server component. This is the real gate (proxy-only auth is bypassable — see CVE-2025-29927).
- Customer accounts (if enabled): email/phone + password, 2FA optional.

## 11. Security (zero-trust)

1. **SQL injection:** only Drizzle query builder / `sql` tagged templates (parameterised). Raw string concatenation into SQL is banned by an ESLint rule.
2. **XSS:** React auto-escaping; blog Markdown rendered server-side with `remark` + `rehype-sanitize`; no `dangerouslySetInnerHTML` except sanitised blog HTML.
3. **CSP:** nonce-based CSP generated in `proxy.ts`: `default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic' https://js.stripe.com; frame-src https://js.stripe.com https://*.jazzcash.com.pk …; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; form-action 'self' <wallet hosts>; frame-ancestors 'none'; upgrade-insecure-requests`. Plus `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
4. **CSRF:** Server Actions are POST-only with Next's origin check; `serverActions.allowedOrigins` set to the production domain.
5. **Webhooks:** signature/HMAC verified on raw body, timestamp tolerance, idempotent (§4.10).
6. **Backups (critical for on-premise hosting):** Litestream continuous replication (or hourly `sqlite3 .backup`) to **off-site** encrypted storage (e.g. Cloudflare R2 / Backblaze B2); daily snapshots retained 30 days; full-disk encryption on the shop server; restore drill monthly. A theft, fire or disk failure in the shop must never lose more than 1 hour of orders.
7a. **Shop server hardening:** dedicated machine (not a cashier PC), OS auto-updates, no inbound ports open (Cloudflare Tunnel only), admin SSH via key only, BIOS/OS password, physically secured.
7. **Uploads:** image MIME sniffing, size ≤ 5 MB, re-encoded with `sharp`, random filenames.
8. **Secrets:** `.env.local` only; separate sandbox/live keys; `.env.example` lists names.
9. **Dependencies:** `npm audit` + Dependabot/Renovate; Next.js patched promptly (Next now publishes scheduled security releases).

## 12. Performance plan (target: Lighthouse mobile ≥ 95, slow-4G)

- Server Components by default; client components only for cart, filters, POS, checkout steps.
- Catalog & product pages statically generated and cached; revalidated on demand with `revalidateTag` when price/stock/publish changes (instead of time-based ISR only). Stock badge streamed via Suspense.
- `next/image` with AVIF/WebP, explicit `sizes`, `priority` only on LCP hero, blur placeholders; product photos ≤ 1200px source.
- `next/font` self-hosted fonts, subset, `display: swap`; only weights actually used (Epilogue 600/700, Jakarta 400/500/600).
- JS budget: < 100 KB gzipped on landing; no UI kit heavyweights; icons as inline SVG (`lucide-react` tree-shaken).
- Repair video: ≤ 400 KB WebM (VP9) with an MP4 fallback and a poster image; `preload="none"`, loaded only when scrolled near (v1.3).
- Edge caching via Cloudflare in front of the VPS (static assets + cached HTML); `Cache-Control` set appropriately.
- Budgets enforced in CI with Lighthouse CI.

## 13. Folder structure

```
caidea/
├─ data/caidea.db                  (git-ignored)
├─ drizzle/                        generated SQL migrations (committed)
├─ public/ (brand assets, media/screen-change.webm|mp4|jpg)
├─ src/
│  ├─ app/ …                       (§2)
│  ├─ components/ui/               Button, Badge, Card, Input, Table, Dialog (token-based)
│  ├─ components/store/ …  components/admin/ …
│  ├─ db/client.ts                 better-sqlite3 + pragmas + drizzle()
│  ├─ db/schema/*.ts               one file per domain
│  ├─ db/seed.ts
│  ├─ server/auth.ts               Better Auth instance
│  ├─ server/dal.ts                requireUser / requireRole
│  ├─ server/inventory/stock.ts    applyStockMovement (the only stock writer)
│  ├─ server/orders/ …  server/purchasing/ …  server/returns/ …  server/reports/ …
│  ├─ server/payments/{stripe,jazzcash,easypaisa,nayapay,manual}.ts
│  ├─ server/couriers/{leopards,tcs,trax}.ts
│  ├─ lib/money.ts  lib/validation/*.ts  lib/format.ts
│  └─ proxy.ts                     auth redirect + CSP nonce
├─ tests/unit  tests/e2e
├─ .env.example  drizzle.config.ts  next.config.ts
├─ SPECIFICATION.md  CLARIFICATIONS.md  BUILD_GUIDE.md
```

## 14. Change log
| Date | Version | Change |
|---|---|---|
| 2026-10-02 | 0.9 | Initial specification (Phases 0–2). Open items: CLARIFICATIONS.md Q1–Q14. |
| 2026-10-02 | 1.0 | Blocking answers recorded: Q1 aggregator (Stripe stubbed), Q2 manual TID first, Q4 Leopards + PostEx, Q6 on-premise shop server via Cloudflare Tunnel. Remaining questions use ★ defaults. **Build phase unlocked for M1–M13.** |
| 2026-10-02 | 1.1 | Build of M1–M3. Additions made while building (all additive): `AGGREGATOR` added to `orders.payment_method` (follows Q1); `delivery_zones.is_hub` (Faisalabad seeded as hub — **assumption, confirm**); fourth ledger trigger `stock_ledger_matches_variant` + ledger CHECK constraints; shipments unique on `(courier, cn_number)` instead of `cn_number` alone (two couriers may reuse numbers); payments unique on `(provider, manual_reference)`; `AED` vendor currency; setting `manual_tid_ttl_minutes` (Q3b default 24 h). Auth tables are hand-written to Better Auth's shape now and re-checked against its CLI in M4. |
| 2026-10-02 | 1.2 | Enterprise design brief (§15): PKR-only storefront, two-tier header, CSS-3D hero carousel, product cards + table toggle, brands/categories/product images/hero slides/promotions/coupons tables (§4.16), glass-on-dark rule, discount colours, M4 auth pulled forward. |
| 2026-10-02 | 1.2.1 | Built v1.2. While building: Better Auth 1.7.7 needed 3 extra `two_factor` columns (`verified`, `failed_verification_count`, `locked_until`) — added in migration 0002; staff accounts are created with `npm run staff:create` (public sign-up disabled); admin roles per module: hero = OWNER/MANAGER/CONTENT_EDITOR, catalogue & discounts = OWNER/MANAGER. Production login requires HTTPS (secure cookies). |
| 2026-10-02 | 1.3 | Home-page refresh (§16): cities block removed, repair guide + generated video, numbers band, per-slide hero themes and model-accurate phones, hero and banner 20 % shorter, AAA+ grades renamed to A Grade. |
| 2026-10-02 | 1.4 | Milestone 5 built: stock engine (§6.1a) with direction/notes guards, `withStockTransaction`, `findLedgerDrift`; seed and `db:verify` use it; 17 new tests incl. a real multi-thread race (10 of 50 simultaneous sales succeed). `esbuild` added as a dev dependency for that test. No schema change. |
| 2026-10-03 | 1.5 | Milestone 6 built (§17): vendors, purchase orders (landed cost, WAC, partial receipts, close short, print/PDF), stock ledger page + CSV, stock counts and corrections on the product page, product CSV import/export, change history. New permission modules `vendors`, `purchasing`, `ledger`, `stockAdjust` (OWNER/MANAGER). No schema change. Defaults Q24–Q29 in CLARIFICATIONS.md. |

## 15. v1.2 — Enterprise design brief: decisions and conflict resolutions

| Brief requirement | Conflict with v1.1 | Decision (user-selected, 2026-10-02) |
|---|---|---|
| Remove all $/USD | §0.3.1 required a PKR/USD selector; §3 USD display | **PKR-only storefront**; supplier POs keep foreign currency (§3) |
| Glassmorphism, #0B0F17/#1E293B bar, Emerald/Crimson sale price | §0.2 "only the six Caidea tokens" | **Blend into brand**: glass/glow on dark areas only, top bar in Midnight #0B1C33, sale price in Terracotta (§0.2) |
| 3D hero (glTF/WebP), 60 FPS | §12 JS budget < 100 KB, Lighthouse ≥ 95 | **CSS-3D phone model**, no 3D library or model files (§0.3.1a) |
| Product cards with images | §0.3.5 "spec tables instead of image grids" | **Cards + table toggle** on `/store` (§0.3.5) |
| Hero & catalogue admin | §10 admin requires login + mandatory 2FA (M4 not built) | **Build M4 first**, admin screens behind it (§10) |
| Framer Motion | §12 JS budget | CSS keyframes/transitions (allowed by the brief as an alternative) |
| Main menu: Catalog, Categories, Deals, Enterprise Solutions | Route map §2 | Additive: `/categories`, `/deals`; "Wholesale & Enterprise" → `/services` |

## 16. v1.3 — Home-page refresh (2026-10-02)

| # | Request | Decision / implementation |
|---|---|---|
| 1 | Hero carousel 20 % shorter | Section height cut by ≥ 20 % on desktop and phones (measured before/after); the 3D model is sized in `em`, so it shrinks with it. |
| 2 | Different background and text colour per slide; the exact phone named in the text; phone size/position varies | Per-slide **theme** picked in admin, built only from the six Caidea tokens (Midnight, Terracotta, Amber, Cream, Dusk = midnight→terracotta). The glass-on-dark rule now means "glass only on dark themes"; light themes use flat token fills. The 3D model takes its **shape from the linked product** — device profiles for Galaxy S23 Ultra, iPhone 14 Pro Max, Redmi Note 13 Pro, Galaxy A54 and a generic phone (corner radius, camera cut-out, rear camera layout, body colour). Per-slide **phone layout** preset sets scale, offset and tilt. |
| 3 | Discount bar 20 % shorter | 40 → 32 px on desktop; smaller type on phones. |
| 4 | Replace the cities section | **Removed completely (Q20).** New "Changing a screen, explained" section: 6-step repair process, buyer's checklist and a **generated 6-second video** (Q21) of an iPhone screen change, rendered from an animation to WebM/MP4. The owner can replace it with real footage in Admin → Home page. |
| 5 | AAA+ grades → A Grade | "Compatible Grade AAA+" → **"Compatible A Grade"**, "OLED Grade AAA+" → **"OLED A Grade"** (Q23). Migration 0004 renames existing products and their web addresses; SKUs (internal codes) are unchanged. The blueprint's code comment in §4.1 keeps its original example text because the blueprint is quoted verbatim. |
| 6 | Numbers section (branches, screens sold, …) | "Caidea in numbers" band; figures are **edited in Admin → Home page** and are display-only (Q22). Seeded values for branches (3 Pakistan, 2 China) come from the owner; the rest are placeholders to confirm. |

## 17. v1.5 — Milestone 6 as built (2026-10-03)

**Roles.** Vendors, purchase orders and the stock ledger: OWNER and MANAGER (§7). Stock counts and corrections: OWNER and MANAGER (`stockAdjust`). Product CSV: same as Products. Every page, action and download checks this in the data layer.

**Purchase orders** (`src/server/purchasing/`):
| Rule | Decision |
|---|---|
| Codes | `PO-0001`, `PO-0002` … (next after the highest); vendor codes `V-001` … if left blank |
| Currency | Copied from the vendor; currency and FX rate change only while DRAFT. PKR POs always use rate 1 |
| What can change when | Lines: DRAFT only. Shipping / customs / other: until the first receipt. Expected date and notes: until finished |
| Landed cost | unit cost × FX + share of (shipping + customs + other); shares by line value using **ordered** quantities, largest-remainder rounding so they add up exactly; by quantity if every line is free. Stored per line on first receipt |
| Average cost (Q9) | On each receipt line: `new = (old × units on hand across all colours + landed × received) ÷ (on hand + received)`; if nothing is on hand, the landed cost. Written to `products.cost_price` |
| Receiving | One transaction: stock via `applyStockMovement` (`INBOUND_PO`, landed unit cost, `reference_type = PO`), line `qty_received`, cost price, status, audit. Can't exceed what's outstanding |
| Double submit | The form carries each line's `qty_received` as shown; if it changed meanwhile, the whole receipt is refused — goods can't be counted twice |
| Status additions | **Close short**: PARTIALLY_RECEIVED → RECEIVED with a required reason (supplier won't send the rest). Cancel needs a reason and nothing received |
| Print / PDF | Print-friendly page; the browser's "Save as PDF" makes the file. Supplier-facing only (no landed cost or margins) |

**Stock tools on the product page** (§6.5): "I counted the shelf" (writes the difference with `reference_type = COUNT`; a matching count writes no ledger row; a colour's first count is `OPENING_BALANCE`), "Units were damaged" (`DAMAGED_WRITE_OFF`, reason required), "Other correction" (±, `MANUAL_ADJUST`, reason required). Each carries the stock the form showed and is refused if stock changed meanwhile.

**Stock ledger page**: filters for screen/SKU, movement type, person, reference (PO or order code), Karachi date range and one colour; 50 per page, newest first; CSV of the filtered rows.

**Product CSV**: one row per colour, matched by `sku` / `variant_sku`; all-or-nothing with row-numbered errors; up to 2,000 rows / 1 MB; never changes existing stock; `opening_stock` only for colours with no history; `cost_price` only for new products; sale prices, photos and home/hero flags stay on the product page. Text cells starting with `= + - @` are prefixed with `'` on export (spreadsheet formula injection).

**Change history**: the product page lists product create/update entries from `admin_audit_log` with price and grade changes ("Retail price: Rs 68,000 → Rs 68,500").

**Also**: `formatKarachi` now reads SQLite `CURRENT_TIMESTAMP` values as UTC; admin layout hides navigation when printing.

# Caidea — commerce and POS engine

Next.js 16 storefront and admin for Caidea's phone-screen business. The plan lives in three files:

- `SPECIFICATION.md` — what we're building and the rules it must follow (v1.3)
- `BUILD_GUIDE.md` — the 20 milestones, in order
- `CLARIFICATIONS.md` — business decisions (answered and default)

**Status:** Milestones 1–8 done (5 = the stock engine; 6 = vendors, purchase orders, stock ledger, stock counts, product CSV; 7 = cart, colour picker, catalogue filters; 8 = checkout, order tracking, shop settings), plus the v1.2 enterprise design brief (3D hero carousel, product cards, PKR-only prices, discount engine, hero/catalogue/discount admin) and the v1.3 home-page changes (themed hero slides with model-accurate phones, numbers band, screen-change guide with a repair animation, “A Grade” names). Next: Milestone 9 (counter sale / POS).

## First-time setup

You need **Node.js 22 LTS** (`node -v` should print v22.x).

```bash
npm install          # install packages (first time only)
npm run setup        # create .env.local with a secret, create the database, load sample data, run safety checks
npm run staff:create -- --email you@example.com --name "Your Name" --role OWNER
npm run dev          # start the site
```

`staff:create` asks for a password (12+ characters). Then open:

- http://localhost:3000 — storefront
- http://localhost:3000/login — staff sign-in. The first time, you'll be asked to scan a QR code with Google Authenticator, Microsoft Authenticator or Authy, and you'll get 10 backup codes. **Write the backup codes down.**
- http://localhost:3000/dev/ui — UI kit (development only)

Pages not built yet (About, Contact, Terms, FAQs) show "We couldn't find that page" until their milestones.

## What the admin can do now

| Screen | Who | What |
|---|---|---|
| Dashboard | All staff | Counts and the low-stock list |
| Hero carousel | Owner, Manager, Content editor | Add, edit, reorder, show/hide and delete up to 5 live slides (text, Markdown description, button, 3D product screen or image upload). Each slide has a **Look**: colour theme (Midnight, Terracotta, Amber, Cream, Dusk) and phone size/position. The 3D phone takes the shape of the linked product's model |
| Home page | Owner, Manager, Content editor | The “Caidea in numbers” figures (up to 6) and the screen-change video (upload MP4/WebM up to 20 MB and a still image, edit the caption, or go back to the built-in animation) |
| Products | Owner, Manager | Details, PKR prices, sale price with start/end time, category, feature tags, Published / Featured / Featured on Hero switches, photo gallery (upload, angle, colour, reorder, delete), add colours, archive |
| Categories, Brands | Owner, Manager | Add, rename, hide, order. Renaming a brand renames it on its products; a brand in use can't be deleted |
| Promotions | Owner, Manager | Automatic % or Rs discounts for all screens, a brand, a category or one product, with start/end times and an optional site-wide banner |
| Coupons | Owner, Manager | Codes (typed or generated) for % or Rs off, minimum order, cap, single-use or multi-use with a limit, start/end times |
| Online orders (v1.11) | Owner, Manager | Website orders with filters (needs action, waiting for payment, ready to dispatch…). Per order: Record payment proof (screenshot received — stops the 48-hour cancellation), Confirm payment, Dispatch with courier + tracking number, Cancel (stock goes back), resend an email, email log and history. The customer is emailed at each step |
| Shop settings | Owner | Contact numbers and sales email, cash on delivery On / Paused (with a checkout message), bank and wallet methods on/off, payment waiting time; payment accounts and Gmail status (read-only, from the environment file) |

**Payments (v1.8):** the cash-on-delivery limit (`COD_MAX_ORDER_PKR`, default Rs 20,000) and the JazzCash / Easypaisa / NayaPay / bank account details live in the environment file (`.env.local` on a development PC, `.env.production` on the shop server). Edit the file and restart the app to change them — see `.env.example`. **v1.9:** the IBAN's check digits are verified, and every change to these details is noticed at start-up: it's written to the audit log, shown as a red alert in Admin until the owner presses “I made this change”, and emailed to `ALERT_EMAIL_TO`.

**Email (v1.10):** everything the shop emails goes through one Gmail account (`GMAIL_USER` + a 16-letter `GMAIL_APP_PASSWORD`, or OAuth 2.0 with `GMAIL_AUTH=oauth2`). Free Gmail sends to about 500 recipients a day, so the app stops ordinary mail at `GMAIL_DAILY_LIMIT` (450). Test it from Admin → Shop settings → Send a test email.

Stock can't be typed in anywhere — it only changes through the stock engine (`src/server/inventory/stock.ts`), which writes a ledger row for every change. Stock arrives by receiving a purchase order (Admin → Purchase orders) or a stock count on the product page.
Coupons are checked and redeemed by the engine in `src/server/pricing/coupons.ts`.

**Checkout (v1.12):** the customer chooses **Cash on delivery** or **Place order & pay in advance**. Paying in advance gives free delivery (switch in Shop settings) and the customer is asked to send the payment slip and transaction ID with the order number within 24 hours by WhatsApp or email.

**Orders (v1.11):** email is required at checkout. Above the COD limit, or while COD is paused, customers order by bank transfer or wallet, pay with the order number in the remarks and send the screenshot by WhatsApp, a call or the sales email. After ordering they see the full order with a **Download PDF** button and get an email with the details and a private link (30 days). Links in emails use `BETTER_AUTH_URL` — set it to the shop's real https address on the live server.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the site with live reload |
| `npm run build` then `npm start` | Production build and server (needs HTTPS — see below) |
| `npm run lint` / `npm run typecheck` / `npm test` | Code checks and unit tests — run before every commit |
| `npm run setup:env` | Creates `.env.local` (or adds missing payment keys to it) with SAMPLE account details — replace them before going live |
| `curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/expire-unpaid` | Cancel unpaid wallet/bank orders past their waiting time (scheduled on the shop server in M18) |
| `npm run db:studio` | Browse the database in your browser |
| `npm run db:generate` | After editing `src/db/schema/*`, create a migration in `drizzle/` (read it before applying) |
| `npm run db:migrate` | Apply new migrations (backs up the database first into `data/backups/`) |
| `npm run db:seed` | Load sample data (safe to re-run; skips what's already there) |
| `npm run db:verify` | Prove the 23 database safety rules are active |
| `python3 scripts/video/render.py` | Re-make the built-in repair animation in `public/media/` after editing `scripts/video/screen-change.html` (needs Python Playwright and ffmpeg) |
| `npm run db:reset` | Delete the local database (development only), then run `npm run db:setup` |
| `npm run staff:create -- --email … --name … --role OWNER\|MANAGER\|CASHIER\|CONTENT_EDITOR` | Add a staff login |

## Upgrading a copy you set up before v1.3

```bash
npm install
npm run db:migrate   # adds slide theme/position, renames AAA grades to “A Grade”
npm run db:seed      # adds the home-page figures and video settings, gives the 5 sample slides their looks
npm run db:verify
```

The old “Cities we deliver to” map is gone from the home page; delivery fees per city still apply at checkout.

## Upgrading a copy you set up before v1.2

```bash
npm install
npm run setup:env    # creates .env.local if you don't have one
npm run db:migrate   # adds the new tables; existing brands are copied into the Brands table
npm run db:seed      # adds categories, sample photos, hero slides and sample discounts (keeps your data)
npm run db:verify
```

## Where things are

```
drizzle/                         SQL migrations (committed). 0001 and 0003 hold the safety triggers.
data/caidea.db                   the database (not committed)
data/uploads/                    uploaded images and videos (not committed), served at /uploads/… (video supports seeking)
public/media/                    built-in screen-change animation (WebM, MP4, poster)
scripts/video/                   source and renderer for that animation
src/app/(storefront)/            public pages: home, /store, /store/[slug], /categories, /deals
src/app/(auth)/login/            staff sign-in + 2FA code step
src/app/admin/setup-2fa/         mandatory authenticator enrolment
src/app/admin/(gated)/           admin pages, all behind requireStaff()
src/components/store/            header, hero carousel, 3D phone (+ device profiles, slide themes), repair video, product card, price tag…
src/components/admin/            admin sidebar and form pieces
src/db/schema/                   one file per area: inventory, catalog, discounts, orders, …
src/server/auth-config.ts        Better Auth settings (2FA, rate limits, sessions)
src/server/dal.ts                requireStaff(): the real security gate for every admin page and action
src/server/pricing/              price engine (sale + promotions) and coupon engine, with tests
src/server/inventory/stock.ts    the stock engine — the only code that changes stock
src/server/inventory/            stock counts/corrections (adjust.ts) and the ledger query (ledger.ts)
src/server/purchasing/           purchase orders: landed cost, average cost, receiving
src/server/catalog/              product CSV import/export
src/server/storefront/cart.ts   cart pricing (the browser keeps ids + quantities only)
src/lib/cart-store.ts           the browser side of the cart
src/server/orders/checkout.ts   placing orders, transaction IDs, expiring unpaid orders
src/server/settings/            shop settings used by checkout (payment accounts, COD limit) and payment-details tamper detection
src/server/notify/email.ts      the only email sender: Gmail, with the free-tier daily counter
src/instrumentation.ts          runs the payment-details check once when the server starts
src/server/storefront/catalog.ts storefront product queries (every price goes through the price engine)
src/proxy.ts                     quick redirect to /login when there's no session cookie
tests/unit/                      Vitest tests
```

## Things to know

- **Prices are PKR only** (`Rs 12,500`). There's deliberately no USD formatter. Supplier purchase orders will still record USD/CNY cost when Milestone 6 adds them.
- **Colours:** only the six Caidea tokens exist. Glass and glow effects are used only on dark midnight areas (hero, top bar, sign-in). Sale prices are terracotta with the old price struck through.
- **Motion:** CSS only. The carousel advances every 4 seconds, pauses on hover/focus/hidden tab, and starts paused for people who prefer reduced motion.
- **Login in production needs HTTPS.** Cookies are marked Secure in production, so `npm start` must be reached through Cloudflare Tunnel (https://…) or on `localhost`. On another computer's plain `http://192.168…` address sign-in won't stick.
- **Grade names:** OEM Original, OLED A Grade, Compatible A Grade. Some older SKUs still contain “AAA” — SKUs are internal codes and are never shown to shoppers.
- **Sample data is placeholder:** the “48,000+ screens sold” and “1,200+ repair shops” figures (marked sample in Admin → Home page), prices, photos (marked "Sample image"), the dispatch hub (Faisalabad), the promotion and coupons. Replace them in the admin.
- `npm audit` reports moderate issues inside `drizzle-kit`'s own development tooling; it isn't part of the running site.

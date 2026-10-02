# Phase 3 — Clarify: Pakistani payments & logistics edge cases

## ✅ Answers received (2026-10-02)
| Q | Decision |
|---|---|
| Q1 | Pakistani aggregator for cards (vendor TBD); Stripe stubbed and disabled |
| Q2 | Manual wallet TID verification at launch; automate later |
| Q4 | Leopards + PostEx (manual CN entry until API keys arrive) |
| Q6 | On-premise server in the shop, exposed via Cloudflare Tunnel |
| Others | ★ defaults apply until you say otherwise |

Answer each question (pick an option or write your own). Items marked **[BLOCKING]** stop the Build phase for the parts that depend on them; everything else has a sensible default (★) that will be used if you don't answer.

---

## A. Payments

**Q1 [BLOCKING] — International card payments via Stripe.**
Stripe does not open accounts for Pakistan-registered businesses. How should international (and card) payments work?
- (a) Caidea has / will create a foreign entity (US LLC via Stripe Atlas, UAE, or UK company) → full Stripe integration with webhooks, charged in USD.
- (b) ★ Skip Stripe for launch; take cards through a **Pakistani aggregator** (Safepay, PayFast, Simpaisa, bSecure) which also covers wallets. Keep the Stripe adapter stubbed for later.
- (c) No card payments at all at launch (wallets + COD + bank transfer only).

**Q2 [BLOCKING] — JazzCash / Easypaisa / NayaPay integration mode.**
- (a) **Direct merchant APIs** — separate merchant agreement and credentials with each wallet (more paperwork; lowest per-transaction fees; 3 integrations to build).
- (b) **One aggregator** for all wallets + cards (one integration, one dashboard; slightly higher fees; requires aggregator onboarding).
- (c) ★ **Manual verification first, automate later** — customer pays to the shop's wallet number and enters the Transaction ID (TID); staff verify in admin. Works on day one with no merchant approval; automation is added when credentials arrive.
- Sub-question: do you already hold any merchant accounts? (JazzCash merchant / Easypaisa merchant / NayaPay business / aggregator)

**Q3 — USD pricing.**
- (a) ★ Admin enters the USD→PKR rate manually in Settings; USD is display-only unless Stripe is enabled.
- (b) Auto-fetch a daily rate from an FX API (adds an external dependency).
- (c) Fixed USD price per product, maintained separately.

**Q3b — Manual-payment timeout.** How long should an order wait for wallet payment/TID before it auto-cancels and stock is released? ★ 30 minutes for automated wallets, 24 hours for manual TID orders. Change?

**Q3c — Refunds.** Refund defective-return money via: ★ original method when automated, otherwise to the customer's wallet number manually (recorded with reference) / store credit only / case-by-case?

## B. Logistics & COD

**Q4 [BLOCKING] — Couriers.** Which courier accounts does Caidea have (or will open)?
- (a) Leopards only (b) TCS only (c) Trax only (d) ★ Leopards + TCS (common pairing) (e) PostEx (COD-focused, faster remittance) (f) Self-delivery inside Faisalabad/Lahore + courier elsewhere.
- Sub-question: do you have API keys/sandbox access yet? Until keys arrive the system will support **manual CN entry** (staff book on the courier portal and paste the CN number).

**Q5 — COD rules.**
- COD available in all cities? ★ Yes except cities flagged off in `delivery_zones`.
- COD fee: ★ flat Rs 0 (absorb) / flat Rs ___ / % of order?
- Maximum COD order value? ★ Rs 50,000 (above that, prepaid only — high-value OLED orders are a fraud/refusal risk).
- Require phone OTP (SMS/WhatsApp) confirmation before shipping COD orders? ★ Yes — WhatsApp click-to-confirm manually by staff at launch; automated OTP later (needs an SMS provider — which?).
- Partial advance for COD (e.g. ask for delivery charge upfront)? ★ No.

**Q5b — Shipping fees.** ★ Flat per-city fee from `delivery_zones`, free above Rs ___. Or weight-based courier rates?

## C. Business rules

**Q6 [BLOCKING] — Hosting.** The single-file SQLite constitution requires a server with a persistent disk.
- (a) ★ Low-cost VPS (Hetzner / DigitalOcean / Contabo, ~US$5–12/month) with Cloudflare in front.
- (b) Pakistani host / on-premise PC in the shop (data stays local; uptime depends on power/internet).
- (c) Change constitution to Turso (hosted libSQL — same SQLite dialect) so Vercel can be used.

**Q7 — Customer accounts.** (a) ★ Guest checkout + optional accounts (order history, saved addresses) (b) Guest only (c) Accounts required.

**Q8 — Variants.** Besides colour, do screens vary by **"with frame / without frame"**, **with/without small parts (ear speaker mesh, adhesive)**, or **IC type**? ★ Add a free-text `variant_label` (e.g. "With Frame") alongside colour.

**Q9 — Cost basis method.** ★ Weighted average cost (recalculated on each PO receipt) / FIFO / latest cost?

**Q10 — Wholesale (technician) pricing.** Who sees `wholesale_price_pkr`? ★ Technicians who register with a shop name and are approved by admin; also selectable by cashier at the counter. Minimum quantity for wholesale? ★ None.

**Q11 — Warranty.** Default warranty period per grade? ★ OEM Original 30 days, Compatible 7 days, no warranty on physically damaged/broken glass. Confirm or provide your policy.

**Q12 — Branches & staff.** One physical shop or several branches (each with its own stock)? How many staff logins and roles? ★ One shop, one stock pool; roles OWNER / MANAGER / CASHIER / CONTENT_EDITOR. (Multi-branch requires a `locations` table and per-location stock — a significant spec change.)

**Q13 — Invoicing/tax.** Do invoices need NTN/STRN and sales-tax lines (FBR POS integration)? ★ Not at launch; invoices show business name, address, phone; tax fields added later.

**Q14 — Brand assets.** Do you have a logo, product photos and copy for About/Services? ★ Placeholder brand mark + neutral product renders until supplied.

---

## D. Enterprise design brief (2026-10-02) — answered

| Q | Question | Decision |
|---|---|---|
| Q15 | Remove all $/USD vs Constitution's PKR/USD switch | PKR-only storefront; supplier purchase orders keep USD/CNY/AED |
| Q16 | Glassmorphism + new colours vs six brand tokens | Blend into brand: glass/glow only on dark areas, Midnight top bar, Terracotta sale prices |
| Q17 | 3D hero approach vs mobile speed budget | Lightweight CSS-3D phone model, no 3D library or model files |
| Q18 | Image cards vs spec-table catalogue | Cards + Cards/Table toggle on the catalogue |
| Q19 | Admin screens before login exists | Build Milestone 4 (login + mandatory 2FA) first |

## E. v1.3 home-page refresh (2026-10-02) — answered

| Q | Question | Decision |
|---|---|---|
| Q20 | Cities map vs new repair section | Remove the cities block completely (delivery data kept for checkout) |
| Q21 | How to make the 5–6 s iPhone screen-change video | Generated video file from an animation; real footage can replace it in admin |
| Q22 | 3 branches in Pakistan + 2 in China vs one-shop spec | Display figures only; single stock pool stays |
| Q23 | Grade wording | "Compatible A Grade" and "OLED A Grade"; OEM Original unchanged |

## F. Milestone 6 defaults (2026-10-03) — ★ used until you say otherwise

| Q | Question | ★ Default used |
|---|---|---|
| Q24 | Supplier short-ships and won't send the rest | "Close short" with a reason: received stock stays, the PO becomes Received |
| Q25 | When can a PO be edited? | Lines only as a draft; shipping/customs/other until the first receipt; notes and expected date until finished |
| Q26 | How are shipping/customs shared? | By line value (ordered quantities) |
| Q27 | Can a CSV import change stock? | Never for existing stock; it can set opening stock for colours with none yet |
| Q28 | Does a CSV import change cost price? | Only for new products; existing products keep their purchase-order average |
| Q29 | PO PDF | Browser "Print → Save as PDF" from a print-friendly page (no PDF library) |

## G. Milestone 7 defaults (2026-10-03) — ★ used until you say otherwise

| Q | Question | ★ Default used |
|---|---|---|
| Q30 | Cart limits | Up to 30 different screens, 99 of each |
| Q31 | When a cart item sells out or runs low | Keep it in the cart, explain it ("Sold out", "Only 2 left — Change to 2"); never change quantities silently |
| Q32 | Checkout button before Milestone 8 | Shown but disabled, with the shop phone number for ordering now |
| Q33 | Catalogue page size | 24 screens per page |

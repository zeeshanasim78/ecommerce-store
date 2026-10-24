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

## H. Milestone 8 defaults (2026-10-03) — ★ used until you say otherwise

| Q | Question | ★ Default used |
|---|---|---|
| Q34 | Must the transaction ID be entered at checkout? | No — it can be added on the order page within the waiting time (24 h, Q3b) |
| Q35 | Which payment methods show at checkout? | Those switched on in Shop settings **and** with account details filled in |
| Q36 | Coupon on an order that expires unpaid | The use is given back (single-use codes become usable again) |
| Q37 | Free delivery above an amount (Q5b blank) | None — flat per-city fee |
| Q38 | Status of a new COD order | Confirmed (spec §6.3); staff still confirm by WhatsApp before dispatch (Q5) |
| Q39 | Who can see an order online | Anyone with the order number sees number, total and how to pay; everything else needs the checkout phone number |

## I. Owner change requests (2026-10-03) — answered

| Q | Question | Decision |
|---|---|---|
| Q40 | Where do the COD limit and payment account numbers live? | Environment file only (`COD_MAX_ORDER_PKR`, `JAZZCASH_*`, `EASYPAISA_*`, `NAYAPAY_*`, `BANK_*`); Admin → Shop settings shows them read-only. Edit + restart to change. |
| Q41 | COD limit (replaces Q5's Rs 50,000) | **Rs 20,000** for now |
| Q42 | Order above the COD limit | Offer JazzCash / Easypaisa / NayaPay / bank transfer with account numbers shown; call/WhatsApp if none is set up |

## J. Payment-details security (2026-10-03) — answered

| Q | Question | Decision |
|---|---|---|
| Q43 | Where should payment details and secrets live on the live server? | Environment file kept for payment details; real secrets encrypted with `systemd-creds`; file root-owned at `/etc/caidea/caidea.env` (BUILD_GUIDE M18 step 8). Secrets manager not needed for one shop server. |
| Q44 | Validate the IBAN beyond its format? | Yes — check digits (mod-97); a typo switches bank transfer off |
| Q45 | How is the owner told payment details changed? | Admin alert until the owner confirms + email via the owner's own mail account (Gmail only since v1.10, Q46). WhatsApp alerts need Meta's paid API — later, if wanted. |

## K. Email through Gmail (2026-10-03) — answered

| Q | Question | Decision |
|---|---|---|
| Q46 | Which service sends the shop's email? | One Gmail account (free tier) via smtp.gmail.com; app password by default, OAuth 2.0 optional; all settings in the environment file |
| Q47 | Gmail's ~500 recipients/day limit | App counts per day; ordinary mail stops at 450 (`GMAIL_DAILY_LIMIT`), security alerts may use up to 500 |

## L. Prepaid ordering, Orders admin, order emails (2026-10-03) — answered

| Q | Question | Decision |
|---|---|---|
| Q48 | Email at checkout — optional (v1.7) or required? | **Required for every order** — the order details, payment steps and dispatch news are sent there. Max 3 order emails per address per day (anti-abuse). |
| Q49 | Home-page animations on devices set to "reduce motion"? | **Respect the device setting**: everything plays by default with a pause button; on reduced-motion devices scenes and the hero start still and the shopper can press play (WCAG 2.2.2). |
| Q50 | Staff must confirm payments and dispatch — build the Orders admin now? | **Build it now** (M10 Phase A: list, proof received, confirm payment, dispatch with CN, cancel, emails). Courier APIs stay M10 Phase B. |
| Q51 | How long does a bank / JazzCash order wait for payment? | **48 hours**, and recording the screenshot ("Proof received") in admin stops the cancellation. |

## M. Checkout choice and free delivery (2026-10-04) — answered

| Q | Question | Decision |
|---|---|---|
| Q52 | How long does a pay-in-advance customer have to send payment details? (replaces Q51) | **24 hours** — payment slip + transaction ID + order number by WhatsApp or email. "Proof received" in admin still stops the cancellation. |
| Q53 | Delivery fee when the customer pays in advance? | **Free** (owner request). Switch in Shop settings, on by default; COD orders still pay delivery and the COD fee. |

## N. Counter sale / POS (2026-10-04) — answered (Q54–Q56) and ★ defaults (Q57–Q61)

| Q | Question | Decision |
|---|---|---|
| Q54 | Which payments can staff take at the counter? | **Cashiers and other staff: cash only** — enter the cash received, the system shows the change. **Only the owner** takes JazzCash / Easypaisa / bank transfer / card, entering the transaction ID and confirming it is genuine and checked (owner answer). |
| Q55 | Extra discounts at the counter? | **Manager discount**: a manager or the owner can take a rupee amount off the whole ticket, with a reason (owner answer). |
| Q56 | Who gets wholesale prices at the counter? | **Approved technicians**, found by mobile number. A manager/owner can register + approve at the till; a cashier's registration waits for approval (retail prices meanwhile). Admin → Technicians to approve/reject (owner answer). |
| Q57 | Counter retail price | ★ Same as the website (sale price and promotions); wholesale never above that day's retail. |
| Q58 | Can the counter sell screens not published online? | ★ Yes, unless archived. |
| Q59 | Counter sale numbers | ★ `CA-POS-YYMMDD-NNNN`, separate from online `CA-ORD-…`. |
| Q60 | Who sees which counter sales? | ★ Cashiers: their own sales, receipts and end of day. Managers and the owner: everyone's. |
| Q61 | Undo a counter sale | ★ Not in M9 — returns and refunds come with M11 (Returns); until then a manager can correct stock on the product page. |

## O. Hero and repair-section animations (2026-10-16) — answered

| Q | Question | Decision |
|---|---|---|
| Q62 | Slide time, now that each phone has a slow animation (was 4 s, §0.3.1a) | **8 seconds** per slide. |
| Q63 | Reduced-motion devices (Q49 said start still) | **Always play** the hero, the screen-change video and the five-layer scene until the shopper presses pause, on every device. Q49 still applies to the grades ring and value cards. |
| Q64 | A different animation per phone | ★ Each phone model has its own motion; if two slides would get the same one, the next unused motion is used. |


## P. Milestone 10 Phase B — couriers, delivery, COD remittance (2026-10-17) — ★ defaults used until you say otherwise

| Q | Question | ★ Default used |
|---|---|---|
| Q65 | Is "Packed" a required step? | **Mark packed** is its own step (Confirmed → Packed, prints the packing slip). Booking through a courier's API needs Packed (spec §9). The Phase A "Dispatch" form (paste a CN from the courier portal) still works from Confirmed or Packed. |
| Q66 | Courier API keys haven't arrived — build the adapters now? | **Yes**, built from the couriers' published API shapes and **off until the keys are in the environment file** (`LEOPARDS_API_KEY` / `LEOPARDS_API_PASSWORD`, `POSTEX_API_TOKEN`). Leopards starts on its staging server (`LEOPARDS_MODE=staging`). Pasting a CN by hand always stays available. Must be checked with sandbox keys before go-live (Admin → Couriers → Test connection). |
| Q67 | Parcel weight and pieces when booking | 500 g and 1 piece, changeable on each booking. |
| Q68 | Who marks an order delivered? | Staff (**Mark delivered**) or the tracking sync. COD orders then show "COD collected by the courier" until the courier pays the shop. **Warranty starts on the delivery date** (`warranty_until` = delivered + the product's warranty days) — used by M11 Returns. |
| Q69 | Parcel returned to the shop (RTO) | **Receive returned parcel** only when it is physically back: each item is either put back on sale (`ORDER_CANCEL_RESTOCK`) or kept off sale as damaged (noted). COD → payment Failed. A paid order needs "I will refund" → Refunded. A coupon use is **not** given back. No customer email. |
| Q70 | Tracking updates | Every 2 hours by `/api/cron/sync-tracking` (and a **Refresh tracking** button) for every open Leopards / PostEx shipment whose courier keys are set. It moves orders to On the way / Delivered and flags parcels coming back; it never restocks a return. |
| Q71 | COD remittance file | Upload the courier's payment report (CSV). Rows are matched by courier + CN. Equal amount → remitted. A different amount — or a parcel we hadn't marked delivered yet — is listed and only accepted if staff tick it and write why (it is then marked delivered too). Unknown CNs, already-remitted, returned and non-COD parcels are listed and skipped. The same file can't be applied twice. |
| Q72 | Undo a booking | **Cancel booking** while the courier hasn't picked the parcel up (shipment still Booked): the courier booking is cancelled through the API (for API bookings) and the order goes back to Packed. |
| Q73 | Labels and load sheets | Every shipment gets a printable **100 × 150 mm label** (sender, receiver, CN barcode, COD amount or "Paid — collect nothing") and a **packing slip**; works with pasted CNs too. API bookings also link the courier's own slip / airway bill. **Load sheet**: a printable list of parcels handed to a courier's rider with COD totals and signature lines; PostEx's own load-sheet PDF too when its key is set. |
| Q74 | Who can do all this | OWNER and MANAGER (the existing `orders` module), COD remittance included. |

## Q. Milestone 11 — returns & warranty (2026-10-22) — ★ defaults used until you say otherwise

| Q | Question | ★ Default used |
|---|---|---|
| Q75 | Who handles returns? | OWNER and MANAGER (spec §7). Cashiers can't open any returns page; a counter return waits for a manager. |
| Q76 | "Changed my mind" returns | Accepted for **7 days** after delivery (online) or sale (counter); later needs a written reason to approve. Faults need an active warranty on every returned item. Constant `CHANGE_OF_MIND_DAYS`. |
| Q77 | Delivery charges on a refund | Refunded (with the COD fee) only for dead on arrival, wrong item, damaged in transit — once per order, ticked by staff. |
| Q78 | Physically damaged items | No warranty (Q11). Approving needs a written reason, except "damaged in transit" (the courier's fault). |
| Q79 | Where does a faulty unit go? | Never back on sale. Becomes a supplier claim (unit cost × qty); no stock movement because the unit never re-entered stock. Supplier defaults to the newest PO that received the colour; staff can pick another. |
| Q80 | Good unit returned | Back on sale as `REPAIR_RETURN` at the original unit cost, at approval time only. |
| Q81 | Replacement | Leaves stock as a `MANUAL_ADJUST` row linked to the return (not a sale, so it isn't counted in sales velocity). If there is none in stock the approval fails — restock the good unit first or refund. |
| Q82 | Refund amount | Price paid after the order discount (and coupon), per unit; staff may give less with a written reason, never more. |
| Q83 | Refund payout | Recorded by staff (cash, or wallet / bank with a unique transaction ID). Nothing is sent automatically. |
| Q84 | Order payment status | `PARTIALLY_REFUNDED` / `REFUNDED` from `PAID` or `COD_REMITTED`; COD cash still with the courier keeps its COD status. |
| Q85 | Store credit | A note / voucher number is recorded; there is no credit balance until customer accounts exist. |
| Q86 | Cash refunds at the till | Counted on End of day (managers / owner) and subtracted from "cash in drawer". |
| Q87 | Counter "void" | A counter sale is undone by a return (reason "changed mind", cash refund) — there is no separate void. |
| Q88 | Customer emails for returns | Not sent in M11. |

## R. Milestone 12 — dashboard & reports (2026-10-24) — ★ defaults used until you say otherwise

| Q | Question | ★ Default used |
|---|---|---|
| Q89 | What is a "sale" in the reports? | Online or counter orders not cancelled / returned-to-us / payment-failed, by order date (Karachi day). Sales = goods after discounts; delivery and COD fees shown separately. Unpaid prepaid orders still waiting are counted. |
| Q90 | Screens sold for velocity | Net: sales minus `REPAIR_RETURN` and `ORDER_CANCEL_RESTOCK` (spec §6.6 names returns; cancelled orders were not demand). 7 / 30 / 90 whole days ending today. |
| Q91 | Reorder rule and quantity | Reorder when days of cover < supplier lead time + 7 (§6.6). Lead time from the newest PO's supplier, else a supplier listing the brand, else 7 days. Suggested = enough for lead + 7 + 30 days, less stock and open orders. |
| Q92 | Dead stock | Stock on hand and no net sales in 90 days (choose 30 / 60 / 180). Colours first stocked inside the period are flagged "new stock", not hidden. |
| Q93 | Returns in margin | Margin report stays gross. The Returns report: goods value given back, cost back on shelf and replacement cost give the effect on margin; supplier credit added when settled; written-off / faulty cost stays in cost of goods. |
| Q94 | COD report scope | Parcels booked in the period, or "everything still unsettled". |
| Q95 | Chart library | None — charts are SVG drawn on the server (keeps the page JavaScript budget, §12). Recharts can be added later if you want hover crosshairs. |


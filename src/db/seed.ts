import { asc, count, eq } from "drizzle-orm";
import { openDatabase, type Tx } from "./connection";
import { toPaisa } from "../lib/money";
import { applyStockMovement } from "../server/inventory/stock";
import { generateSampleImages } from "./seed-images";
import { HOME_STATS_DEFAULT, HOME_VIDEO_DEFAULT } from "./home-defaults";
import type { HeroTheme, PhoneLayout } from "./schema/catalog";
import {
  SYSTEM_USER_ID,
  brands,
  categories,
  coupons,
  deliveryZones,
  heroSlides,
  productImages,
  promotions,
  productVariants,
  products,
  services,
  settings,
  stockLedger,
  testimonials,
  user,
  vendors,
  type Courier,
  type SettingKey,
} from "./schema";

/**
 * `npm run db:seed` — loads starter data into an empty database (spec §5):
 * system user, delivery cities, settings, two vendors, a sample catalogue with
 * opening stock, services and testimonials.
 *
 * The OWNER login is created in Milestone 4, because its password must be hashed
 * by Better Auth and it must enrol 2FA on first sign-in.
 */

const db = openDatabase();

// ---------------------------------------------------------------------------
// Delivery cities. Pin positions are projected from real latitude/longitude
// onto a 0–100 box covering Pakistan, so the landing map is geographically honest.
// ---------------------------------------------------------------------------
const MAP_BOUNDS = { west: 60.5, east: 77.9, north: 37.2, south: 23.5 };
const project = (lat: number, lon: number) => ({
  mapX: Math.round(((lon - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 1000) / 10,
  mapY: Math.round(((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 1000) / 10,
});

type ZoneSeed = {
  city: string;
  province: string;
  lat: number;
  lon: number;
  fee: number; // PKR
  eta: [number, number];
  courier: Courier;
  isHub?: boolean;
};

// Hub city is an assumption (the reference app lists Faisalabad and Lahore) — change in admin settings later.
const ZONES: ZoneSeed[] = [
  { city: "Faisalabad", province: "Punjab", lat: 31.42, lon: 73.08, fee: 150, eta: [1, 1], courier: "LEOPARDS", isHub: true },
  { city: "Lahore", province: "Punjab", lat: 31.55, lon: 74.34, fee: 200, eta: [1, 2], courier: "LEOPARDS" },
  { city: "Islamabad", province: "Islamabad Capital Territory", lat: 33.69, lon: 73.05, fee: 250, eta: [1, 2], courier: "LEOPARDS" },
  { city: "Rawalpindi", province: "Punjab", lat: 33.6, lon: 73.04, fee: 250, eta: [1, 2], courier: "LEOPARDS" },
  { city: "Karachi", province: "Sindh", lat: 24.86, lon: 67.01, fee: 300, eta: [2, 3], courier: "POSTEX" },
  { city: "Peshawar", province: "Khyber Pakhtunkhwa", lat: 34.01, lon: 71.58, fee: 300, eta: [2, 3], courier: "LEOPARDS" },
  { city: "Multan", province: "Punjab", lat: 30.16, lon: 71.52, fee: 250, eta: [1, 2], courier: "POSTEX" },
  { city: "Quetta", province: "Balochistan", lat: 30.18, lon: 66.98, fee: 350, eta: [3, 5], courier: "LEOPARDS" },
  { city: "Hyderabad", province: "Sindh", lat: 25.4, lon: 68.37, fee: 300, eta: [2, 3], courier: "POSTEX" },
  { city: "Gujranwala", province: "Punjab", lat: 32.16, lon: 74.19, fee: 200, eta: [1, 2], courier: "LEOPARDS" },
  { city: "Sialkot", province: "Punjab", lat: 32.49, lon: 74.53, fee: 200, eta: [1, 2], courier: "LEOPARDS" },
];

// ---------------------------------------------------------------------------
// Sample catalogue (PKR). Prices are illustrative placeholders for development.
// Warranty follows the Clarify Q11 default: OEM 30 days, compatible 7 days.
// ---------------------------------------------------------------------------
type ProductSeed = {
  brand: string;
  model: string;
  displayType: string;
  qualityGrade: string;
  cost: number;
  retail: number;
  wholesale: number;
  compatibility: string[];
  variants: { color: string; label?: string; stock: number; bin: string }[];
};

const CATALOGUE: ProductSeed[] = [
  {
    brand: "Samsung", model: "Galaxy S23 Ultra", displayType: "Dynamic AMOLED 2X", qualityGrade: "OEM Original",
    cost: 57000, retail: 68000, wholesale: 62500, compatibility: ["SM-S918B", "SM-S918B/DS"],
    variants: [
      { color: "Phantom Black", label: "With Frame", stock: 6, bin: "A1-01" },
      { color: "Green", label: "With Frame", stock: 2, bin: "A1-02" },
    ],
  },
  {
    brand: "Samsung", model: "Galaxy A54 5G", displayType: "Super AMOLED", qualityGrade: "OEM Original",
    cost: 11800, retail: 14500, wholesale: 13200, compatibility: ["SM-A546E", "SM-A546E/DS"],
    variants: [{ color: "Awesome Graphite", label: "With Frame", stock: 14, bin: "A1-05" }],
  },
  {
    brand: "Samsung", model: "Galaxy A14", displayType: "PLS LCD", qualityGrade: "Compatible A Grade",
    cost: 2700, retail: 3800, wholesale: 3300, compatibility: ["SM-A145F", "SM-A145P"],
    variants: [{ color: "Black", stock: 32, bin: "B2-03" }],
  },
  {
    brand: "Apple", model: "iPhone 14 Pro Max", displayType: "Super Retina XDR OLED", qualityGrade: "OEM Original",
    cost: 66000, retail: 78000, wholesale: 72000, compatibility: ["A2894", "A2651", "A2893", "A2895"],
    variants: [{ color: "Black", stock: 4, bin: "A2-01" }],
  },
  {
    brand: "Apple", model: "iPhone 13", displayType: "OLED", qualityGrade: "Compatible Soft OLED",
    cost: 13500, retail: 17500, wholesale: 15800, compatibility: ["A2633", "A2482", "A2631"],
    variants: [{ color: "Black", stock: 9, bin: "A2-04" }],
  },
  {
    brand: "Apple", model: "iPhone 11", displayType: "IPS LCD", qualityGrade: "Compatible A Grade",
    cost: 4500, retail: 6200, wholesale: 5400, compatibility: ["A2221", "A2111", "A2223"],
    variants: [{ color: "Black", stock: 0, bin: "B1-02" }],
  },
  {
    brand: "Xiaomi", model: "Redmi Note 13 Pro", displayType: "AMOLED", qualityGrade: "OEM Original",
    cost: 13400, retail: 16800, wholesale: 15200, compatibility: ["23117RA68G"],
    variants: [{ color: "Midnight Black", label: "With Frame", stock: 7, bin: "A3-02" }],
  },
  {
    brand: "Xiaomi", model: "Redmi 12C", displayType: "IPS LCD", qualityGrade: "Compatible A Grade",
    cost: 2300, retail: 3200, wholesale: 2800, compatibility: ["22120RN86G", "2212ARNC4L"],
    variants: [{ color: "Black", stock: 41, bin: "B3-01" }],
  },
  {
    brand: "Oppo", model: "Reno 8", displayType: "AMOLED", qualityGrade: "OLED A Grade",
    cost: 9000, retail: 11500, wholesale: 10400, compatibility: ["CPH2359"],
    variants: [{ color: "Shimmer Black", stock: 3, bin: "A4-01" }],
  },
  {
    brand: "Vivo", model: "Y20", displayType: "IPS LCD", qualityGrade: "Compatible A Grade",
    cost: 2100, retail: 3000, wholesale: 2600, compatibility: ["V2027", "V2029"],
    variants: [{ color: "Black", stock: 22, bin: "B4-02" }],
  },
  {
    brand: "Infinix", model: "Hot 30", displayType: "IPS LCD", qualityGrade: "Compatible A Grade",
    cost: 2050, retail: 2900, wholesale: 2500, compatibility: ["X6831"],
    variants: [{ color: "Black", stock: 18, bin: "B5-01" }],
  },
  {
    brand: "Tecno", model: "Spark 10 Pro", displayType: "IPS LCD", qualityGrade: "Compatible A Grade",
    cost: 2150, retail: 3000, wholesale: 2600, compatibility: ["KI7"],
    variants: [{ color: "Black", stock: 5, bin: "B5-04" }],
  },
];

// COD limit and payment account numbers come from the environment file (v1.8), not the database
const SETTINGS: Record<Exclude<SettingKey, "home_stats" | "home_video" | "cod_max_order_paisa" | "wallet_accounts" | "bank_account" | "payment_details_seen" | "payment_details_alert" | "email_daily_count" | "sales_email" | "cod_pause_message" | "prepaid_free_delivery">, unknown> = {
  store_name: "Caidea",
  store_phone: "+920000000000", // placeholder — set the real number in admin settings
  whatsapp: "+920000000000",
  usd_pkr_rate: 280, // placeholder rate — the owner updates it in admin settings (Clarify Q3)
  usd_rate_updated_at: new Date().toISOString(),
  unpaid_order_ttl_minutes: 30, // Clarify Q3b default (automated wallets)
  manual_tid_ttl_minutes: 24 * 60, // v1.12 owner: 24 hours to send the payment slip (v1.11 had 48 h)
  enabled_payment_methods: ["COD", "JAZZCASH", "EASYPAISA", "NAYAPAY", "BANK_TRANSFER"],
};

const slugify = (s: string) => s.toLowerCase().replace(/\+/g, "-plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const skuPart = (s: string) => s.toUpperCase().replace(/\bGALAXY\b|\bREDMI\b/g, (w) => w[0] ?? "").replace(/[^A-Z0-9]/g, "");
const gradeCode = (g: string) => (g.startsWith("OEM") ? "OEM" : g.includes("OLED") ? "OLD" : "AAA");

/** Opening stock count, written through the stock engine like every other movement (spec §6.1). */
function recordOpeningBalance(tx: Tx, variantId: string, quantity: number, unitCostPaisa: number) {
  if (quantity <= 0) return;
  applyStockMovement(tx, {
    variantId,
    delta: quantity,
    type: "OPENING_BALANCE",
    referenceType: "COUNT",
    operatorId: SYSTEM_USER_ID,
    unitCostPaisa,
    notes: "Seed data: opening stock count",
  });
}

function seedCore() {
  const [existing] = db.select({ n: count() }).from(products).all();
  if (existing && existing.n > 0) {
    console.log("Core data already present (products exist) — skipping the core seed.");
    return;
  }

  db.transaction(
    (tx) => {
      tx.insert(user)
        .values({
          id: SYSTEM_USER_ID,
          name: "System",
          email: "system@caidea.invalid",
          role: "SYSTEM",
          isActive: false, // no account/password row exists, so it can never sign in
        })
        .onConflictDoNothing()
        .run();

      ZONES.forEach((z, i) => {
        tx.insert(deliveryZones)
          .values({
            city: z.city,
            province: z.province,
            shippingFeePaisa: z.fee * 100,
            codFeePaisa: 0, // Clarify Q5 default: COD fee absorbed
            etaMinDays: z.eta[0],
            etaMaxDays: z.eta[1],
            defaultCourier: z.courier,
            isHub: z.isHub ?? false,
            sortOrder: i,
            ...project(z.lat, z.lon),
          })
          .run();
      });

      for (const [key, value] of Object.entries(SETTINGS)) {
        if (value === null) continue; // "not set yet" — the owner fills it in Admin → Shop settings
        tx.insert(settings).values({ key: key as SettingKey, value, updatedBy: SYSTEM_USER_ID }).onConflictDoNothing().run();
      }

      tx.insert(vendors)
        .values([
          {
            code: "V-001",
            name: "Shenzhen Display Parts Co. (sample)",
            country: "CN",
            city: "Shenzhen",
            currency: "USD",
            paymentTerms: "ADVANCE",
            leadTimeDays: 14,
            brandsSupplied: ["Samsung", "Apple", "Xiaomi", "Oppo"],
            notes: "Sample vendor for development",
          },
          {
            code: "V-002",
            name: "Hall Road Wholesale (sample)",
            country: "PK",
            city: "Lahore",
            currency: "PKR",
            paymentTerms: "NET_15",
            leadTimeDays: 2,
            brandsSupplied: ["Vivo", "Infinix", "Tecno", "Xiaomi"],
            notes: "Sample vendor for development",
          },
        ])
        .run();

      // v1.2: products.brand must exist in brands (trigger), so brands go in first
      [...new Set(CATALOGUE.map((p) => p.brand))].forEach((name, i) => {
        tx.insert(brands).values({ name, slug: slugify(name), sortOrder: i }).onConflictDoNothing().run();
      });

      for (const p of CATALOGUE) {
        const productId = crypto.randomUUID();
        const sku = `CA-${skuPart(p.brand).slice(0, 3)}-${skuPart(p.model)}-${gradeCode(p.qualityGrade)}`;
        tx.insert(products)
          .values({
            id: productId,
            brand: p.brand,
            model: p.model,
            displayType: p.displayType,
            qualityGrade: p.qualityGrade,
            sku,
            costPrice: p.cost,
            retailPricePKR: p.retail,
            wholesalePricePKR: p.wholesale,
            lowStockThreshold: 5,
            slug: slugify(`${p.brand} ${p.model} ${p.qualityGrade}`),
            description: `${p.displayType} display assembly for the ${p.brand} ${p.model}.`,
            compatibility: p.compatibility,
            warrantyDays: p.qualityGrade.startsWith("OEM") ? 30 : 7,
            isPublished: true,
          })
          .run();

        p.variants.forEach((v, i) => {
          const variantId = crypto.randomUUID();
          tx.insert(productVariants)
            .values({
              id: variantId,
              productId,
              color: v.color,
              variantLabel: v.label ?? null,
              binLocation: v.bin,
              variantSku: `${sku}-${String(i + 1).padStart(2, "0")}`,
            })
            .run();
          recordOpeningBalance(tx, variantId, v.stock, toPaisa(p.cost));
        });
      }

      tx.insert(services)
        .values([
          { slug: "wholesale-supply", title: "Wholesale supply for repair shops", summary: "Technician pricing on screens across Samsung, Apple, Xiaomi, Oppo, Vivo, Infinix and Tecno.", sortOrder: 0 },
          { slug: "screen-fitting", title: "Screen fitting at our counter", summary: "Bring the phone in and we fit, test and seal the new display while you wait.", sortOrder: 1 },
          { slug: "warranty-claims", title: "Warranty and returns", summary: "Dead-on-arrival and touch faults inspected and replaced within the warranty period.", sortOrder: 2 },
        ])
        .run();

      tx.insert(testimonials)
        .values([
          { authorName: "Sample testimonial", authorRole: "Repair shop owner", city: "Lahore", rating: 5, quote: "Placeholder quote — replace with a real customer review from the admin panel.", isPublished: false },
        ])
        .run();
    },
    { behavior: "immediate" },
  );

  const variants = db.select({ n: count() }).from(productVariants).all()[0]?.n ?? 0;
  const ledger = db.select({ n: count() }).from(stockLedger).all()[0]?.n ?? 0;
  console.log(`Seeded ${CATALOGUE.length} products, ${variants} variants, ${ledger} opening-balance ledger rows, ${ZONES.length} delivery cities.`);
}

// ---------------------------------------------------------------------------
// v1.2 storefront data: categories, feature tags, sample photos, hero slides and
// sample discounts. Runs on a fresh database AND on one seeded before v1.2, but only
// once (skipped when categories or hero slides already exist).
// ---------------------------------------------------------------------------
const REFRESH: Record<string, string> = {
  "Galaxy S23 Ultra": "120 Hz",
  "Galaxy A54 5G": "120 Hz",
  "Redmi Note 13 Pro": "120 Hz",
  "Reno 8": "90 Hz",
  "iPhone 14 Pro Max": "120 Hz",
};
const FEATURED = ["Galaxy S23 Ultra", "Galaxy A54 5G", "iPhone 14 Pro Max", "iPhone 13", "Redmi Note 13 Pro", "Reno 8", "Galaxy A14", "Redmi 12C"];

async function seedStorefront() {
  const hasCategories = (db.select({ n: count() }).from(categories).all()[0]?.n ?? 0) > 0;
  const hasSlides = (db.select({ n: count() }).from(heroSlides).all()[0]?.n ?? 0) > 0;
  if (hasCategories || hasSlides) {
    console.log("Storefront data already present — skipping the storefront seed.");
    return;
  }

  const all = db.select().from(products).all();
  const variants = db.select().from(productVariants).all();
  // Photos are generated before the transaction: never do slow work while holding the write lock (spec §6.2)
  const photos = new Map<string, Awaited<ReturnType<typeof generateSampleImages>>>();
  for (const p of all) photos.set(p.id, await generateSampleImages(p.slug, p.brand, p.model, p.displayType));

  const now = new Date();
  const days = (n: number) => new Date(now.getTime() + n * 864e5).toISOString();
  const byModel = (model: string) => all.find((p) => p.model === model);

  db.transaction(
    (tx) => {
      const oled = tx.insert(categories).values({ name: "OLED & AMOLED screens", slug: "oled-amoled", description: "Deep blacks and in-display fingerprint support on most models.", sortOrder: 0 }).returning({ id: categories.id }).get().id;
      const lcd = tx.insert(categories).values({ name: "LCD & Incell screens", slug: "lcd", description: "Dependable, budget-friendly replacements for everyday phones.", sortOrder: 1 }).returning({ id: categories.id }).get().id;

      for (const p of all) {
        const isOled = /OLED|AMOLED/i.test(p.displayType);
        const framed = variants.some((v) => v.productId === p.id && v.variantLabel === "With Frame");
        const tags = [REFRESH[p.model], framed ? "Frame included" : null, "Touch tested"].filter((t): t is string => Boolean(t));
        tx.update(products)
          .set({ categoryId: isOled ? oled : lcd, featureTags: tags, isFeatured: FEATURED.includes(p.model) })
          .where(eq(products.id, p.id))
          .run();
        photos.get(p.id)?.forEach((img, i) =>
          tx.insert(productImages).values({ productId: p.id, url: img.url, angle: img.angle, alt: `${p.brand} ${p.model} screen, ${img.angle.toLowerCase()} view (sample image)`, sortOrder: i }).run(),
        );
      }

      // A product-level sale, so the strikethrough price shows on an LCD screen too
      const redmi12c = byModel("Redmi 12C");
      if (redmi12c) tx.update(products).set({ salePricePKR: 2900, saleStartsAt: days(-1), saleEndsAt: days(21) }).where(eq(products.id, redmi12c.id)).run();

      const slides = [
        { theme: "MIDNIGHT", layout: "RIGHT", model: "Galaxy S23 Ultra", heading: "The S23 Ultra screen, exactly as Samsung fitted it.", sub: "OEM Original service pack, frame included.", body: "Same colour, same brightness, same **120 Hz** touch. Backed by a **30-day warranty**.", cta: "View the screen" },
        { theme: "CREAM", layout: "LOW_LEFT", model: "iPhone 14 Pro Max", heading: "iPhone 14 Pro Max, original panel.", sub: "Super Retina XDR OLED, pulled and graded.", body: "Checked for dead pixels and touch response before it’s packed.", cta: "View the screen" },
        { theme: "TERRACOTTA", layout: "HIGH_RIGHT", model: "Redmi Note 13 Pro", heading: "AMOLED for Redmi, without the guesswork.", sub: "OEM Original with frame, ready to fit.", body: "Ideal for repair shops: **wholesale pricing** for approved technicians.", cta: "View the screen" },
        { theme: "AMBER", layout: "CENTER", model: "Galaxy A54 5G", heading: "Galaxy A54: a best-seller, always on the shelf.", sub: "Super AMOLED, OEM Original.", body: "Ships the same day to Lahore, Karachi, Islamabad and 8 more cities.", cta: "View the screen" },
        { theme: "DUSK", layout: "FAR_RIGHT", model: null, heading: "Stock your repair shop at trade prices.", sub: "Wholesale & enterprise supply.", body: "Approved technicians see **wholesale prices** across every brand.\n\n- Bulk orders packed per model\n- Warranty handled at the counter", cta: "Wholesale pricing", href: "/services" },
      ];
      slides.forEach((s, i) => {
        const product = s.model ? byModel(s.model) : undefined;
        tx.insert(heroSlides)
          .values({
            heading: s.heading,
            subheading: s.sub,
            bodyMd: s.body,
            ctaLabel: s.cta,
            ctaHref: s.href ?? (product ? `/store/${product.slug}` : "/store"),
            productId: product?.id ?? null,
            visualType: "PHONE_3D",
            theme: s.theme as HeroTheme,
            phoneLayout: s.layout as PhoneLayout,
            sortOrder: i,
            isActive: true,
          })
          .run();
        if (product) tx.update(products).set({ isFeaturedHero: true }).where(eq(products.id, product.id)).run();
      });

      tx.insert(promotions)
        .values({
          name: "Launch fortnight: OLED & AMOLED (sample)",
          bannerText: "Launch offer: 10% off every OLED & AMOLED screen",
          discountType: "PERCENT",
          value: 1000,
          scope: "CATEGORY",
          scopeValue: oled,
          startsAt: days(-1),
          endsAt: days(14),
          isActive: true,
          showBanner: true,
        })
        .run();

      tx.insert(coupons)
        .values([
          { code: "WELCOME500", description: "Sample: Rs 500 off orders over Rs 5,000", discountType: "FIXED", value: 50_000, minOrderPaisa: 500_000, usage: "MULTI_USE", maxRedemptions: 100, startsAt: days(-1), endsAt: days(60), createdBy: SYSTEM_USER_ID },
          { code: "REPAIRSHOP-ONCE", description: "Sample single-use: 5% off, max Rs 2,000", discountType: "PERCENT", value: 500, maxDiscountPaisa: 200_000, usage: "SINGLE_USE", maxRedemptions: 1, startsAt: days(-1), endsAt: days(30), createdBy: SYSTEM_USER_ID },
        ])
        .run();
    },
    { behavior: "immediate" },
  );
  console.log(`Seeded storefront: 2 categories, ${all.length * 3} sample photos, ${heroSlideCount()} hero slides, 1 promotion, 2 coupons.`);
}

const heroSlideCount = () => db.select({ n: count() }).from(heroSlides).all()[0]?.n ?? 0;

/**
 * v1.3 home-page content (spec §16): numbers band, repair video, and — for databases seeded
 * before v1.3 — different themes and phone layouts for the sample hero slides. Only fills
 * in what's missing, so it never overwrites the owner's own edits.
 */
const V13_LOOKS: Array<{ theme: HeroTheme; layout: PhoneLayout }> = [
  { theme: "MIDNIGHT", layout: "RIGHT" },
  { theme: "CREAM", layout: "LOW_LEFT" },
  { theme: "TERRACOTTA", layout: "HIGH_RIGHT" },
  { theme: "AMBER", layout: "CENTER" },
  { theme: "DUSK", layout: "FAR_RIGHT" },
];

function seedHomeContent() {
  const added: string[] = [];
  db.transaction(
    (tx) => {
      for (const [key, value] of [
        ["home_stats", HOME_STATS_DEFAULT],
        ["home_video", HOME_VIDEO_DEFAULT],
      ] as const) {
        const inserted = tx.insert(settings).values({ key, value }).onConflictDoNothing().returning({ key: settings.key }).all();
        if (inserted.length) added.push(key);
      }
      const slides = tx.select().from(heroSlides).orderBy(asc(heroSlides.sortOrder)).all();
      const untouched = slides.length > 1 && slides.every((s) => s.theme === "MIDNIGHT" && s.phoneLayout === "RIGHT");
      if (untouched) {
        slides.forEach((s, i) => {
          const look = V13_LOOKS[i % V13_LOOKS.length]!;
          tx.update(heroSlides).set({ theme: look.theme, phoneLayout: look.layout }).where(eq(heroSlides.id, s.id)).run();
        });
        added.push("hero slide themes");
      }
    },
    { behavior: "immediate" },
  );
  console.log(added.length ? `Seeded home content: ${added.join(", ")}.` : "Home content already present — skipping.");
}

async function main() {
  try {
    seedCore();
    await seedStorefront();
    seedHomeContent();
  } finally {
    db.$client.close();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

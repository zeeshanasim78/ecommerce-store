import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { EMAIL_ENV_KEYS } from "@/server/notify/email";
import { PAYMENT_ENV_KEYS } from "@/server/settings/payment-env";
import { COURIER_ENV_KEYS } from "@/server/couriers/config";
import { GATEWAY_ENV_KEYS } from "@/server/payments/config";

/**
 * SPECIFICATION.md §0 (the Constitution) and §10–§11, checked on every `npm test`.
 * These are source-code rules; the behaviour rules are covered by the other unit tests,
 * `npm run db:verify` and the browser walk-throughs.
 */

const ROOT = process.cwd();
function files(dir: string, ext = /\.(ts|tsx)$/): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (ext.test(name)) out.push(relative(ROOT, p).replaceAll("\\", "/"));
    }
  };
  walk(join(ROOT, dir));
  return out;
}
const read = (f: string) => readFileSync(join(ROOT, f), "utf8");

describe("§0.2 design tokens", () => {
  it("UI code uses only the six Caidea colours — no Tailwind default palette classes", () => {
    const palette = "slate|gray|zinc|neutral|stone|red|orange|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black";
    const pattern = new RegExp(`\\b(?:bg|text|border|ring|from|to|via|fill|stroke|outline|decoration|accent|divide|placeholder|caret|shadow)-(?:${palette})(?:-\\d{2,3})?\\b|\\bamber-\\d{2,3}\\b`);
    // /dev/ui deliberately shows a bg-blue-500 circle to prove the palette is off (BUILD_GUIDE M2); it 404s in production
    const offenders = files("src").filter((f) => f.endsWith(".tsx") && f !== "src/app/dev/ui/page.tsx" && pattern.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("globals.css switches the default palette off and declares the six tokens", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/--color-\*:\s*initial/);
    for (const [token, hex] of [
      ["midnight", "#0B1C33"],
      ["terracotta", "#A52A2A"],
      ["amber", "#D97706"],
      ["canvas", "#FBF8F1"],
      ["surface", "#F6EFE5"],
      ["white", "#FFFFFF"],
    ]) {
      expect(css).toMatch(new RegExp(`--color-${token}:\\s*${hex}`, "i"));
    }
  });
});

describe("§3 PKR-only storefront", () => {
  it("no dollar prices or USD text in shopper-facing code", () => {
    const shopper = [...files("src/app/(storefront)"), ...files("src/components/store")];
    const offenders = shopper.filter((f) => /\bUSD\b|\$\s?\d|US\$/.test(read(f).replace(/\$\{/g, "")));
    expect(offenders).toEqual([]);
  });
});

describe("§0.4 / §10 authorisation in the data layer", () => {
  it("every admin page calls requireStaff", () => {
    const pages = files("src/app/admin").filter((f) => f.endsWith("/page.tsx") && f !== "src/app/admin/page.tsx");
    const missing = pages.filter((f) => !/requireStaff(Session)?\(/.test(read(f)));
    expect(pages.length).toBeGreaterThan(20);
    expect(missing).toEqual([]);
  });

  it("every exported Server Action under /admin checks staff access first", () => {
    const missing: string[] = [];
    for (const f of files("src/app/admin").filter((f) => f.endsWith("actions.ts"))) {
      const src = read(f);
      // Split into exported async functions and check each body
      for (const m of src.matchAll(/export async function (\w+)\([^)]*\)[^{]*\{([\s\S]*?)\n\}/g)) {
        const body = m[2]!;
        const helper = /await (staffAndCtx|requireStaff|requireStaffSession)\(/.test(body);
        if (!helper) missing.push(`${f}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("admin route handlers (CSV downloads) check staff access", () => {
    const routes = files("src/app/admin").filter((f) => f.endsWith("/route.ts"));
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.filter((f) => !/await requireStaff\(/.test(read(f)))).toEqual([]);
  });

  it("the cron endpoint requires the secret", () => {
    expect(read("src/app/api/cron/[job]/route.ts")).toMatch(/timingSafeEqual/);
  });
});

describe("v1.10 — all email goes through the Gmail sender", () => {
  it("only src/server/notify/email.ts uses nodemailer", () => {
    const offenders = files("src").filter((f) => f !== "src/server/notify/email.ts" && /from ["']nodemailer|require\(["']nodemailer/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("the sender connects only to smtp.gmail.com (or a test server on this machine)", () => {
    const src = read("src/server/notify/email.ts");
    expect(src).toMatch(/GMAIL_SMTP_HOST = "smtp\.gmail\.com"/);
    expect(src).toMatch(/\^\(127\\\.0\\\.0\\\.1\|localhost\)/);
  });
});

describe("v1.15 §27 — couriers", () => {
  it("only the courier adapters talk to courier servers, and never inside a stock transaction", () => {
    const offenders = files("src").filter((f) => !f.startsWith("src/server/couriers/") && /leopardscourier\.com|api\.postex\.pk/.test(read(f)));
    expect(offenders).toEqual([]);
    // Courier calls are awaited before/after withStockTransaction — never inside its callback (spec §6.2)
    for (const f of ["src/server/orders/fulfilment.ts", "src/server/couriers/city-map.ts", "src/server/orders/cod-remittance.ts"]) {
      const src = read(f);
      const bodies: string[] = [];
      for (let i = src.indexOf("withStockTransaction(db, (tx) =>"); i >= 0; i = src.indexOf("withStockTransaction(db, (tx) =>", i + 1)) {
        let depth = 0;
        let j = src.indexOf("(", i);
        const start = j;
        for (; j < src.length; j++) {
          if (src[j] === "(") depth++;
          else if (src[j] === ")" && --depth === 0) break;
        }
        bodies.push(src.slice(start, j));
      }
      expect(bodies.length, f).toBeGreaterThan(0);
      for (const b of bodies) expect(b, f).not.toMatch(/\bawait\b|\.book\(|\.track\(|\.cancel\(|\.cities\(/);
    }
  });

  it("the test courier must be on this machine", () => {
    expect(read("src/server/couriers/config.ts")).toMatch(/\^http:\\\/\\\/\(127\\\.0\\\.0\\\.1\|localhost\)/);
  });
});

describe("v1.11 §23 — order details are private", () => {
  it("the order PDF and the full order view are only served after the private-cookie check", () => {
    expect(read("src/app/(storefront)/order/[code]/pdf/route.ts")).toMatch(/await orderIdFromCookie\(/);
    expect(read("src/app/(storefront)/order/[code]/pdf/route.ts")).toMatch(/no-store/);
    for (const f of ["src/app/(storefront)/order/[code]/page.tsx", "src/app/(storefront)/checkout/success/page.tsx"]) {
      expect(read(f)).toMatch(/await orderIdFromCookie\(/);
    }
  });

  it("the access token goes to an httpOnly cookie, never back to the browser's JavaScript", () => {
    expect(read("src/server/orders/access.ts")).toMatch(/httpOnly: true/);
    expect(read("src/app/(storefront)/checkout/actions.ts")).toMatch(/return \{ ok: true, code: result\.code \}/);
  });

  it("email links are built from the configured site address, not the request's Host header", () => {
    const offenders = files("src/server/notify").filter((f) => /get\(["']host["']\)|x-forwarded-host/i.test(read(f)));
    expect(offenders).toEqual([]);
  });
});

describe("§11 security rules", () => {
  it("no raw SQL string building outside the CHECK-constraint helper", () => {
    const offenders = files("src").filter((f) => f !== "src/db/schema/_helpers.ts" && /sql\.raw\(/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("no dangerouslySetInnerHTML", () => {
    expect(files("src").filter((f) => /dangerouslySetInnerHTML/.test(read(f)))).toEqual([]);
  });

  it("secrets and the database are git-ignored", () => {
    const ignore = read(".gitignore");
    expect(ignore).toMatch(/\.env\*?\.local|\.env\*/);
    expect(ignore).toMatch(/data\/\*\.db|\*\.db/);
  });
});

describe("§0.4 rule 5 — .env.example documents every key the app reads", () => {
  it("lists every process.env key used in src/", () => {
    const used = new Set<string>([...PAYMENT_ENV_KEYS, ...EMAIL_ENV_KEYS, ...COURIER_ENV_KEYS, ...GATEWAY_ENV_KEYS]);
    for (const f of files("src")) for (const m of read(f).matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g)) used.add(m[1]!);
    used.delete("NODE_ENV"); // set by Next.js itself
    used.delete("NEXT_RUNTIME"); // set by Next.js itself (instrumentation)
    const example = read(".env.example");
    const undocumented = [...used].filter((k) => !new RegExp(`^#?\\s*${k}=`, "m").test(example));
    expect(undocumented).toEqual([]);
  });

  it("the cash-on-delivery limit defaults to Rs 20,000 in .env.example (owner request, v1.8)", () => {
    expect(read(".env.example")).toMatch(/^COD_MAX_ORDER_PKR=20000$/m);
  });
});

describe("§5 migrations", () => {
  it("each migration's timestamp is later than the one before (Drizzle skips an older one on an existing database)", () => {
    const journal = JSON.parse(read("drizzle/meta/_journal.json")) as { entries: { idx: number; when: number; tag: string }[] };
    const out = journal.entries.filter((e, i) => i > 0 && e.when <= journal.entries[i - 1]!.when).map((e) => e.tag);
    expect(out).toEqual([]);
  });
});

describe("v1.18 — content pages (M13)", () => {
  it("structured data is written only by the JsonLd component, through jsonLdString", () => {
    const writers = files("src").filter((f) => /application\/ld\+json/.test(read(f)));
    expect(writers).toEqual(["src/components/store/json-ld.tsx"]);
    expect(read("src/components/store/json-ld.tsx")).toMatch(/jsonLdString\(data\)/);
  });

  it("Markdown is rendered only by the two sanitising components", () => {
    const users = files("src").filter((f) => /from ["']react-markdown["']/.test(read(f)));
    expect(users.sort()).toEqual(["src/components/store/article-markdown.tsx", "src/components/store/markdown.tsx"]);
    expect(read("src/components/store/article-markdown.tsx")).toMatch(/rehype-sanitize/);
    expect(read("src/components/store/article-markdown.tsx")).toMatch(/skipHtml/);
  });

  it("the contact form is rate-limited, has a honeypot and a daily cap", () => {
    const action = read("src/app/(storefront)/contact/actions.ts");
    expect(action).toMatch(/rateLimit\(/);
    expect(action).toMatch(/website/);
    expect(read("src/app/(storefront)/contact/contact-form.tsx")).toMatch(/name="website"/);
    expect(read("src/server/content/contact.ts")).toMatch(/CONTACT_DAILY_CAP/);
  });

  it("the sitemap and robots file never mention private areas as pages, and use the configured address", () => {
    const sitemap = read("src/app/sitemap.ts");
    for (const p of ["/admin", "/cart", "/checkout", "/order", "/login", "/api"]) expect(sitemap).not.toContain(`path: "${p}`);
    expect(sitemap).toMatch(/siteUrl\(\)/);
    expect(sitemap).toMatch(/force-dynamic/);
    const robots = read("src/app/robots.ts");
    for (const p of ["/admin", "/api", "/cart", "/checkout", "/order"]) expect(robots).toContain(`"${p}"`);
  });

  it("content admin pages are limited to the content / messages modules", () => {
    for (const dir of ["blog", "testimonials", "services"]) {
      for (const f of files(`src/app/admin/(gated)/${dir}`).filter((f) => /page\.tsx$|actions\.ts$/.test(f))) expect(read(f)).toMatch(/requireStaff\("content"\)/);
    }
    for (const f of files("src/app/admin/(gated)/messages")) expect(read(f)).toMatch(/requireStaff\("messages"\)/);
  });
});

describe("v1.19 §31 — online payments (M14)", () => {
  it("only the payments adapters talk to a payment gateway", () => {
    const offenders = files("src").filter((f) => !f.startsWith("src/server/payments/") && /\/v1\/payments|x-gateway-signature/i.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("gateway calls are never made inside a database transaction (spec §6.2)", () => {
    const src = read("src/server/payments/online.ts");
    const bodies: string[] = [];
    for (let i = src.indexOf("withStockTransaction("); i >= 0; i = src.indexOf("withStockTransaction(", i + 1)) {
      let depth = 0;
      let j = src.indexOf("(", i);
      const start = j;
      for (; j < src.length; j++) {
        if (src[j] === "(") depth++;
        else if (src[j] === ")" && --depth === 0) break;
      }
      bodies.push(src.slice(start, j));
    }
    expect(bodies.length).toBeGreaterThan(5);
    for (const b of bodies) expect(b).not.toMatch(/\bawait\b|createPayment\(|queryStatus\(|\.refund\(|\.ping\(|reconcilePayment\(/);
  });

  it("the callback route reads the RAW body, verifies the signature before any write, and never trusts the browser", () => {
    const route = read("src/app/api/webhooks/payments/route.ts");
    expect(route).toMatch(/await request\.text\(\)/);
    expect(route).not.toMatch(/request\.json\(\)/);
    expect(route).toMatch(/processWebhook\(/);
    expect(route).toMatch(/rateLimit\(/);
    expect(route).toMatch(/MAX_BODY/);
    const online = read("src/server/payments/online.ts");
    expect(online.indexOf("verifyCallback(")).toBeLessThan(online.indexOf(".insert(webhookEvents)"));
    expect(read("src/server/payments/signature.ts")).toMatch(/timingSafeEqual/);
  });

  it("an order is marked paid only inside applyGatewayState (callback or status query) — not by pages, actions or adapters", () => {
    const writers = files("src").filter((f) => /paymentStatus:\s*"PAID"/.test(read(f)));
    // manual confirmation (bank / wallet, staff), the counter till (cash is handed over in person) and the one gateway function
    expect(writers.sort()).toEqual(["src/server/counter/pos.ts", "src/server/orders/admin-orders.ts", "src/server/payments/online.ts"]);
    expect(read("src/server/orders/admin-orders.ts")).toMatch(/AGGREGATOR[\s\S]{0,200}never mark it paid by hand/);
    const ret = read("src/app/(storefront)/checkout/return/page.tsx");
    expect(ret).not.toMatch(/\.update\(|paymentStatus:\s*"PAID"/);
    expect(ret).toMatch(/reconcilePayment\(/);
  });

  it("the return page only checks for the browser holding the order's private cookie", () => {
    expect(read("src/app/(storefront)/checkout/return/page.tsx")).toMatch(/await orderIdFromCookie\(/);
    expect(read("src/app/(storefront)/order/actions.ts")).toMatch(/payOnlineAction[\s\S]*await orderIdFromCookie\(/);
  });

  it("return and callback addresses come from the configured site address, not the request", () => {
    const online = read("src/server/payments/online.ts");
    expect(online).toMatch(/siteUrl\(env\)/);
    expect(online).not.toMatch(/get\(["']host["']\)|x-forwarded-host/i);
  });

  it("gateway keys are never shown in the admin pages or put in error text", () => {
    for (const f of files("src/app/admin").filter((f) => f.endsWith(".tsx"))) expect(read(f)).not.toMatch(/gatewaySecrets|AGGREGATOR_SECRET_KEY\}|process\.env\.AGGREGATOR/);
    expect(read("src/server/payments/protocol.ts")).not.toMatch(/Error\([^)]*(secretKey|webhookSecret)/);
  });

  it("the cron endpoint offers reconcile-payments and the test gateway must be on this machine", () => {
    expect(read("src/app/api/cron/[job]/route.ts")).toMatch(/reconcile-payments/);
    expect(read("src/server/payments/config.ts")).toMatch(/\^http:\\\/\\\/\(127\\\.0\\\.0\\\.1\|localhost\)/);
  });
});

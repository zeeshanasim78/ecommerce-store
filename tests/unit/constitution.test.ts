import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { EMAIL_ENV_KEYS } from "@/server/notify/email";
import { PAYMENT_ENV_KEYS } from "@/server/settings/payment-env";

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
    const used = new Set<string>([...PAYMENT_ENV_KEYS, ...EMAIL_ENV_KEYS]);
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

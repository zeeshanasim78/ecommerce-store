import { openDatabase } from "./connection";
import { findLedgerDrift } from "../server/inventory/stock";

/**
 * `npm run db:verify` — proves the database guards from SPECIFICATION.md §6.5 are active.
 * Every "must fail" statement runs inside a SAVEPOINT that is rolled back, so this
 * script never changes your data.
 */

const db = openDatabase();
const sqlite = db.$client;
let failures = 0;

function pass(message: string) {
  console.log(`  ✓ ${message}`);
}
function fail(message: string) {
  failures += 1;
  console.log(`  ✗ ${message}`);
}

function mustFail(label: string, sql: string, params: unknown[] = []) {
  sqlite.exec("SAVEPOINT verify");
  try {
    sqlite.prepare(sql).run(...params);
    fail(`${label} — was allowed, but should have been blocked`);
  } catch (error) {
    pass(`${label} — blocked (${(error as Error).message})`);
  } finally {
    sqlite.exec("ROLLBACK TO verify; RELEASE verify");
  }
}

console.log(`Checking ${sqlite.name}\n`);

console.log("Connection settings");
const fk = sqlite.pragma("foreign_keys", { simple: true });
if (fk === 1) pass("foreign_keys = ON");
else fail("foreign_keys is OFF");
const journal = sqlite.pragma("journal_mode", { simple: true });
if (journal === "wal") pass("journal_mode = WAL");
else fail(`journal_mode is ${String(journal)}`);

const row = sqlite
  .prepare(
    "SELECT v.id, v.current_stock FROM product_variants v WHERE EXISTS (SELECT 1 FROM stock_ledger l WHERE l.variant_id = v.id) LIMIT 1",
  )
  .get() as { id: string; current_stock: number } | undefined;

if (!row) {
  console.log("\nNo stock history found — run `npm run db:seed` first.");
  process.exit(1);
}

console.log("\nAppend-only ledger");
mustFail("Editing a ledger row", "UPDATE stock_ledger SET quantity_changed = 999 WHERE variant_id = ?", [row.id]);
mustFail("Deleting a ledger row", "DELETE FROM stock_ledger WHERE variant_id = ?", [row.id]);
mustFail("Deleting a variant that has stock history", "DELETE FROM product_variants WHERE id = ?", [row.id]);
mustFail(
  "Deleting a product whose variants have history",
  "DELETE FROM products WHERE id = (SELECT product_id FROM product_variants WHERE id = ?)",
  [row.id],
);
mustFail(
  "Ledger row that doesn't match the variant's real stock",
  `INSERT INTO stock_ledger (id, variant_id, transaction_type, quantity_changed, previous_stock, new_stock, operator_id)
   VALUES ('verify', ?, 'MANUAL_ADJUST', 5, ?, ?, 'system')`,
  [row.id, row.current_stock, row.current_stock + 5],
);
mustFail(
  "Ledger row whose arithmetic doesn't add up",
  `INSERT INTO stock_ledger (id, variant_id, transaction_type, quantity_changed, previous_stock, new_stock, operator_id)
   VALUES ('verify', ?, 'MANUAL_ADJUST', 5, 0, ?, 'system')`,
  [row.id, row.current_stock],
);
mustFail(
  "Unknown transaction type",
  `INSERT INTO stock_ledger (id, variant_id, transaction_type, quantity_changed, previous_stock, new_stock, operator_id)
   VALUES ('verify', ?, 'GIFT', 1, ?, ?, 'system')`,
  [row.id, row.current_stock - 1, row.current_stock],
);

console.log("\nStock rules");
mustFail("Negative stock on a variant", "UPDATE product_variants SET current_stock = -1 WHERE id = ?", [row.id]);
mustFail(
  "Order item pointing at a variant that doesn't exist",
  `INSERT INTO order_items (id, order_id, variant_id, product_snapshot, quantity, unit_price_paisa, unit_cost_paisa, line_total_paisa)
   VALUES ('verify', 'no-such-order', 'no-such-variant', '{}', 1, 100, 50, 100)`,
);

console.log("\nCatalogue and discount rules (v1.2)");
const product = sqlite.prepare("SELECT id, retail_price_pkr AS retail FROM products LIMIT 1").get() as { id: string; retail: number } | undefined;
if (product) {
  mustFail("Product with a brand that isn't in Brands", "UPDATE products SET brand = 'No Such Brand' WHERE id = ?", [product.id]);
  mustFail("Product in a category that doesn't exist", "UPDATE products SET category_id = 'no-such-category' WHERE id = ?", [product.id]);
  mustFail("Sale price at or above the retail price", "UPDATE products SET sale_price_pkr = ? WHERE id = ?", [product.retail, product.id]);
  mustFail("Deleting a brand that products use", "DELETE FROM brands WHERE name = (SELECT brand FROM products WHERE id = ?)", [product.id]);
}
mustFail(
  "Single-use coupon allowed more than one use",
  "INSERT INTO coupons (id, code, discount_type, value, usage, max_redemptions, starts_at, ends_at) VALUES ('verify', 'VERIFY-1', 'FIXED', 100, 'SINGLE_USE', 5, '2026-01-01', '2026-02-01')",
);
mustFail(
  "Coupon used more times than its limit",
  "INSERT INTO coupons (id, code, discount_type, value, usage, max_redemptions, redemption_count, starts_at, ends_at) VALUES ('verify', 'VERIFY-2', 'FIXED', 100, 'MULTI_USE', 3, 4, '2026-01-01', '2026-02-01')",
);
mustFail(
  "Percentage discount above 90%",
  "INSERT INTO promotions (id, name, discount_type, value, scope, starts_at, ends_at) VALUES ('verify', 'x', 'PERCENT', 9500, 'ALL', '2026-01-01', '2026-02-01')",
);
mustFail(
  "Hero slide button linking to javascript:",
  "INSERT INTO hero_slides (id, heading, cta_label, cta_href) VALUES ('verify', 'x', 'x', 'javascript:alert(1)')",
);

console.log("\nHome page and grade names (v1.3)");
mustFail(
  "Hero slide with an unknown colour theme",
  "INSERT INTO hero_slides (id, heading, cta_label, cta_href, theme) VALUES ('verify', 'x', 'x', '/store', 'NEON')",
);
mustFail(
  "Hero slide with an unknown phone position",
  "INSERT INTO hero_slides (id, heading, cta_label, cta_href, phone_layout) VALUES ('verify', 'x', 'x', '/store', 'UPSIDE_DOWN')",
);
const oldGrades = sqlite.prepare("SELECT COUNT(*) AS n FROM products WHERE quality_grade LIKE '%AAA%'").get() as { n: number };
if (oldGrades.n === 0) pass("No product still shows an AAA grade name (now “A Grade”)");
else fail(`${oldGrades.n} product(s) still use an AAA grade name — run \`npm run db:migrate\``);

console.log("\nLedger invariant (spec §6.5): SUM(quantity_changed) = current_stock for every variant");
const drift = findLedgerDrift(db);
if (drift.length === 0) pass("All variants reconcile with their ledger");
else for (const d of drift) fail(`${d.variantSku}: stock ${d.currentStock} but ledger totals ${d.ledgerTotal}`);

db.$client.close();
console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);

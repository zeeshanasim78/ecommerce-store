import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Worker } from "node:worker_threads";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { buildSync } from "esbuild";
import { openDatabase, type DB } from "@/db/connection";
import { productVariants, stockLedger, SYSTEM_USER_ID, user } from "@/db/schema";
import {
  InsufficientStockError,
  InvalidStockMovementError,
  VariantNotFoundError,
  applyStockMovement,
  findLedgerDrift,
  withStockTransaction,
  type StockMovement,
} from "@/server/inventory/stock";
import { testDb } from "../helpers/db";
import { createVariant } from "../helpers/stock-fixtures";

/** Milestone 5 — the stock engine (SPECIFICATION.md §6). */

const stockOf = (db: DB, variantId: string) =>
  db.select({ s: productVariants.currentStock }).from(productVariants).where(eq(productVariants.id, variantId)).all()[0]?.s;

/** Ledger rows in the order they were written. */
const ledgerOf = (db: DB, variantId: string) =>
  db.$client
    .prepare("SELECT * FROM stock_ledger WHERE variant_id = ? ORDER BY rowid")
    .all(variantId) as { transaction_type: string; quantity_changed: number; previous_stock: number; new_stock: number; reference_type: string | null; reference_id: string | null; operator_id: string; unit_cost_paisa: number | null; notes: string | null }[];

const sale = (variantId: string, qty: number, extra: Partial<StockMovement> = {}): StockMovement => ({
  variantId,
  delta: -qty,
  type: "STORE_SALE",
  referenceId: "order-1",
  operatorId: SYSTEM_USER_ID,
  ...extra,
});

let db: DB;
beforeEach(() => {
  db = testDb();
});

describe("applyStockMovement — the four Milestone 5 checks", () => {
  it("selling 3 of 5 leaves 2 and writes one ledger row 5 → 2", () => {
    const { variantId } = createVariant(db, 5);

    const result = withStockTransaction(db, (tx) => applyStockMovement(tx, sale(variantId, 3, { unitCostPaisa: 100_000 })));

    expect(result).toMatchObject({ previousStock: 5, newStock: 2 });
    expect(stockOf(db, variantId)).toBe(2);
    const rows = ledgerOf(db, variantId);
    expect(rows).toHaveLength(2); // opening balance + the sale
    expect(rows[1]).toMatchObject({
      transaction_type: "STORE_SALE",
      quantity_changed: -3,
      previous_stock: 5,
      new_stock: 2,
      reference_type: "ORDER",
      reference_id: "order-1",
      operator_id: SYSTEM_USER_ID,
      unit_cost_paisa: 100_000,
    });
  });

  it("selling 6 of 5 throws, leaves stock at 5 and writes no ledger row", () => {
    const { variantId } = createVariant(db, 5);
    const before = ledgerOf(db, variantId).length;

    let caught: unknown;
    try {
      withStockTransaction(db, (tx) => applyStockMovement(tx, sale(variantId, 6)));
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(InsufficientStockError);
    expect(caught).toMatchObject({ variantId, requested: 6, available: 5 });
    expect(stockOf(db, variantId)).toBe(5);
    expect(ledgerOf(db, variantId)).toHaveLength(before);
  });

  it("50 truly simultaneous sales of a 10-unit variant: exactly 10 succeed", async () => {
    // A real file (not :memory:) so separate connections in separate threads share it,
    // the way two checkout requests share data/caidea.db.
    const dir = mkdtempSync(join(tmpdir(), "caidea-stock-"));
    try {
      const dbPath = join(dir, "race.db");
      const fileDb = openDatabase(dbPath);
      migrate(fileDb, { migrationsFolder: "./drizzle" });
      fileDb.insert(user).values({ id: SYSTEM_USER_ID, name: "System", email: "system@caidea.invalid", role: "SYSTEM", isActive: false }).run();
      const { variantId } = createVariant(fileDb, 10);

      const WORKERS = 10;
      const ATTEMPTS_EACH = 5; // 10 × 5 = 50 sales of 1 unit
      const gate = new SharedArrayBuffer(8); // [0] = go signal, [1] = workers ready
      const gateView = new Int32Array(gate);

      // Bundle the worker (and the real stock engine it imports) into one plain JS file.
      // Kept inside the project so Node can find better-sqlite3 from it.
      const workerFile = resolve("node_modules/.cache/caidea-tests", `stock-worker-${process.pid}.cjs`);
      buildSync({
        entryPoints: [resolve("tests/helpers/stock-worker.ts")],
        outfile: workerFile,
        bundle: true,
        platform: "node",
        format: "cjs",
        external: ["better-sqlite3"],
        logLevel: "silent",
      });

      let crashed: unknown;
      const results = Array.from({ length: WORKERS }, (_, index) => {
        const worker = new Worker(workerFile, { workerData: { index, dbPath, variantId, attempts: ATTEMPTS_EACH, gate } });
        return new Promise<{ sold: number; soldOut: number; otherErrors: string[] }>((ok, fail) => {
          worker.once("message", ok);
          worker.once("error", (error) => {
            crashed = error;
            fail(error);
          });
        });
      });

      // Release every worker at the same moment once all have loaded.
      while (Atomics.load(gateView, 1) < WORKERS) {
        if (crashed) throw crashed;
        await new Promise((r) => setTimeout(r, 10));
      }
      Atomics.store(gateView, 0, 1);
      Atomics.notify(gateView, 0);

      const outcome = await Promise.all(results);
      const sold = outcome.reduce((n, r) => n + r.sold, 0);
      const soldOut = outcome.reduce((n, r) => n + r.soldOut, 0);

      expect(outcome.flatMap((r) => r.otherErrors)).toEqual([]); // no lock timeouts or crashes
      expect(sold).toBe(10);
      expect(soldOut).toBe(40);
      expect(stockOf(fileDb, variantId)).toBe(0);
      const saleRows = ledgerOf(fileDb, variantId).filter((r) => r.transaction_type === "STORE_SALE");
      expect(saleRows).toHaveLength(10);
      // Each sale saw the stock the previous one left: 10→9, 9→8 … 1→0, no gaps or repeats.
      expect(saleRows.map((r) => r.previous_stock)).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
      expect(findLedgerDrift(fileDb)).toEqual([]);
      fileDb.$client.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(resolve("node_modules/.cache/caidea-tests", `stock-worker-${process.pid}.cjs`), { force: true });
    }
  }, 60_000);

  it("after a long random sequence of movements, SUM(ledger) = current stock and every row chains", () => {
    const { variantId } = createVariant(db, 20);
    let seed = 42; // fixed seed so a failure is reproducible
    const random = () => ((seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31);
    const types = [
      ["STORE_SALE", -1],
      ["COUNTER_POS", -1],
      ["INBOUND_PO", 1],
      ["REPAIR_RETURN", 1],
      ["ORDER_CANCEL_RESTOCK", 1],
      ["DAMAGED_WRITE_OFF", -1],
      ["RETURN_TO_VENDOR", -1],
      ["MANUAL_ADJUST", 0],
    ] as const;

    let expected = 20;
    let rejected = 0;
    for (let i = 0; i < 400; i++) {
      const [type, sign] = types[Math.floor(random() * types.length)]!;
      const size = 1 + Math.floor(random() * 6);
      const delta = sign === 0 ? (random() < 0.5 ? -size : size) : sign * size;
      try {
        withStockTransaction(db, (tx) =>
          applyStockMovement(tx, { variantId, delta, type, operatorId: SYSTEM_USER_ID, notes: type === "MANUAL_ADJUST" ? "Count correction" : null }),
        );
        expected += delta;
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientStockError);
        expect(expected + delta).toBeLessThan(0);
        rejected += 1;
      }
    }

    expect(rejected).toBeGreaterThan(0); // the sequence really did try to oversell
    expect(stockOf(db, variantId)).toBe(expected);
    expect(findLedgerDrift(db)).toEqual([]);

    const rows = ledgerOf(db, variantId);
    expect(rows.reduce((n, r) => n + r.quantity_changed, 0)).toBe(expected);
    rows.forEach((r, i) => {
      expect(r.previous_stock + r.quantity_changed).toBe(r.new_stock);
      if (i > 0) expect(r.previous_stock).toBe(rows[i - 1]!.new_stock);
    });
  });
});

describe("applyStockMovement — safety rules", () => {
  it("rolls back every line of a multi-line order when one line is short", () => {
    const a = createVariant(db, 5, "a").variantId;
    const b = createVariant(db, 1, "b").variantId;

    expect(() =>
      withStockTransaction(db, (tx) => {
        applyStockMovement(tx, sale(a, 2));
        applyStockMovement(tx, sale(b, 2)); // only 1 left
      }),
    ).toThrow(InsufficientStockError);

    expect(stockOf(db, a)).toBe(5);
    expect(stockOf(db, b)).toBe(1);
    expect(db.select().from(stockLedger).where(eq(stockLedger.transactionType, "STORE_SALE")).all()).toEqual([]);
  });

  it("reports a missing variant separately from low stock", () => {
    expect(() => withStockTransaction(db, (tx) => applyStockMovement(tx, sale("no-such-variant", 1)))).toThrow(VariantNotFoundError);
  });

  it("refuses to run outside a transaction", () => {
    const { variantId } = createVariant(db, 5);
    expect(() => applyStockMovement(db as never, sale(variantId, 1))).toThrow(/inside a transaction/);
    expect(stockOf(db, variantId)).toBe(5);
  });

  it("refuses async callbacks, which would escape the transaction", () => {
    const { variantId } = createVariant(db, 5);
    expect(() =>
      withStockTransaction(db, async (tx) => {
        applyStockMovement(tx, sale(variantId, 1));
      }),
    ).toThrow(/synchronous/);
    expect(stockOf(db, variantId)).toBe(5); // the sale inside was rolled back
  });

  it.each([
    ["zero quantity", { delta: 0 }],
    ["fractional quantity", { delta: -1.5 }],
    ["a sale that adds stock", { delta: 2 }],
    ["a PO receipt that removes stock", { type: "INBOUND_PO" as const, delta: -2 }],
    ["a manual adjustment without notes", { type: "MANUAL_ADJUST" as const, delta: -1, notes: "  " }],
    ["a negative unit cost", { unitCostPaisa: -5 }],
    ["no operator", { operatorId: "" }],
  ])("rejects %s", (_label, override) => {
    const { variantId } = createVariant(db, 5);
    expect(() => withStockTransaction(db, (tx) => applyStockMovement(tx, sale(variantId, 1, override)))).toThrow(InvalidStockMovementError);
    expect(stockOf(db, variantId)).toBe(5);
  });

  it("allows a manual adjustment either way when it has notes, defaulting its reference type", () => {
    const { variantId } = createVariant(db, 5);
    withStockTransaction(db, (tx) => {
      applyStockMovement(tx, { variantId, delta: -2, type: "MANUAL_ADJUST", operatorId: SYSTEM_USER_ID, notes: "Found 2 cracked on shelf" });
      applyStockMovement(tx, { variantId, delta: 1, type: "MANUAL_ADJUST", operatorId: SYSTEM_USER_ID, notes: "One was fine after testing" });
    });
    expect(stockOf(db, variantId)).toBe(4);
    expect(ledgerOf(db, variantId).at(-1)).toMatchObject({ reference_type: "ADJUSTMENT", notes: "One was fine after testing" });
  });
});

describe("Constitution §0.4.1 — one writer for current_stock", () => {
  it("no code outside the stock engine writes product_variants.current_stock", () => {
    const allowed = new Set([
      "src/server/inventory/stock.ts", // the engine
      "src/db/schema/inventory.ts", // the column definition
      "src/db/verify.ts", // tries a negative write inside a rolled-back savepoint to prove the CHECK works
    ]);
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(ts|tsx|mjs|js)$/.test(name)) files.push(path);
      }
    };
    walk("src");

    const offenders = files
      .map((f) => relative(process.cwd(), f).replaceAll("\\", "/"))
      .filter((f) => !allowed.has(f))
      .filter((f) => {
        const code = readFileSync(f, "utf8");
        return /currentStock\s*:/.test(code) || /current_stock\s*=/i.test(code) || /update\s+product_variants/i.test(code);
      });

    expect(offenders).toEqual([]);
  });
});

afterAll(() => {
  db?.$client.close();
});

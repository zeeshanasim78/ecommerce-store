import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { DB } from "@/db/connection";
import { brands, categories, productVariants, products, stockLedger, user } from "@/db/schema";
import { csvRecords, parseCsv, toCsv } from "@/lib/csv";
import { exportProductsCsv, importProductsCsv } from "@/server/catalog/product-csv";
import { StockAdjustError, adjustStock, countStock } from "@/server/inventory/adjust";
import { countLedger, listLedger, parseLedgerFilters } from "@/server/inventory/ledger";
import { findLedgerDrift } from "@/server/inventory/stock";
import { testDb } from "../helpers/db";
import { createVariant } from "../helpers/stock-fixtures";

/** Milestone 6 — stock counts/adjustments, the ledger query, and product CSV. */

const ctx = { ip: "127.0.0.1", userAgent: "vitest" };
const manager = { id: "u-manager" };
let db: DB;

const stockOf = (variantId: string) => db.select({ s: productVariants.currentStock }).from(productVariants).where(eq(productVariants.id, variantId)).get()!.s;
const ledger = (variantId: string) => db.select().from(stockLedger).where(eq(stockLedger.variantId, variantId)).all();

beforeEach(() => {
  db = testDb();
  db.insert(user).values({ id: manager.id, name: "Maryam", email: "m@caidea.test", role: "MANAGER", isActive: true }).run();
});

describe("manual adjustments and stock counts (§6.5)", () => {
  it("requires a reason and records it on a MANUAL_ADJUST row", () => {
    const { variantId } = createVariant(db, 5);
    expect(() => adjustStock(db, { variantId, delta: -1, reason: "MANUAL_ADJUST", notes: "", expectedStock: 5 }, manager, ctx)).toThrow(StockAdjustError);
    adjustStock(db, { variantId, delta: -2, reason: "MANUAL_ADJUST", notes: "Two used for shop display", expectedStock: 5 }, manager, ctx);
    expect(stockOf(variantId)).toBe(3);
    expect(ledger(variantId).at(-1)).toMatchObject({ transactionType: "MANUAL_ADJUST", quantityChanged: -2, operatorId: manager.id, notes: "Two used for shop display", referenceType: "ADJUSTMENT", unitCostPaisa: 100_000 });
  });

  it("writes off damage only as a removal", () => {
    const { variantId } = createVariant(db, 5);
    expect(() => adjustStock(db, { variantId, delta: 1, reason: "DAMAGED_WRITE_OFF", notes: "x", expectedStock: 5 }, manager, ctx)).toThrow(/negative/);
    adjustStock(db, { variantId, delta: -1, reason: "DAMAGED_WRITE_OFF", notes: "Cracked glass", expectedStock: 5 }, manager, ctx);
    expect(ledger(variantId).at(-1)!.transactionType).toBe("DAMAGED_WRITE_OFF");
  });

  it("refuses if stock changed since the form was opened", () => {
    const { variantId } = createVariant(db, 5);
    expect(() => adjustStock(db, { variantId, delta: -1, reason: "MANUAL_ADJUST", notes: "x", expectedStock: 6 }, manager, ctx)).toThrow(/changed to 5/);
    expect(() => countStock(db, { variantId, counted: 2, notes: "", expectedStock: 4 }, manager, ctx)).toThrow(/changed/);
    expect(stockOf(variantId)).toBe(5);
  });

  it("a count writes only the difference, with reference type COUNT", () => {
    const { variantId } = createVariant(db, 9);
    const r = countStock(db, { variantId, counted: 7, notes: "Shelf A3", expectedStock: 9 }, manager, ctx);
    expect(r).toEqual({ previousStock: 9, newStock: 7, changed: true });
    expect(ledger(variantId).at(-1)).toMatchObject({ transactionType: "MANUAL_ADJUST", quantityChanged: -2, referenceType: "COUNT", notes: "Stock count: system 9, counted 7. Shelf A3" });

    const same = countStock(db, { variantId, counted: 7, notes: "", expectedStock: 7 }, manager, ctx);
    expect(same.changed).toBe(false);
    expect(ledger(variantId)).toHaveLength(2); // matching count writes no ledger row
  });

  it("the first count of a never-stocked colour is its opening balance", () => {
    const { variantId } = createVariant(db, 0);
    countStock(db, { variantId, counted: 12, notes: "", expectedStock: 0 }, manager, ctx);
    expect(ledger(variantId)[0]).toMatchObject({ transactionType: "OPENING_BALANCE", quantityChanged: 12, referenceType: "COUNT" });
    expect(findLedgerDrift(db)).toEqual([]);
  });
});

describe("stock ledger query", () => {
  it("filters by type, reference and text, newest first", () => {
    const { variantId } = createVariant(db, 5);
    adjustStock(db, { variantId, delta: -1, reason: "DAMAGED_WRITE_OFF", notes: "Cracked", expectedStock: 5 }, manager, ctx);
    const all = listLedger(db, {}, { limit: 50, offset: 0 });
    expect(all.map((r) => r.type)).toEqual(["DAMAGED_WRITE_OFF", "OPENING_BALANCE"]);
    expect(all[0]).toMatchObject({ operatorName: "Maryam", model: "Galaxy Test 1", color: "Black" });

    expect(countLedger(db, parseLedgerFilters({ type: "DAMAGED_WRITE_OFF" }))).toBe(1);
    expect(countLedger(db, parseLedgerFilters({ type: "NOT_A_TYPE" }))).toBe(2); // bad filter ignored
    expect(countLedger(db, parseLedgerFilters({ q: "galaxy test" }))).toBe(2);
    expect(countLedger(db, parseLedgerFilters({ q: "iphone" }))).toBe(0);
    expect(countLedger(db, parseLedgerFilters({ operator: manager.id }))).toBe(1);
  });

  it("filters by Karachi calendar day", () => {
    createVariant(db, 5);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());
    expect(countLedger(db, parseLedgerFilters({ from: today, to: today }))).toBe(1);
    expect(countLedger(db, parseLedgerFilters({ to: "2020-01-01" }))).toBe(0);
  });
});

describe("CSV helpers", () => {
  it("round-trips quotes, commas and line breaks", () => {
    const csv = toCsv(["a", "b"], [["He said \"hi\", ok", "line1\nline2"], [3, null]]);
    expect(parseCsv(csv)).toEqual([["a", "b"], ['He said "hi", ok', "line1\nline2"], ["3", ""]]);
  });

  it("neutralises spreadsheet formulas in text but keeps negative numbers", () => {
    const csv = toCsv(["x", "n"], [["=HYPERLINK(\"http://evil\")", -3]]);
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"")"`);
    expect(csv).toContain(",-3");
    expect(csvRecords(csv).records[0]!.x).toBe('=HYPERLINK("http://evil")'); // reading it back undoes the guard
  });
});

describe("product CSV import/export", () => {
  beforeEach(() => {
    db.insert(brands).values([{ name: "Samsung", slug: "samsung" }, { name: "Apple", slug: "apple" }]).onConflictDoNothing().run();
    db.insert(categories).values({ name: "OLED screens", slug: "oled-screens" }).run();
  });

  const header = "sku,brand,model,display_type,quality_grade,category,retail_price_pkr,wholesale_price_pkr,cost_price,variant_sku,color,opening_stock\n";

  it("creates products and colours, with opening stock through the engine", () => {
    const result = importProductsCsv(
      db,
      header +
        "IP14PM-OLED,Apple,iPhone 14 Pro Max,OLED,OLED A Grade,oled-screens,\"18,500\",16000,12000,IP14PM-OLED-BLK,Black,4\n" +
        "IP14PM-OLED,Apple,iPhone 14 Pro Max,OLED,OLED A Grade,oled-screens,\"18,500\",16000,12000,,Gold,\n",
      manager,
      ctx,
    );
    expect(result).toEqual({ ok: true, productsCreated: 1, productsUpdated: 0, variantsCreated: 2, variantsUpdated: 0, openingUnits: 4 });
    const p = db.select().from(products).where(eq(products.sku, "IP14PM-OLED")).get()!;
    expect(p).toMatchObject({ retailPricePKR: 18_500, costPrice: 12_000, slug: "apple-iphone-14-pro-max-oled-a-grade", isPublished: false });
    const vs = db.select().from(productVariants).where(eq(productVariants.productId, p.id)).all();
    expect(vs.map((v) => [v.variantSku, v.color, v.currentStock]).sort()).toEqual([
      ["IP14PM-OLED-02", "Gold", 0],
      ["IP14PM-OLED-BLK", "Black", 4],
    ]);
    expect(ledger(vs.find((v) => v.color === "Black")!.id)[0]).toMatchObject({ transactionType: "OPENING_BALANCE", operatorId: manager.id });
  });

  it("re-importing an edited export updates prices but never stock or weighted cost", () => {
    const { productId, variantId } = createVariant(db, 6);
    const exported = exportProductsCsv(db);
    expect(exported).toContain("TEST-1-BLK");
    const edited = exported.replace(",1500,1300,1000,", ",1650,1300,999,"); // retail 1500 → 1650, cost edit ignored

    const result = importProductsCsv(db, edited, manager, ctx);
    expect(result).toMatchObject({ ok: true, productsUpdated: 1, variantsUpdated: 1, openingUnits: 0 });
    expect(db.select().from(products).where(eq(products.id, productId)).get()).toMatchObject({ retailPricePKR: 1650, costPrice: 1000 });
    expect(stockOf(variantId)).toBe(6);
  });

  it("is all-or-nothing and reports problems by spreadsheet row", () => {
    const result = importProductsCsv(
      db,
      header +
        "GOOD-1,Samsung,Galaxy A54,AMOLED,OEM Original,,9000,8000,6000,,Black,\n" +
        "BAD-1,Nokia,3310,LCD,OEM Original,,900,800,600,,Grey,\n" +
        "BAD-2,Samsung,Galaxy S9,AMOLED,OEM Original,no-such,900,1800,600,,Grey,\n",
      manager,
      ctx,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join("\n")).toMatch(/Row 3: brand “Nokia”/);
    expect(result.errors.join("\n")).toMatch(/Row 4: wholesale_price_pkr should not be higher/);
    expect(db.select().from(products).all()).toHaveLength(0); // GOOD-1 not written either
  });

  it("won't set opening stock on a colour that already has history", () => {
    createVariant(db, 2);
    const csv = header + "TEST-1,Samsung,Galaxy Test 1,AMOLED,OEM Original,,1500,1300,1000,TEST-1-BLK,Black,10\n";
    const result = importProductsCsv(db, csv, manager, ctx);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors[0]).toMatch(/already has stock history/);
  });

  it("rejects mismatched product details on rows of the same sku and missing columns", () => {
    const mismatch = importProductsCsv(
      db,
      header + "X-1,Samsung,Galaxy A,AMOLED,OEM Original,,900,800,600,,Black,\nX-1,Samsung,Galaxy A,AMOLED,OEM Original,,950,800,600,,Blue,\n",
      manager,
      ctx,
    );
    expect(!mismatch.ok && mismatch.errors[0]).toMatch(/Row 3: .*retail_price_pkr/);
    const noCols = importProductsCsv(db, "sku,brand\nA,B\n", manager, ctx);
    expect(!noCols.ok && noCols.errors[0]).toMatch(/Missing columns/);
  });
});

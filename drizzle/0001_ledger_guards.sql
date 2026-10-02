-- Amendment A-6 (SPECIFICATION.md §6.5): the stock ledger is an append-only audit trail.
-- Drizzle cannot express triggers, so they live in this hand-written migration.

-- 1. Ledger rows can never be edited.
CREATE TRIGGER `stock_ledger_no_update`
BEFORE UPDATE ON `stock_ledger`
BEGIN
  SELECT RAISE(ABORT, 'stock_ledger is append-only: write a new MANUAL_ADJUST row instead of editing history');
END;
--> statement-breakpoint

-- 2. Ledger rows can never be deleted.
CREATE TRIGGER `stock_ledger_no_delete`
BEFORE DELETE ON `stock_ledger`
BEGIN
  SELECT RAISE(ABORT, 'stock_ledger is append-only: rows cannot be deleted');
END;
--> statement-breakpoint

-- 3. A variant with stock history cannot be deleted (the blueprint's ON DELETE CASCADE
--    would otherwise wipe its ledger). Archive it with archived_at instead.
--    This also blocks deleting a product whose variants have history, because that
--    delete cascades to the variants and hits this trigger.
CREATE TRIGGER `product_variants_no_delete_with_history`
BEFORE DELETE ON `product_variants`
WHEN EXISTS (SELECT 1 FROM `stock_ledger` WHERE `variant_id` = OLD.`id`)
BEGIN
  SELECT RAISE(ABORT, 'variant has stock history: set archived_at instead of deleting');
END;
--> statement-breakpoint

-- 4. Each ledger row must describe the variant's real stock at the moment it is written:
--    applyStockMovement() updates current_stock first, then inserts the matching ledger row.
CREATE TRIGGER `stock_ledger_matches_variant`
BEFORE INSERT ON `stock_ledger`
WHEN NEW.`new_stock` <> (SELECT `current_stock` FROM `product_variants` WHERE `id` = NEW.`variant_id`)
BEGIN
  SELECT RAISE(ABORT, 'stock_ledger.new_stock must equal product_variants.current_stock (use applyStockMovement)');
END;

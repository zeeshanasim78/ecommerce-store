-- v1.2 (SPECIFICATION.md §4.16): keep the blueprint's free-text products.brand in step with
-- the new brands table, and validate category and sale-price fields — all without rebuilding
-- the products table (SQLite can't add a foreign key to an existing column in place).

-- Backfill brands from products that already exist (safe on a fresh database: inserts nothing).
INSERT OR IGNORE INTO `brands` (`id`, `name`, `slug`, `sort_order`)
SELECT lower(hex(randomblob(16))), `brand`, lower(replace(trim(`brand`), ' ', '-')), 0
FROM `products` GROUP BY `brand`;
--> statement-breakpoint

CREATE TRIGGER `products_brand_must_exist_insert`
BEFORE INSERT ON `products`
WHEN NOT EXISTS (SELECT 1 FROM `brands` WHERE `name` = NEW.`brand`)
BEGIN
  SELECT RAISE(ABORT, 'products.brand must match a row in brands (add the brand first)');
END;
--> statement-breakpoint

CREATE TRIGGER `products_brand_must_exist_update`
BEFORE UPDATE OF `brand` ON `products`
WHEN NOT EXISTS (SELECT 1 FROM `brands` WHERE `name` = NEW.`brand`)
BEGIN
  SELECT RAISE(ABORT, 'products.brand must match a row in brands (add the brand first)');
END;
--> statement-breakpoint

-- Renaming a brand renames it on its products too.
CREATE TRIGGER `brands_rename_cascade`
AFTER UPDATE OF `name` ON `brands`
BEGIN
  UPDATE `products` SET `brand` = NEW.`name` WHERE `brand` = OLD.`name`;
END;
--> statement-breakpoint

CREATE TRIGGER `brands_no_delete_in_use`
BEFORE DELETE ON `brands`
WHEN EXISTS (SELECT 1 FROM `products` WHERE `brand` = OLD.`name`)
BEGIN
  SELECT RAISE(ABORT, 'brand is used by products: deactivate it instead of deleting');
END;
--> statement-breakpoint

CREATE TRIGGER `products_category_must_exist_insert`
BEFORE INSERT ON `products`
WHEN NEW.`category_id` IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `categories` WHERE `id` = NEW.`category_id`)
BEGIN
  SELECT RAISE(ABORT, 'products.category_id must reference an existing category');
END;
--> statement-breakpoint

CREATE TRIGGER `products_category_must_exist_update`
BEFORE UPDATE OF `category_id` ON `products`
WHEN NEW.`category_id` IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `categories` WHERE `id` = NEW.`category_id`)
BEGIN
  SELECT RAISE(ABORT, 'products.category_id must reference an existing category');
END;
--> statement-breakpoint

-- Deleting a category leaves its products uncategorised (ON DELETE SET NULL behaviour).
CREATE TRIGGER `categories_delete_set_null`
AFTER DELETE ON `categories`
BEGIN
  UPDATE `products` SET `category_id` = NULL WHERE `category_id` = OLD.`id`;
END;
--> statement-breakpoint

-- A sale price must be positive, below the retail price, with a sensible window.
CREATE TRIGGER `products_sale_price_valid_insert`
BEFORE INSERT ON `products`
WHEN NEW.`sale_price_pkr` IS NOT NULL AND (
  NEW.`sale_price_pkr` <= 0 OR NEW.`sale_price_pkr` >= NEW.`retail_price_pkr`
  OR (NEW.`sale_starts_at` IS NOT NULL AND NEW.`sale_ends_at` IS NOT NULL AND NEW.`sale_ends_at` <= NEW.`sale_starts_at`)
)
BEGIN
  SELECT RAISE(ABORT, 'sale price must be above 0 and below the retail price, and end after it starts');
END;
--> statement-breakpoint

CREATE TRIGGER `products_sale_price_valid_update`
BEFORE UPDATE OF `sale_price_pkr`, `retail_price_pkr`, `sale_starts_at`, `sale_ends_at` ON `products`
WHEN NEW.`sale_price_pkr` IS NOT NULL AND (
  NEW.`sale_price_pkr` <= 0 OR NEW.`sale_price_pkr` >= NEW.`retail_price_pkr`
  OR (NEW.`sale_starts_at` IS NOT NULL AND NEW.`sale_ends_at` IS NOT NULL AND NEW.`sale_ends_at` <= NEW.`sale_starts_at`)
)
BEGIN
  SELECT RAISE(ABORT, 'sale price must be above 0 and below the retail price, and end after it starts');
END;

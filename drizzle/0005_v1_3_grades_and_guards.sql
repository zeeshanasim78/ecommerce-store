-- v1.3 (SPECIFICATION.md §16)

-- 1. Grade wording (Q23): "… Grade AAA+" becomes "… A Grade".
--    "Compatible Grade AAA+" → "Compatible A Grade", "OLED Grade AAA+" → "OLED A Grade".
UPDATE `products` SET `quality_grade` = replace(`quality_grade`, 'Grade AAA+', 'A Grade'), `updated_at` = CURRENT_TIMESTAMP
WHERE `quality_grade` LIKE '%Grade AAA+%';
--> statement-breakpoint
UPDATE `products` SET `quality_grade` = replace(`quality_grade`, 'AAA+', 'A Grade'), `updated_at` = CURRENT_TIMESTAMP
WHERE `quality_grade` LIKE '%AAA+%';
--> statement-breakpoint

-- 2. Web addresses made from the old grade follow the new wording (the site isn't live yet,
--    so no old links exist outside the database). Hero buttons pointing at them are updated too.
UPDATE `hero_slides` SET `cta_href` = replace(`cta_href`, 'grade-aaa-plus', 'a-grade') WHERE `cta_href` LIKE '%grade-aaa-plus%';
--> statement-breakpoint
UPDATE `products` SET `slug` = replace(`slug`, 'grade-aaa-plus', 'a-grade') WHERE `slug` LIKE '%grade-aaa-plus%';
--> statement-breakpoint

-- 3. Allowed values for the new hero columns (CHECK constraints would force a table rebuild).
CREATE TRIGGER `hero_slides_theme_layout_insert`
BEFORE INSERT ON `hero_slides`
WHEN NEW.`theme` NOT IN ('MIDNIGHT', 'TERRACOTTA', 'AMBER', 'CREAM', 'DUSK')
  OR NEW.`phone_layout` NOT IN ('RIGHT', 'LOW_LEFT', 'HIGH_RIGHT', 'CENTER', 'FAR_RIGHT')
BEGIN
  SELECT RAISE(ABORT, 'hero slide theme or phone layout is not one of the allowed values');
END;
--> statement-breakpoint
CREATE TRIGGER `hero_slides_theme_layout_update`
BEFORE UPDATE OF `theme`, `phone_layout` ON `hero_slides`
WHEN NEW.`theme` NOT IN ('MIDNIGHT', 'TERRACOTTA', 'AMBER', 'CREAM', 'DUSK')
  OR NEW.`phone_layout` NOT IN ('RIGHT', 'LOW_LEFT', 'HIGH_RIGHT', 'CENTER', 'FAR_RIGHT')
BEGIN
  SELECT RAISE(ABORT, 'hero slide theme or phone layout is not one of the allowed values');
END;

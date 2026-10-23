PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_return_items` (
	`id` text PRIMARY KEY NOT NULL,
	`return_id` text NOT NULL,
	`order_item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`condition` text,
	`disposition` text,
	`refund_paisa` integer DEFAULT 0 NOT NULL,
	`vendor_id` text,
	FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "return_items_quantity_positive" CHECK("__new_return_items"."quantity" > 0),
	CONSTRAINT "return_items_refund_non_negative" CHECK("__new_return_items"."refund_paisa" >= 0),
	CONSTRAINT "return_items_condition" CHECK("__new_return_items"."condition" IS NULL OR "condition" IN ('RESELLABLE', 'DEFECTIVE', 'PHYSICALLY_DAMAGED')),
	CONSTRAINT "return_items_disposition" CHECK("__new_return_items"."disposition" IS NULL OR "disposition" IN ('RESTOCK', 'RETURN_TO_VENDOR', 'WRITE_OFF'))
);
--> statement-breakpoint
INSERT INTO `__new_return_items`("id", "return_id", "order_item_id", "quantity", "condition", "disposition") SELECT "id", "return_id", "order_item_id", "quantity", "condition", "disposition" FROM `return_items`;--> statement-breakpoint
DROP TABLE `return_items`;--> statement-breakpoint
ALTER TABLE `__new_return_items` RENAME TO `return_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `return_items_return_idx` ON `return_items` (`return_id`);--> statement-breakpoint
CREATE TABLE `__new_returns` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`order_id` text NOT NULL,
	`customer_id` text,
	`reason` text NOT NULL,
	`status` text DEFAULT 'REQUESTED' NOT NULL,
	`resolution` text,
	`within_warranty` integer NOT NULL,
	`inspected_by` text,
	`inspection_notes` text,
	`refund_paisa` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`closed_at` text,
	`created_by` text,
	`description` text,
	`received_at` text,
	`decided_by` text,
	`decided_at` text,
	`decision_notes` text,
	`override_reason` text,
	`refund_includes_delivery` integer DEFAULT false NOT NULL,
	`refund_method` text,
	`refund_reference` text,
	`refunded_at` text,
	`refunded_by` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`inspected_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decided_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`refunded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "returns_refund_method" CHECK("__new_returns"."refund_method" IS NULL OR "refund_method" IN ('CASH', 'BANK_TRANSFER', 'JAZZCASH', 'EASYPAISA', 'NAYAPAY', 'OTHER')),
	CONSTRAINT "returns_reason" CHECK("reason" IN ('DEAD_ON_ARRIVAL', 'TOUCH_FAULT', 'LINES_ON_DISPLAY', 'WRONG_ITEM', 'DAMAGED_IN_TRANSIT', 'CHANGE_OF_MIND')),
	CONSTRAINT "returns_status" CHECK("status" IN ('REQUESTED', 'RECEIVED', 'INSPECTING', 'APPROVED', 'REJECTED', 'CLOSED')),
	CONSTRAINT "returns_resolution" CHECK("__new_returns"."resolution" IS NULL OR "resolution" IN ('REFUND', 'REPLACEMENT', 'STORE_CREDIT', 'REJECTED')),
	CONSTRAINT "returns_refund_non_negative" CHECK("__new_returns"."refund_paisa" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_returns`("id", "code", "order_id", "customer_id", "reason", "status", "resolution", "within_warranty", "inspected_by", "inspection_notes", "refund_paisa", "created_at", "closed_at") SELECT "id", "code", "order_id", "customer_id", "reason", "status", "resolution", "within_warranty", "inspected_by", "inspection_notes", "refund_paisa", "created_at", "closed_at" FROM `returns`;--> statement-breakpoint
DROP TABLE `returns`;--> statement-breakpoint
ALTER TABLE `__new_returns` RENAME TO `returns`;--> statement-breakpoint
CREATE UNIQUE INDEX `returns_code_unique` ON `returns` (`code`);--> statement-breakpoint
CREATE INDEX `returns_order_idx` ON `returns` (`order_id`);--> statement-breakpoint
CREATE TABLE `__new_vendor_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`return_item_id` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`credit_paisa` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`claim_paisa` integer DEFAULT 0 NOT NULL,
	`reference` text,
	`sent_at` text,
	`resolved_at` text,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`return_item_id`) REFERENCES `return_items`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "vendor_claims_amounts" CHECK("__new_vendor_claims"."claim_paisa" >= 0 AND "__new_vendor_claims"."credit_paisa" >= 0),
	CONSTRAINT "vendor_claims_status" CHECK("status" IN ('OPEN', 'SENT', 'CREDITED', 'REJECTED'))
);
--> statement-breakpoint
INSERT INTO `__new_vendor_claims`("id", "vendor_id", "return_item_id", "status", "credit_paisa", "notes", "created_at") SELECT "id", "vendor_id", "return_item_id", "status", "credit_paisa", "notes", "created_at" FROM `vendor_claims`;--> statement-breakpoint
DROP TABLE `vendor_claims`;--> statement-breakpoint
ALTER TABLE `__new_vendor_claims` RENAME TO `vendor_claims`;--> statement-breakpoint
CREATE UNIQUE INDEX `vendor_claims_return_item_unique` ON `vendor_claims` (`return_item_id`);--> statement-breakpoint
CREATE INDEX `vendor_claims_vendor_idx` ON `vendor_claims` (`vendor_id`);--> statement-breakpoint
-- M11 guard (spec §28): a customer can't return more units of a line than they bought, counting every
-- return that wasn't rejected. The application checks first and words the error; this is the backstop.
CREATE TRIGGER `return_items_no_over_return`
BEFORE INSERT ON `return_items`
WHEN (
  SELECT COALESCE(SUM(ri.`quantity`), 0)
  FROM `return_items` ri JOIN `returns` r ON r.`id` = ri.`return_id`
  WHERE ri.`order_item_id` = NEW.`order_item_id` AND r.`status` <> 'REJECTED'
) + NEW.`quantity` > (SELECT `quantity` FROM `order_items` WHERE `id` = NEW.`order_item_id`)
BEGIN
  SELECT RAISE(ABORT, 'cannot return more units than were bought');
END;

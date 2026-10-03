CREATE TABLE `email_log` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text,
	`kind` text NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`status` text NOT NULL,
	`detail` text,
	`created_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "email_log_kind" CHECK("kind" IN ('ORDER_PLACED', 'SALES_COPY', 'PAYMENT_CONFIRMED', 'DISPATCHED', 'CANCELLED')),
	CONSTRAINT "email_log_status" CHECK("status" IN ('SENT', 'FAILED', 'SKIPPED'))
);
--> statement-breakpoint
CREATE INDEX `email_log_order_idx` ON `email_log` (`order_id`);--> statement-breakpoint
CREATE INDEX `email_log_recipient_idx` ON `email_log` (`recipient`,`created_at`);--> statement-breakpoint
CREATE TABLE `order_access_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_access_tokens_token_hash_unique` ON `order_access_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `order_access_tokens_order_idx` ON `order_access_tokens` (`order_id`);--> statement-breakpoint
-- v1.11 owner decision: wallet / bank orders wait 48 hours for payment (was 24). Only the old default is changed;
-- a value the owner already set in Shop settings is kept.
UPDATE `settings` SET `value` = '2880', `updated_at` = CURRENT_TIMESTAMP WHERE `key` = 'manual_tid_ttl_minutes' AND `value` = '1440';

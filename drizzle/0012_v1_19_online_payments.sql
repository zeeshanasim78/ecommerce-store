ALTER TABLE `payments` ADD `checked_at` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `failure_reason` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `refunded_paisa` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `refund_ref` text;--> statement-breakpoint
ALTER TABLE `webhook_events` ADD `payment_id` text;--> statement-breakpoint
ALTER TABLE `webhook_events` ADD `detail` text;
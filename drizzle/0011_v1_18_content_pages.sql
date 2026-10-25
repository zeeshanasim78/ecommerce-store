ALTER TABLE `blog_posts` ADD `archived_at` text;--> statement-breakpoint
ALTER TABLE `contact_messages` ADD `handled_by` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `contact_messages` ADD `handled_at` text;--> statement-breakpoint
CREATE INDEX `contact_messages_status_idx` ON `contact_messages` (`status`,`created_at`);--> statement-breakpoint
ALTER TABLE `services` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `testimonials` ADD `archived_at` text;
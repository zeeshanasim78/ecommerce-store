CREATE TABLE `cod_remittance_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`remittance_id` text NOT NULL,
	`row_no` integer NOT NULL,
	`cn` text NOT NULL,
	`amount_paisa` integer NOT NULL,
	`shipment_id` text,
	`order_id` text,
	`expected_paisa` integer,
	`result` text NOT NULL,
	`applied` integer DEFAULT false NOT NULL,
	`note` text,
	FOREIGN KEY (`remittance_id`) REFERENCES `cod_remittances`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "cod_remittance_lines_result" CHECK("result" IN ('MATCH', 'AMOUNT_DIFFERS', 'UNKNOWN_CN', 'NOT_DELIVERED', 'ALREADY_REMITTED', 'NOT_COD', 'DUPLICATE_ROW')),
	CONSTRAINT "cod_remittance_lines_amount" CHECK("cod_remittance_lines"."amount_paisa" >= 0)
);
--> statement-breakpoint
CREATE INDEX `cod_remittance_lines_remittance_idx` ON `cod_remittance_lines` (`remittance_id`);--> statement-breakpoint
CREATE TABLE `cod_remittances` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`courier` text NOT NULL,
	`reference` text,
	`file_name` text NOT NULL,
	`file_sha256` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`rows` integer NOT NULL,
	`applied_paisa` integer DEFAULT 0 NOT NULL,
	`applied_count` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`confirmed_by` text,
	`confirmed_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`confirmed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "cod_remittances_courier" CHECK("courier" IN ('LEOPARDS', 'POSTEX', 'TCS', 'TRAX', 'SELF')),
	CONSTRAINT "cod_remittances_status" CHECK("status" IN ('DRAFT', 'CONFIRMED', 'DISCARDED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cod_remittances_code_unique` ON `cod_remittances` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `cod_remittances_file_unique` ON `cod_remittances` (`courier`,`file_sha256`);--> statement-breakpoint
CREATE TABLE `courier_cities` (
	`id` text PRIMARY KEY NOT NULL,
	`courier` text NOT NULL,
	`city_id` text NOT NULL,
	`courier_city_code` text NOT NULL,
	`courier_city_name` text NOT NULL,
	`source` text DEFAULT 'AUTO' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`city_id`) REFERENCES `delivery_zones`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "courier_cities_courier" CHECK("courier" IN ('LEOPARDS', 'POSTEX')),
	CONSTRAINT "courier_cities_source" CHECK("source" IN ('AUTO', 'MANUAL'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courier_cities_unique` ON `courier_cities` (`courier`,`city_id`);--> statement-breakpoint
CREATE TABLE `load_sheets` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`courier` text NOT NULL,
	`courier_ref` text,
	`parcels` integer NOT NULL,
	`cod_total_paisa` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "load_sheets_courier" CHECK("courier" IN ('LEOPARDS', 'POSTEX', 'TCS', 'TRAX', 'SELF')),
	CONSTRAINT "load_sheets_counts" CHECK("load_sheets"."parcels" >= 1 AND "load_sheets"."cod_total_paisa" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `load_sheets_code_unique` ON `load_sheets` (`code`);--> statement-breakpoint
ALTER TABLE `shipments` ADD `booked_via` text DEFAULT 'MANUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE `shipments` ADD `pieces` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `shipments` ADD `tracking_checked_at` text;--> statement-breakpoint
ALTER TABLE `shipments` ADD `cancelled_at` text;--> statement-breakpoint
ALTER TABLE `shipments` ADD `remittance_id` text REFERENCES cod_remittances(id);--> statement-breakpoint
ALTER TABLE `shipments` ADD `remitted_paisa` integer;--> statement-breakpoint
ALTER TABLE `shipments` ADD `remitted_at` text;
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `two_factor` (
	`id` text PRIMARY KEY NOT NULL,
	`secret` text NOT NULL,
	`backup_codes` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `two_factor_user_idx` ON `two_factor` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`two_factor_enabled` integer DEFAULT false,
	`role` text DEFAULT 'CUSTOMER' NOT NULL,
	`phone` text,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`color` text NOT NULL,
	`current_stock` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`variant_sku` text NOT NULL,
	`variant_label` text,
	`bin_location` text,
	`archived_at` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "product_variants_stock_non_negative" CHECK("product_variants"."current_stock" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variants_variant_sku_unique` ON `product_variants` (`variant_sku`);--> statement-breakpoint
CREATE INDEX `product_variants_product_idx` ON `product_variants` (`product_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`display_type` text NOT NULL,
	`quality_grade` text NOT NULL,
	`sku` text NOT NULL,
	`cost_price` real NOT NULL,
	`retail_price_pkr` real NOT NULL,
	`wholesale_price_pkr` real NOT NULL,
	`low_stock_threshold` integer DEFAULT 5 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`compatibility` text DEFAULT '[]' NOT NULL,
	`warranty_days` integer DEFAULT 7 NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`archived_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "products_prices_non_negative" CHECK("products"."cost_price" >= 0 AND "products"."retail_price_pkr" >= 0 AND "products"."wholesale_price_pkr" >= 0),
	CONSTRAINT "products_low_stock_threshold_non_negative" CHECK("products"."low_stock_threshold" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `products_brand_model_idx` ON `products` (`brand`,`model`);--> statement-breakpoint
CREATE TABLE `stock_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`variant_id` text NOT NULL,
	`transaction_type` text NOT NULL,
	`quantity_changed` integer NOT NULL,
	`previous_stock` integer NOT NULL,
	`new_stock` integer NOT NULL,
	`reference_id` text,
	`operator_id` text NOT NULL,
	`notes` text,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reference_type` text,
	`unit_cost_paisa` integer,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "stock_ledger_transaction_type" CHECK("transaction_type" IN ('INBOUND_PO', 'STORE_SALE', 'COUNTER_POS', 'REPAIR_RETURN', 'MANUAL_ADJUST', 'ORDER_CANCEL_RESTOCK', 'RETURN_TO_VENDOR', 'DAMAGED_WRITE_OFF', 'OPENING_BALANCE')),
	CONSTRAINT "stock_ledger_reference_type" CHECK("stock_ledger"."reference_type" IS NULL OR "reference_type" IN ('ORDER', 'PO', 'RETURN', 'ADJUSTMENT', 'COUNT')),
	CONSTRAINT "stock_ledger_quantity_non_zero" CHECK("stock_ledger"."quantity_changed" <> 0),
	CONSTRAINT "stock_ledger_arithmetic" CHECK("stock_ledger"."previous_stock" + "stock_ledger"."quantity_changed" = "stock_ledger"."new_stock"),
	CONSTRAINT "stock_ledger_new_stock_non_negative" CHECK("stock_ledger"."new_stock" >= 0)
);
--> statement-breakpoint
CREATE INDEX `stock_ledger_variant_time_idx` ON `stock_ledger` (`variant_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `stock_ledger_reference_idx` ON `stock_ledger` (`reference_id`);--> statement-breakpoint
CREATE TABLE `delivery_zones` (
	`id` text PRIMARY KEY NOT NULL,
	`city` text NOT NULL,
	`province` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`shipping_fee_paisa` integer NOT NULL,
	`cod_available` integer DEFAULT true NOT NULL,
	`cod_fee_paisa` integer DEFAULT 0 NOT NULL,
	`eta_min_days` integer NOT NULL,
	`eta_max_days` integer NOT NULL,
	`default_courier` text DEFAULT 'LEOPARDS' NOT NULL,
	`map_x` real NOT NULL,
	`map_y` real NOT NULL,
	`is_hub` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "delivery_zones_courier" CHECK("default_courier" IN ('LEOPARDS', 'POSTEX', 'TCS', 'TRAX', 'SELF')),
	CONSTRAINT "delivery_zones_eta" CHECK("delivery_zones"."eta_min_days" >= 0 AND "delivery_zones"."eta_max_days" >= "delivery_zones"."eta_min_days"),
	CONSTRAINT "delivery_zones_fees" CHECK("delivery_zones"."shipping_fee_paisa" >= 0 AND "delivery_zones"."cod_fee_paisa" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `delivery_zones_city_unique` ON `delivery_zones` (`city`);--> statement-breakpoint
CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`label` text,
	`line1` text NOT NULL,
	`line2` text,
	`area` text,
	`city_id` text NOT NULL,
	`postal_code` text,
	`phone` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`city_id`) REFERENCES `delivery_zones`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `addresses_customer_idx` ON `addresses` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`customer_type` text DEFAULT 'RETAIL' NOT NULL,
	`technician_status` text,
	`shop_name` text,
	`city` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "customers_type" CHECK("customer_type" IN ('RETAIL', 'TECHNICIAN')),
	CONSTRAINT "customers_technician_status" CHECK("customers"."technician_status" IS NULL OR "technician_status" IN ('PENDING', 'APPROVED', 'REJECTED')),
	CONSTRAINT "customers_phone_e164" CHECK("customers"."phone" GLOB '+92[0-9]*' AND length("customers"."phone") = 13)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_phone_unique` ON `customers` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_user_idx` ON `customers` (`user_id`);--> statement-breakpoint
CREATE TABLE `purchase_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`po_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`qty_ordered` integer NOT NULL,
	`qty_received` integer DEFAULT 0 NOT NULL,
	`unit_cost_foreign` integer NOT NULL,
	`landed_unit_cost_paisa` integer,
	FOREIGN KEY (`po_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "po_items_qty" CHECK("purchase_order_items"."qty_ordered" > 0 AND "purchase_order_items"."qty_received" >= 0 AND "purchase_order_items"."qty_received" <= "purchase_order_items"."qty_ordered"),
	CONSTRAINT "po_items_cost_non_negative" CHECK("purchase_order_items"."unit_cost_foreign" >= 0)
);
--> statement-breakpoint
CREATE INDEX `po_items_po_idx` ON `purchase_order_items` (`po_id`);--> statement-breakpoint
CREATE INDEX `po_items_variant_idx` ON `purchase_order_items` (`variant_id`);--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`vendor_id` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`ordered_at` text,
	`expected_at` text,
	`received_at` text,
	`currency` text DEFAULT 'PKR' NOT NULL,
	`fx_rate_to_pkr` real DEFAULT 1 NOT NULL,
	`shipping_cost_paisa` integer DEFAULT 0 NOT NULL,
	`customs_duty_paisa` integer DEFAULT 0 NOT NULL,
	`other_landed_cost_paisa` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "purchase_orders_status" CHECK("status" IN ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')),
	CONSTRAINT "purchase_orders_currency" CHECK("currency" IN ('PKR', 'USD', 'CNY', 'AED')),
	CONSTRAINT "purchase_orders_fx_positive" CHECK("purchase_orders"."fx_rate_to_pkr" > 0),
	CONSTRAINT "purchase_orders_costs_non_negative" CHECK("purchase_orders"."shipping_cost_paisa" >= 0 AND "purchase_orders"."customs_duty_paisa" >= 0 AND "purchase_orders"."other_landed_cost_paisa" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_orders_code_unique` ON `purchase_orders` (`code`);--> statement-breakpoint
CREATE INDEX `purchase_orders_vendor_idx` ON `purchase_orders` (`vendor_id`);--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`contact_person` text,
	`phone` text,
	`email` text,
	`city` text,
	`country` text DEFAULT 'PK' NOT NULL,
	`currency` text DEFAULT 'PKR' NOT NULL,
	`payment_terms` text DEFAULT 'ADVANCE' NOT NULL,
	`lead_time_days` integer DEFAULT 7 NOT NULL,
	`rating` integer,
	`brands_supplied` text DEFAULT '[]' NOT NULL,
	`notes` text,
	`archived_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "vendors_currency" CHECK("currency" IN ('PKR', 'USD', 'CNY', 'AED')),
	CONSTRAINT "vendors_payment_terms" CHECK("payment_terms" IN ('ADVANCE', 'NET_15', 'NET_30')),
	CONSTRAINT "vendors_rating" CHECK("vendors"."rating" IS NULL OR "vendors"."rating" BETWEEN 1 AND 5),
	CONSTRAINT "vendors_country" CHECK(length("vendors"."country") = 2)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vendors_code_unique` ON `vendors` (`code`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`product_snapshot` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_paisa` integer NOT NULL,
	`unit_cost_paisa` integer NOT NULL,
	`line_total_paisa` integer NOT NULL,
	`warranty_until` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "order_items_quantity_positive" CHECK("order_items"."quantity" > 0),
	CONSTRAINT "order_items_line_total" CHECK("order_items"."line_total_paisa" = "order_items"."quantity" * "order_items"."unit_price_paisa")
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_variant_idx` ON `order_items` (`variant_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`channel` text NOT NULL,
	`customer_id` text,
	`guest_name` text,
	`guest_phone` text,
	`guest_email` text,
	`shipping_address` text,
	`city_id` text,
	`price_tier` text DEFAULT 'RETAIL' NOT NULL,
	`subtotal_paisa` integer NOT NULL,
	`discount_paisa` integer DEFAULT 0 NOT NULL,
	`shipping_fee_paisa` integer DEFAULT 0 NOT NULL,
	`cod_fee_paisa` integer DEFAULT 0 NOT NULL,
	`total_paisa` integer NOT NULL,
	`display_currency` text DEFAULT 'PKR' NOT NULL,
	`fx_rate_used` real,
	`payment_method` text NOT NULL,
	`payment_status` text DEFAULT 'UNPAID' NOT NULL,
	`fulfillment_status` text DEFAULT 'NEW' NOT NULL,
	`idempotency_key` text NOT NULL,
	`placed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`paid_at` text,
	`cancelled_at` text,
	`cancel_reason` text,
	`created_by` text,
	`notes` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`city_id`) REFERENCES `delivery_zones`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "orders_channel" CHECK("channel" IN ('ONLINE', 'COUNTER')),
	CONSTRAINT "orders_price_tier" CHECK("price_tier" IN ('RETAIL', 'WHOLESALE')),
	CONSTRAINT "orders_payment_method" CHECK("payment_method" IN ('COD', 'JAZZCASH', 'EASYPAISA', 'NAYAPAY', 'AGGREGATOR', 'CARD_STRIPE', 'BANK_TRANSFER', 'CASH', 'POS_CARD')),
	CONSTRAINT "orders_payment_status" CHECK("payment_status" IN ('UNPAID', 'PENDING_VERIFICATION', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'COD_PENDING', 'COD_COLLECTED', 'COD_REMITTED')),
	CONSTRAINT "orders_fulfillment_status" CHECK("fulfillment_status" IN ('NEW', 'CONFIRMED', 'PACKED', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED_TO_ORIGIN', 'CANCELLED')),
	CONSTRAINT "orders_display_currency" CHECK("display_currency" IN ('PKR', 'USD')),
	CONSTRAINT "orders_total_arithmetic" CHECK("orders"."total_paisa" = "orders"."subtotal_paisa" - "orders"."discount_paisa" + "orders"."shipping_fee_paisa" + "orders"."cod_fee_paisa"),
	CONSTRAINT "orders_amounts_non_negative" CHECK("orders"."subtotal_paisa" >= 0 AND "orders"."discount_paisa" >= 0 AND "orders"."total_paisa" >= 0),
	CONSTRAINT "orders_online_contact" CHECK("orders"."channel" = 'COUNTER' OR "orders"."customer_id" IS NOT NULL OR "orders"."guest_phone" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_code_unique` ON `orders` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_idempotency_key_unique` ON `orders` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`fulfillment_status`,`payment_status`);--> statement-breakpoint
CREATE INDEX `orders_placed_idx` ON `orders` (`placed_at`);--> statement-breakpoint
CREATE INDEX `orders_customer_idx` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_ref` text,
	`manual_reference` text,
	`payer_msisdn` text,
	`amount_paisa` integer NOT NULL,
	`currency` text DEFAULT 'PKR' NOT NULL,
	`fx_rate_used` real,
	`status` text DEFAULT 'INITIATED' NOT NULL,
	`verified_by` text,
	`verified_at` text,
	`raw_response_hash` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "payments_provider" CHECK("provider" IN ('STRIPE', 'JAZZCASH', 'EASYPAISA', 'NAYAPAY', 'AGGREGATOR', 'MANUAL', 'CASH')),
	CONSTRAINT "payments_status" CHECK("status" IN ('INITIATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED')),
	CONSTRAINT "payments_amount_positive" CHECK("payments"."amount_paisa" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_provider_ref_unique` ON `payments` (`provider`,`provider_ref`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_manual_reference_unique` ON `payments` (`provider`,`manual_reference`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`order_id`);--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`courier` text NOT NULL,
	`service_type` text,
	`cn_number` text,
	`label_url` text,
	`weight_grams` integer,
	`cod_amount_paisa` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'BOOKED' NOT NULL,
	`last_tracking_event` text,
	`booked_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`delivered_at` text,
	`rto_at` text,
	`loadsheet_id` text,
	`created_by` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "shipments_courier" CHECK("courier" IN ('LEOPARDS', 'POSTEX', 'TCS', 'TRAX', 'SELF')),
	CONSTRAINT "shipments_status" CHECK("status" IN ('BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURN_IN_PROGRESS', 'RETURNED_TO_ORIGIN', 'CANCELLED')),
	CONSTRAINT "shipments_cod_non_negative" CHECK("shipments"."cod_amount_paisa" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shipments_courier_cn_unique` ON `shipments` (`courier`,`cn_number`);--> statement-breakpoint
CREATE INDEX `shipments_order_idx` ON `shipments` (`order_id`);--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`event_id` text NOT NULL,
	`received_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`processed_at` text,
	`status` text DEFAULT 'RECEIVED' NOT NULL,
	`payload_sha256` text NOT NULL,
	CONSTRAINT "webhook_events_status" CHECK("status" IN ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webhook_events_provider_event_unique` ON `webhook_events` (`provider`,`event_id`);--> statement-breakpoint
CREATE TABLE `return_items` (
	`id` text PRIMARY KEY NOT NULL,
	`return_id` text NOT NULL,
	`order_item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`condition` text,
	`disposition` text,
	FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "return_items_quantity_positive" CHECK("return_items"."quantity" > 0),
	CONSTRAINT "return_items_condition" CHECK("return_items"."condition" IS NULL OR "condition" IN ('RESELLABLE', 'DEFECTIVE', 'PHYSICALLY_DAMAGED')),
	CONSTRAINT "return_items_disposition" CHECK("return_items"."disposition" IS NULL OR "disposition" IN ('RESTOCK', 'RETURN_TO_VENDOR', 'WRITE_OFF'))
);
--> statement-breakpoint
CREATE INDEX `return_items_return_idx` ON `return_items` (`return_id`);--> statement-breakpoint
CREATE TABLE `returns` (
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
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`inspected_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "returns_reason" CHECK("reason" IN ('DEAD_ON_ARRIVAL', 'TOUCH_FAULT', 'LINES_ON_DISPLAY', 'WRONG_ITEM', 'DAMAGED_IN_TRANSIT', 'CHANGE_OF_MIND')),
	CONSTRAINT "returns_status" CHECK("status" IN ('REQUESTED', 'RECEIVED', 'INSPECTING', 'APPROVED', 'REJECTED', 'CLOSED')),
	CONSTRAINT "returns_resolution" CHECK("returns"."resolution" IS NULL OR "resolution" IN ('REFUND', 'REPLACEMENT', 'STORE_CREDIT', 'REJECTED')),
	CONSTRAINT "returns_refund_non_negative" CHECK("returns"."refund_paisa" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `returns_code_unique` ON `returns` (`code`);--> statement-breakpoint
CREATE INDEX `returns_order_idx` ON `returns` (`order_id`);--> statement-breakpoint
CREATE TABLE `vendor_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`return_item_id` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`credit_paisa` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`return_item_id`) REFERENCES `return_items`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "vendor_claims_status" CHECK("status" IN ('OPEN', 'SENT', 'CREDITED', 'REJECTED'))
);
--> statement-breakpoint
CREATE INDEX `vendor_claims_vendor_idx` ON `vendor_claims` (`vendor_id`);--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`body_md` text NOT NULL,
	`cover_image` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`published_at` text,
	`author_id` text,
	`seo_title` text,
	`seo_description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "blog_posts_status" CHECK("status" IN ('DRAFT', 'PUBLISHED'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);--> statement-breakpoint
CREATE INDEX `blog_posts_published_idx` ON `blog_posts` (`status`,`published_at`);--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`subject` text,
	`message` text NOT NULL,
	`status` text DEFAULT 'NEW' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "contact_messages_status" CHECK("status" IN ('NEW', 'REPLIED', 'SPAM'))
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`body_md` text,
	`icon` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `services_slug_unique` ON `services` (`slug`);--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`author_name` text NOT NULL,
	`author_role` text,
	`city` text,
	`rating` integer,
	`quote` text NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "testimonials_rating" CHECK("testimonials"."rating" IS NULL OR "testimonials"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE `admin_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text,
	`before` text,
	`after` text,
	`ip` text,
	`user_agent` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `admin_audit_entity_idx` ON `admin_audit_log` (`entity`,`entity_id`);--> statement-breakpoint
CREATE INDEX `admin_audit_actor_idx` ON `admin_audit_log` (`actor_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `brands` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_name_unique` ON `brands` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `brands_slug_unique` ON `brands` (`slug`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `hero_slides` (
	`id` text PRIMARY KEY NOT NULL,
	`heading` text NOT NULL,
	`subheading` text,
	`body_md` text,
	`cta_label` text NOT NULL,
	`cta_href` text NOT NULL,
	`product_id` text,
	`visual_type` text DEFAULT 'PHONE_3D' NOT NULL,
	`visual_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "hero_slides_visual_type" CHECK("visual_type" IN ('PHONE_3D', 'IMAGE')),
	CONSTRAINT "hero_slides_image_needs_url" CHECK("hero_slides"."visual_type" <> 'IMAGE' OR "hero_slides"."visual_url" IS NOT NULL),
	CONSTRAINT "hero_slides_cta_href_safe" CHECK("hero_slides"."cta_href" GLOB '/*' OR "hero_slides"."cta_href" GLOB 'https://*')
);
--> statement-breakpoint
CREATE INDEX `hero_slides_order_idx` ON `hero_slides` (`is_active`,`sort_order`);--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text,
	`url` text NOT NULL,
	`alt` text NOT NULL,
	`angle` text DEFAULT 'FRONT' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "product_images_angle" CHECK("angle" IN ('FRONT', 'BACK', 'SIDE', 'DETAIL'))
);
--> statement-breakpoint
CREATE INDEX `product_images_product_idx` ON `product_images` (`product_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `coupon_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`coupon_id` text NOT NULL,
	`order_id` text NOT NULL,
	`customer_phone` text,
	`discount_paisa` integer NOT NULL,
	`redeemed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "coupon_redemptions_discount_positive" CHECK("coupon_redemptions"."discount_paisa" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupon_redemptions_coupon_order_unique` ON `coupon_redemptions` (`coupon_id`,`order_id`);--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`discount_type` text NOT NULL,
	`value` integer NOT NULL,
	`min_order_paisa` integer DEFAULT 0 NOT NULL,
	`max_discount_paisa` integer,
	`usage` text DEFAULT 'MULTI_USE' NOT NULL,
	`max_redemptions` integer,
	`redemption_count` integer DEFAULT 0 NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "coupons_code_format" CHECK("coupons"."code" = upper("coupons"."code") AND length("coupons"."code") BETWEEN 3 AND 32 AND "coupons"."code" NOT GLOB '*[^A-Z0-9-]*'),
	CONSTRAINT "coupons_type" CHECK("discount_type" IN ('PERCENT', 'FIXED')),
	CONSTRAINT "coupons_usage" CHECK("usage" IN ('SINGLE_USE', 'MULTI_USE')),
	CONSTRAINT "coupons_value" CHECK("coupons"."value" > 0 AND ("coupons"."discount_type" <> 'PERCENT' OR "coupons"."value" <= 9000)),
	CONSTRAINT "coupons_single_use" CHECK("coupons"."usage" <> 'SINGLE_USE' OR "coupons"."max_redemptions" = 1),
	CONSTRAINT "coupons_redemptions" CHECK("coupons"."redemption_count" >= 0 AND ("coupons"."max_redemptions" IS NULL OR "coupons"."redemption_count" <= "coupons"."max_redemptions")),
	CONSTRAINT "coupons_min_order" CHECK("coupons"."min_order_paisa" >= 0),
	CONSTRAINT "coupons_window" CHECK("coupons"."ends_at" > "coupons"."starts_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`banner_text` text,
	`discount_type` text NOT NULL,
	`value` integer NOT NULL,
	`scope` text DEFAULT 'ALL' NOT NULL,
	`scope_value` text,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`show_banner` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "promotions_type" CHECK("discount_type" IN ('PERCENT', 'FIXED')),
	CONSTRAINT "promotions_scope" CHECK("scope" IN ('ALL', 'BRAND', 'CATEGORY', 'PRODUCT')),
	CONSTRAINT "promotions_value" CHECK("promotions"."value" > 0 AND ("promotions"."discount_type" <> 'PERCENT' OR "promotions"."value" <= 9000)),
	CONSTRAINT "promotions_scope_value" CHECK(("promotions"."scope" = 'ALL') = ("promotions"."scope_value" IS NULL)),
	CONSTRAINT "promotions_window" CHECK("promotions"."ends_at" > "promotions"."starts_at")
);
--> statement-breakpoint
CREATE INDEX `promotions_active_idx` ON `promotions` (`is_active`,`starts_at`,`ends_at`);--> statement-breakpoint
ALTER TABLE `two_factor` ADD `verified` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `two_factor` ADD `failed_verification_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `two_factor` ADD `locked_until` integer;--> statement-breakpoint
CREATE INDEX `two_factor_secret_idx` ON `two_factor` (`secret`);--> statement-breakpoint
ALTER TABLE `products` ADD `category_id` text;--> statement-breakpoint
ALTER TABLE `products` ADD `feature_tags` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `is_featured` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `is_featured_hero` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `sale_price_pkr` real;--> statement-breakpoint
ALTER TABLE `products` ADD `sale_starts_at` text;--> statement-breakpoint
ALTER TABLE `products` ADD `sale_ends_at` text;--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);
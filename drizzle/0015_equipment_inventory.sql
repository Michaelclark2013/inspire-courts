CREATE TABLE `equipment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sku` text,
	`category` text DEFAULT 'other' NOT NULL,
	`location` text,
	`on_hand` integer DEFAULT 0 NOT NULL,
	`min_quantity` integer DEFAULT 0 NOT NULL,
	`unit_cost_cents` integer,
	`supplier` text,
	`supplier_sku` text,
	`last_restocked_at` text,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `equipment_category_idx` ON `equipment` (`category`);--> statement-breakpoint
CREATE INDEX `equipment_active_idx` ON `equipment` (`active`);--> statement-breakpoint
CREATE TABLE `equipment_stock_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`equipment_id` integer NOT NULL,
	`type` text NOT NULL,
	`delta` integer NOT NULL,
	`balance_after` integer NOT NULL,
	`notes` text,
	`recorded_by` integer,
	`occurred_at` text NOT NULL,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `equipment_stock_movements_eq_idx` ON `equipment_stock_movements` (`equipment_id`);--> statement-breakpoint
CREATE INDEX `equipment_stock_movements_occ_idx` ON `equipment_stock_movements` (`occurred_at`);
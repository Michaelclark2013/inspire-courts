CREATE TABLE `resource_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resource_id` integer NOT NULL,
	`renter_user_id` integer,
	`renter_name` text,
	`renter_email` text,
	`renter_phone` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`status` text DEFAULT 'tentative' NOT NULL,
	`amount_cents` integer DEFAULT 0 NOT NULL,
	`paid` integer DEFAULT false NOT NULL,
	`payment_method` text,
	`odometer_start` integer,
	`odometer_end` integer,
	`fuel_start` text,
	`fuel_end` text,
	`purpose` text,
	`notes` text,
	`created_by` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`renter_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `resource_bookings_resource_idx` ON `resource_bookings` (`resource_id`);--> statement-breakpoint
CREATE INDEX `resource_bookings_start_idx` ON `resource_bookings` (`start_at`);--> statement-breakpoint
CREATE INDEX `resource_bookings_status_idx` ON `resource_bookings` (`status`);--> statement-breakpoint
CREATE INDEX `resource_bookings_renter_user_idx` ON `resource_bookings` (`renter_user_id`);--> statement-breakpoint
CREATE TABLE `resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'vehicle' NOT NULL,
	`description` text,
	`daily_rate_cents` integer,
	`hourly_rate_cents` integer,
	`license_plate` text,
	`capacity` integer,
	`active` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `resources_kind_idx` ON `resources` (`kind`);--> statement-breakpoint
CREATE INDEX `resources_active_idx` ON `resources` (`active`);--> statement-breakpoint
CREATE TABLE `shift_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shift_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`status` text DEFAULT 'assigned' NOT NULL,
	`pay_rate_cents_override` integer,
	`bonus_cents` integer DEFAULT 0 NOT NULL,
	`assigned_by` integer,
	`assigned_at` text NOT NULL,
	`responded_at` text,
	`notes` text,
	FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `shift_assignments_shift_idx` ON `shift_assignments` (`shift_id`);--> statement-breakpoint
CREATE INDEX `shift_assignments_user_idx` ON `shift_assignments` (`user_id`);--> statement-breakpoint
CREATE INDEX `shift_assignments_status_idx` ON `shift_assignments` (`status`);--> statement-breakpoint
CREATE INDEX `shift_assignments_unique_idx` ON `shift_assignments` (`shift_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tournament_id` integer,
	`title` text NOT NULL,
	`role` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`courts` text,
	`required_headcount` integer DEFAULT 1 NOT NULL,
	`notes` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `shifts_start_at_idx` ON `shifts` (`start_at`);--> statement-breakpoint
CREATE INDEX `shifts_status_idx` ON `shifts` (`status`);--> statement-breakpoint
CREATE INDEX `shifts_tournament_idx` ON `shifts` (`tournament_id`);
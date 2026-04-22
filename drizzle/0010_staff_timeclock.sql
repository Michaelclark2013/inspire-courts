CREATE TABLE `staff_profiles` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`employment_classification` text DEFAULT 'cash_no_1099' NOT NULL,
	`payment_method` text DEFAULT 'venmo' NOT NULL,
	`pay_rate_cents` integer DEFAULT 0 NOT NULL,
	`pay_rate_type` text DEFAULT 'hourly' NOT NULL,
	`role_tags` text DEFAULT '' NOT NULL,
	`payout_handle` text,
	`hire_date` text,
	`emergency_contact_json` text,
	`notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `staff_profiles_status_idx` ON `staff_profiles` (`status`);--> statement-breakpoint
CREATE INDEX `staff_profiles_classification_idx` ON `staff_profiles` (`employment_classification`);--> statement-breakpoint
CREATE TABLE `time_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`clock_in_at` text NOT NULL,
	`clock_out_at` text,
	`source` text DEFAULT 'kiosk' NOT NULL,
	`clock_in_lat` text,
	`clock_in_lng` text,
	`clock_out_lat` text,
	`clock_out_lng` text,
	`break_minutes` integer DEFAULT 0 NOT NULL,
	`tournament_id` integer,
	`role` text,
	`pay_rate_cents` integer DEFAULT 0 NOT NULL,
	`pay_rate_type` text DEFAULT 'hourly' NOT NULL,
	`bonus_cents` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`status` text DEFAULT 'open' NOT NULL,
	`approved_by` integer,
	`approved_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `time_entries_user_idx` ON `time_entries` (`user_id`);--> statement-breakpoint
CREATE INDEX `time_entries_status_idx` ON `time_entries` (`status`);--> statement-breakpoint
CREATE INDEX `time_entries_clock_in_idx` ON `time_entries` (`clock_in_at`);--> statement-breakpoint
CREATE INDEX `time_entries_open_idx` ON `time_entries` (`clock_out_at`);--> statement-breakpoint
CREATE INDEX `time_entries_tournament_idx` ON `time_entries` (`tournament_id`);
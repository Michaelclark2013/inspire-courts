CREATE TABLE `pay_periods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`locked_by` integer,
	`locked_at` text,
	`paid_at` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`locked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `pay_periods_starts_idx` ON `pay_periods` (`starts_at`);--> statement-breakpoint
CREATE INDEX `pay_periods_status_idx` ON `pay_periods` (`status`);
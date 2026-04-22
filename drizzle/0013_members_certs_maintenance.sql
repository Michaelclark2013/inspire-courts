CREATE TABLE `maintenance_tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`reported_by` integer,
	`assigned_to` integer,
	`resource_id` integer,
	`photo_urls` text,
	`vendor_name` text,
	`cost_cents` integer,
	`resolved_at` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `maintenance_tickets_status_idx` ON `maintenance_tickets` (`status`);--> statement-breakpoint
CREATE INDEX `maintenance_tickets_priority_idx` ON `maintenance_tickets` (`priority`);--> statement-breakpoint
CREATE INDEX `maintenance_tickets_assigned_idx` ON `maintenance_tickets` (`assigned_to`);--> statement-breakpoint
CREATE TABLE `member_visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`visited_at` text NOT NULL,
	`type` text DEFAULT 'open_gym' NOT NULL,
	`checked_in_by` integer,
	`notes` text,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`checked_in_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `member_visits_member_idx` ON `member_visits` (`member_id`);--> statement-breakpoint
CREATE INDEX `member_visits_visited_idx` ON `member_visits` (`visited_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text,
	`birth_date` text,
	`membership_plan_id` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`source` text DEFAULT 'walk_in' NOT NULL,
	`joined_at` text NOT NULL,
	`next_renewal_at` text,
	`auto_renew` integer DEFAULT true NOT NULL,
	`payment_method` text,
	`emergency_contact_json` text,
	`primary_member_id` integer,
	`notes` text,
	`created_by` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`membership_plan_id`) REFERENCES `membership_plans`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `members_status_idx` ON `members` (`status`);--> statement-breakpoint
CREATE INDEX `members_plan_idx` ON `members` (`membership_plan_id`);--> statement-breakpoint
CREATE INDEX `members_next_renewal_idx` ON `members` (`next_renewal_at`);--> statement-breakpoint
CREATE INDEX `members_email_idx` ON `members` (`email`);--> statement-breakpoint
CREATE INDEX `members_phone_idx` ON `members` (`phone`);--> statement-breakpoint
CREATE INDEX `members_primary_idx` ON `members` (`primary_member_id`);--> statement-breakpoint
CREATE TABLE `membership_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'unlimited' NOT NULL,
	`description` text,
	`price_monthly_cents` integer,
	`price_annual_cents` integer,
	`price_once_cents` integer,
	`includes` text DEFAULT '' NOT NULL,
	`max_visits_per_month` integer,
	`max_visits_per_week` integer,
	`active` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `membership_plans_active_idx` ON `membership_plans` (`active`);--> statement-breakpoint
CREATE TABLE `staff_certifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text DEFAULT 'other' NOT NULL,
	`label` text,
	`issued_at` text,
	`expires_at` text,
	`document_url` text,
	`verified_by` integer,
	`verified_at` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `staff_certifications_user_idx` ON `staff_certifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `staff_certifications_expires_idx` ON `staff_certifications` (`expires_at`);--> statement-breakpoint
CREATE INDEX `staff_certifications_type_idx` ON `staff_certifications` (`type`);
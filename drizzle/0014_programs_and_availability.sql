CREATE TABLE `program_registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`member_id` integer,
	`user_id` integer,
	`participant_name` text NOT NULL,
	`participant_email` text,
	`participant_phone` text,
	`guardian_name` text,
	`guardian_phone` text,
	`waiver_signed_at` text,
	`status` text DEFAULT 'registered' NOT NULL,
	`paid` integer DEFAULT false NOT NULL,
	`amount_cents` integer,
	`payment_method` text,
	`notes` text,
	`registered_by` integer,
	`registered_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `program_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`registered_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `program_registrations_session_idx` ON `program_registrations` (`session_id`);--> statement-breakpoint
CREATE INDEX `program_registrations_member_idx` ON `program_registrations` (`member_id`);--> statement-breakpoint
CREATE INDEX `program_registrations_status_idx` ON `program_registrations` (`status`);--> statement-breakpoint
CREATE TABLE `program_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`program_id` integer NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`instructor_user_id` integer,
	`location` text,
	`capacity_override` integer,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`instructor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `program_sessions_program_idx` ON `program_sessions` (`program_id`);--> statement-breakpoint
CREATE INDEX `program_sessions_starts_idx` ON `program_sessions` (`starts_at`);--> statement-breakpoint
CREATE INDEX `program_sessions_status_idx` ON `program_sessions` (`status`);--> statement-breakpoint
CREATE INDEX `program_sessions_instructor_idx` ON `program_sessions` (`instructor_user_id`);--> statement-breakpoint
CREATE TABLE `programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'camp' NOT NULL,
	`description` text,
	`min_age` integer,
	`max_age` integer,
	`capacity_per_session` integer,
	`price_cents` integer,
	`tags` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_by` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `programs_type_idx` ON `programs` (`type`);--> statement-breakpoint
CREATE INDEX `programs_active_idx` ON `programs` (`active`);--> statement-breakpoint
CREATE TABLE `staff_availability` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`weekday` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`effective_from` text,
	`effective_to` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `staff_availability_user_idx` ON `staff_availability` (`user_id`);--> statement-breakpoint
CREATE INDEX `staff_availability_weekday_idx` ON `staff_availability` (`weekday`);--> statement-breakpoint
CREATE TABLE `time_off_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`type` text DEFAULT 'pto' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reason` text,
	`approved_by` integer,
	`approved_at` text,
	`denial_reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `time_off_requests_user_idx` ON `time_off_requests` (`user_id`);--> statement-breakpoint
CREATE INDEX `time_off_requests_status_idx` ON `time_off_requests` (`status`);--> statement-breakpoint
CREATE INDEX `time_off_requests_start_idx` ON `time_off_requests` (`start_date`);
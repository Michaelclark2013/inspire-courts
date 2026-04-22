ALTER TABLE `waivers` ADD `signature_data_url` text;--> statement-breakpoint
ALTER TABLE `waivers` ADD `signed_by_name` text;--> statement-breakpoint
ALTER TABLE `waivers` ADD `expires_at` text;--> statement-breakpoint
ALTER TABLE `waivers` ADD `waiver_type` text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE `waivers` ADD `program_id` integer;--> statement-breakpoint
ALTER TABLE `waivers` ADD `member_id` integer;--> statement-breakpoint
ALTER TABLE `waivers` ADD `waiver_version` text;--> statement-breakpoint
ALTER TABLE `waivers` ADD `signed_user_agent` text;--> statement-breakpoint
ALTER TABLE `waivers` ADD `signed_ip` text;--> statement-breakpoint
CREATE INDEX `waivers_expires_idx` ON `waivers` (`expires_at`);--> statement-breakpoint
CREATE INDEX `waivers_member_idx` ON `waivers` (`member_id`);--> statement-breakpoint
CREATE INDEX `waivers_program_idx` ON `waivers` (`program_id`);
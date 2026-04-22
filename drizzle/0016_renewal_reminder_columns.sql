ALTER TABLE `members` ADD `renewal_reminder_sent_at` text;--> statement-breakpoint
ALTER TABLE `members` ADD `paused_until` text;--> statement-breakpoint
CREATE INDEX `members_paused_until_idx` ON `members` (`paused_until`);
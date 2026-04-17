CREATE TABLE `push_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`user_email` text,
	`user_role` text,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
ALTER TABLE `tournament_teams` ADD `players` text;--> statement-breakpoint
CREATE INDEX `announcements_audience_idx` ON `announcements` (`audience`);--> statement-breakpoint
CREATE INDEX `checkins_team_idx` ON `checkins` (`team_name`);--> statement-breakpoint
CREATE INDEX `checkins_timestamp_idx` ON `checkins` (`timestamp`);--> statement-breakpoint
CREATE INDEX `waivers_email_idx` ON `waivers` (`email`);--> statement-breakpoint
CREATE INDEX `waivers_team_idx` ON `waivers` (`team_name`);
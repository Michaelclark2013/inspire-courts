CREATE TABLE `announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`audience` text DEFAULT 'all' NOT NULL,
	`created_by` integer,
	`expires_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `checkins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_name` text NOT NULL,
	`team_name` text NOT NULL,
	`division` text,
	`type` text DEFAULT 'checkin' NOT NULL,
	`checked_in_by` integer,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`checked_in_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reset_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reset_tokens_token_unique` ON `reset_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `tournament_games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tournament_id` integer NOT NULL,
	`game_id` integer NOT NULL,
	`round` text,
	`bracket_position` integer,
	`pool_group` text,
	`winner_advances_to` integer,
	`loser_drops_to` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tournament_registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tournament_id` integer NOT NULL,
	`team_name` text NOT NULL,
	`coach_name` text NOT NULL,
	`coach_email` text NOT NULL,
	`coach_phone` text,
	`division` text,
	`player_count` integer,
	`entry_fee` integer,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`square_payment_id` text,
	`square_order_id` text,
	`square_checkout_url` text,
	`roster_submitted` integer DEFAULT false,
	`waivers_signed` integer DEFAULT false,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `registrations_tournament_idx` ON `tournament_registrations` (`tournament_id`);--> statement-breakpoint
CREATE INDEX `registrations_order_idx` ON `tournament_registrations` (`square_order_id`);--> statement-breakpoint
CREATE INDEX `registrations_payment_status_idx` ON `tournament_registrations` (`payment_status`);--> statement-breakpoint
CREATE TABLE `tournament_teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tournament_id` integer NOT NULL,
	`team_id` integer,
	`team_name` text NOT NULL,
	`division` text,
	`seed` integer,
	`pool_group` text,
	`eliminated` integer DEFAULT false,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tournament_teams_tournament_idx` ON `tournament_teams` (`tournament_id`);--> statement-breakpoint
CREATE INDEX `tournament_teams_unique_idx` ON `tournament_teams` (`tournament_id`,`team_name`,`division`);--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`location` text,
	`format` text DEFAULT 'single_elim' NOT NULL,
	`divisions` text,
	`courts` text,
	`game_length` integer DEFAULT 40,
	`break_length` integer DEFAULT 10,
	`status` text DEFAULT 'draft' NOT NULL,
	`entry_fee` integer,
	`max_teams_per_division` integer,
	`registration_deadline` text,
	`registration_open` integer DEFAULT false,
	`require_waivers` integer DEFAULT true,
	`require_payment` integer DEFAULT true,
	`description` text,
	`created_by` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tournaments_status_idx` ON `tournaments` (`status`);--> statement-breakpoint
CREATE INDEX `tournaments_start_date_idx` ON `tournaments` (`start_date`);--> statement-breakpoint
CREATE TABLE `waivers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_name` text NOT NULL,
	`parent_name` text,
	`team_name` text,
	`email` text,
	`phone` text,
	`signed_at` text NOT NULL,
	`drive_doc_id` text
);
--> statement-breakpoint
CREATE INDEX `game_scores_game_id_idx` ON `game_scores` (`game_id`);--> statement-breakpoint
CREATE INDEX `games_status_idx` ON `games` (`status`);--> statement-breakpoint
CREATE INDEX `games_scheduled_time_idx` ON `games` (`scheduled_time`);
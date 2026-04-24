-- Play events, live-collab sessions, final-scoreboard photo.

ALTER TABLE `games` ADD COLUMN `final_scoreboard_photo_url` text;
--> statement-breakpoint
ALTER TABLE `games` ADD COLUMN `finalized_by` integer REFERENCES `users`(`id`) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE `games` ADD COLUMN `finalized_at` text;
--> statement-breakpoint

CREATE TABLE `play_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `game_id` integer NOT NULL,
  `team` text NOT NULL,
  `play_type` text NOT NULL,
  `points` integer DEFAULT 0 NOT NULL,
  `player_id` integer,
  `player_jersey` integer,
  `player_name` text,
  `quarter` text,
  `voided` integer DEFAULT 0 NOT NULL,
  `voided_at` text,
  `recorded_by` integer,
  `recorded_at` text NOT NULL,
  FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `play_events_game_idx` ON `play_events` (`game_id`);
--> statement-breakpoint
CREATE INDEX `play_events_player_idx` ON `play_events` (`player_id`);
--> statement-breakpoint
CREATE INDEX `play_events_recorded_idx` ON `play_events` (`recorded_at`);
--> statement-breakpoint
CREATE INDEX `play_events_voided_idx` ON `play_events` (`voided`);
--> statement-breakpoint

CREATE TABLE `active_scoring_sessions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `game_id` integer NOT NULL,
  `user_id` integer NOT NULL,
  `started_at` text NOT NULL,
  `last_heartbeat_at` text NOT NULL,
  FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `active_scoring_game_idx` ON `active_scoring_sessions` (`game_id`);
--> statement-breakpoint
CREATE INDEX `active_scoring_user_idx` ON `active_scoring_sessions` (`user_id`);
--> statement-breakpoint
CREATE INDEX `active_scoring_heartbeat_idx` ON `active_scoring_sessions` (`last_heartbeat_at`);

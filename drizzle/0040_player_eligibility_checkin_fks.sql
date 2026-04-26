-- Player eligibility + check-in foreign keys + photos + roster lock + late flag.
-- All columns nullable / defaulted so existing rows backfill cleanly.

ALTER TABLE `players` ADD COLUMN `birth_date` text;
ALTER TABLE `players` ADD COLUMN `grade` text;
ALTER TABLE `players` ADD COLUMN `waiver_on_file` integer NOT NULL DEFAULT 0;
ALTER TABLE `players` ADD COLUMN `photo_url` text;

CREATE INDEX `players_team_idx` ON `players` (`team_id`);
CREATE INDEX `players_parent_idx` ON `players` (`parent_user_id`);

ALTER TABLE `checkins` ADD COLUMN `player_id` integer REFERENCES `players`(`id`) ON DELETE set null;
ALTER TABLE `checkins` ADD COLUMN `tournament_id` integer REFERENCES `tournaments`(`id`) ON DELETE set null;
ALTER TABLE `checkins` ADD COLUMN `source` text;
ALTER TABLE `checkins` ADD COLUMN `is_late` integer NOT NULL DEFAULT 0;

CREATE INDEX `checkins_player_idx` ON `checkins` (`player_id`);
CREATE INDEX `checkins_tournament_idx` ON `checkins` (`tournament_id`);

ALTER TABLE `tournaments` ADD COLUMN `roster_lock_hours_before` integer NOT NULL DEFAULT 24;

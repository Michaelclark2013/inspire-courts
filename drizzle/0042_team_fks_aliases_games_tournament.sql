-- Pass A: kill string-matching across teams/games/registrations.

ALTER TABLE `tournament_registrations` ADD COLUMN `team_id` integer
  REFERENCES `teams`(`id`) ON DELETE set null;
CREATE INDEX `tournament_registrations_team_id_idx`
  ON `tournament_registrations` (`team_id`);

ALTER TABLE `games` ADD COLUMN `tournament_id` integer
  REFERENCES `tournaments`(`id`) ON DELETE set null;
CREATE INDEX `games_tournament_idx` ON `games` (`tournament_id`);

CREATE TABLE `team_aliases` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `team_id` integer NOT NULL,
  `alias` text NOT NULL,
  `source` text NOT NULL DEFAULT 'registration',
  `created_at` text NOT NULL,
  FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade
);
CREATE INDEX `team_aliases_alias_idx` ON `team_aliases` (`alias`);
CREATE INDEX `team_aliases_team_idx` ON `team_aliases` (`team_id`);

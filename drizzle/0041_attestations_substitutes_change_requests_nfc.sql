-- Coach attestations, substitutes, lock-window change requests, NFC.
-- Additive only.

ALTER TABLE `players` ADD COLUMN `nfc_uid` text;
CREATE UNIQUE INDEX `players_nfc_uid_unique` ON `players` (`nfc_uid`);

CREATE TABLE `roster_attestations` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `tournament_id` integer NOT NULL,
  `team_id` integer NOT NULL,
  `coach_user_id` integer,
  `signed_by_name` text NOT NULL,
  `signature_data_url` text,
  `roster_snapshot_json` text,
  `attested_at` text NOT NULL,
  FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON DELETE cascade,
  FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade,
  FOREIGN KEY (`coach_user_id`) REFERENCES `users`(`id`) ON DELETE set null
);
CREATE INDEX `attestations_tournament_team_idx` ON `roster_attestations` (`tournament_id`, `team_id`);

CREATE TABLE `roster_substitutes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `source_player_id` integer NOT NULL,
  `host_team_id` integer NOT NULL,
  `tournament_id` integer,
  `added_by` integer,
  `approved_by` integer,
  `approved_at` text,
  `status` text NOT NULL DEFAULT 'pending',
  `notes` text,
  `created_at` text NOT NULL,
  FOREIGN KEY (`source_player_id`) REFERENCES `players`(`id`) ON DELETE cascade,
  FOREIGN KEY (`host_team_id`) REFERENCES `teams`(`id`) ON DELETE cascade,
  FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON DELETE set null,
  FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON DELETE set null,
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE set null
);
CREATE INDEX `substitutes_host_idx` ON `roster_substitutes` (`host_team_id`, `tournament_id`);
CREATE INDEX `substitutes_source_idx` ON `roster_substitutes` (`source_player_id`);

CREATE TABLE `roster_change_requests` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `team_id` integer NOT NULL,
  `tournament_id` integer,
  `requested_by` integer,
  `kind` text NOT NULL,
  `payload_json` text,
  `reason` text,
  `status` text NOT NULL DEFAULT 'pending',
  `decided_by` integer,
  `decided_at` text,
  `decision_note` text,
  `created_at` text NOT NULL,
  FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade,
  FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON DELETE set null,
  FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE set null,
  FOREIGN KEY (`decided_by`) REFERENCES `users`(`id`) ON DELETE set null
);
CREATE INDEX `change_requests_team_idx` ON `roster_change_requests` (`team_id`, `status`);
CREATE INDEX `change_requests_tournament_idx` ON `roster_change_requests` (`tournament_id`, `status`);

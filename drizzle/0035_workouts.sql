-- Workout tracking + leaderboards
CREATE TABLE `workouts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `score_type` text NOT NULL,
  `lower_is_better` integer DEFAULT 0 NOT NULL,
  `category` text,
  `active` integer DEFAULT 1 NOT NULL,
  `created_at` text NOT NULL
);
CREATE INDEX `workouts_active_idx` ON `workouts` (`active`);

CREATE TABLE `workout_results` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `workout_id` integer NOT NULL,
  `member_id` integer,
  `user_id` integer,
  `score_numeric` integer NOT NULL,
  `score_note` text,
  `score_display` text,
  `performed_at` text NOT NULL,
  `verified_by` integer,
  `created_at` text NOT NULL,
  FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON DELETE cascade,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade,
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE set null
);
CREATE INDEX `workout_results_workout_idx` ON `workout_results` (`workout_id`);
CREATE INDEX `workout_results_member_idx` ON `workout_results` (`member_id`);
CREATE INDEX `workout_results_user_idx` ON `workout_results` (`user_id`);
CREATE INDEX `workout_results_score_idx` ON `workout_results` (`score_numeric`);
CREATE INDEX `workout_results_performed_idx` ON `workout_results` (`performed_at`);

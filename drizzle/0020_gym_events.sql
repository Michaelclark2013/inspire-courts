CREATE TABLE `gym_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `title` text NOT NULL,
  `category` text DEFAULT 'other' NOT NULL,
  `location` text,
  `start_at` text NOT NULL,
  `end_at` text NOT NULL,
  `all_day` integer DEFAULT 0,
  `notes` text,
  `created_by` integer,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `gym_events_start_at_idx` ON `gym_events` (`start_at`);
--> statement-breakpoint
CREATE INDEX `gym_events_category_idx` ON `gym_events` (`category`);

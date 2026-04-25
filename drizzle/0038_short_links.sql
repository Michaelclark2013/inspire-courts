-- Short links — branded redirect system for SMS / QR / email campaigns.
CREATE TABLE `short_links` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `destination` text NOT NULL,
  `label` text,
  `active` integer DEFAULT 1 NOT NULL,
  `click_count` integer DEFAULT 0 NOT NULL,
  `created_by` integer,
  `created_at` text NOT NULL,
  `expires_at` text,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null
);
CREATE INDEX `short_links_slug_idx` ON `short_links` (`slug`);
CREATE INDEX `short_links_active_idx` ON `short_links` (`active`);

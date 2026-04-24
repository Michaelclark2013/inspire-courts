-- Reusable permission bundles. Admin saves a template once then
-- applies it to any number of users in a single click.
CREATE TABLE `permission_templates` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `pages_json` text DEFAULT '[]' NOT NULL,
  `default_duration_days` integer,
  `created_by` integer,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `permission_templates_name_idx` ON `permission_templates` (`name`);

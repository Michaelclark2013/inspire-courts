-- Per-user permission overrides. Layer on top of the role-based
-- PAGE_ACCESS defaults so admin can grant or revoke access to a
-- specific page for a specific user without changing their role.
CREATE TABLE `user_permissions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL,
  `page` text NOT NULL,
  `granted` integer NOT NULL,
  `reason` text,
  `granted_by` integer,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `user_permissions_user_idx` ON `user_permissions` (`user_id`);
--> statement-breakpoint
CREATE INDEX `user_permissions_page_idx` ON `user_permissions` (`page`);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_permissions_user_page_uniq` ON `user_permissions` (`user_id`, `page`);

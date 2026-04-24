-- Optional auto-expiry on per-user permission overrides. Lets admin
-- grant access for just a tournament weekend and have it lapse back
-- to the role default automatically.
ALTER TABLE `user_permissions` ADD COLUMN `expires_at` text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_permissions_expires_idx` ON `user_permissions` (`expires_at`);

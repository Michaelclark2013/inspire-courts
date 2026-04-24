-- Notification preferences per user. JSON blob so new channels can
-- be added without migrations. null = opt-in to everything.
ALTER TABLE `users` ADD COLUMN `notification_prefs_json` text;

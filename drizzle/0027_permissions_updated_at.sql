-- Stamped whenever a user's permission overrides change, so the JWT
-- callback can re-hydrate cached overrides on the next request
-- instead of waiting for login or explicit session.update().
ALTER TABLE `users` ADD COLUMN `permissions_updated_at` text;

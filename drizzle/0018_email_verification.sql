-- Email verification — ported from OFF SZN (R780).
--
-- Adds three columns to the users table:
--   email_verified_at      — ISO timestamp when the user clicked the
--                             verification link. NULL = unverified.
--   email_verify_token      — 32-byte random hex (64 chars). Unique so
--                             a bad RNG fails noisily at INSERT time.
--                             Cleared on successful verify.
--   email_verify_expires_at — ISO timestamp when the token stops being
--                             accepted. Default 24h after issue.
--
-- Backfill: any existing user at the time of this migration is marked
-- verified-as-of-now. Without this, flipping the verify gate on would
-- immediately lock out every coach/parent who registered before today.

ALTER TABLE `users` ADD COLUMN `email_verified_at` text;
ALTER TABLE `users` ADD COLUMN `email_verify_token` text;
ALTER TABLE `users` ADD COLUMN `email_verify_expires_at` text;

CREATE UNIQUE INDEX IF NOT EXISTS `users_email_verify_token_unique` ON `users` (`email_verify_token`);

UPDATE `users`
  SET `email_verified_at` = CURRENT_TIMESTAMP
  WHERE `email_verified_at` IS NULL;

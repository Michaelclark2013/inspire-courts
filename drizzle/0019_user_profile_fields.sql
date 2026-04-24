-- User profile fact-check fields.
--
-- Adds enough columns to the users table that admins can verify
-- age-group eligibility, reach someone in an emergency, and run
-- regional reports. All nullable so the migration is safe against
-- existing rows.
--
-- profile_complete is computed on write by the profile PATCH handler —
-- set to 1 once birth_date + emergency_contact_* are all populated.
-- Sensitive actions (waiver sign, tournament register, member visit)
-- can gate on this flag without re-inspecting individual fields.

ALTER TABLE `users` ADD COLUMN `birth_date` text;
ALTER TABLE `users` ADD COLUMN `emergency_contact_name` text;
ALTER TABLE `users` ADD COLUMN `emergency_contact_phone` text;
ALTER TABLE `users` ADD COLUMN `address_line` text;
ALTER TABLE `users` ADD COLUMN `city` text;
ALTER TABLE `users` ADD COLUMN `state` text;
ALTER TABLE `users` ADD COLUMN `postal_code` text;
ALTER TABLE `users` ADD COLUMN `profile_complete` integer DEFAULT 0;

-- Admin accounts + env-fallback admin are always "complete" — they
-- don't need eligibility checking and we don't want to nag them.
UPDATE `users` SET `profile_complete` = 1 WHERE `role` = 'admin';

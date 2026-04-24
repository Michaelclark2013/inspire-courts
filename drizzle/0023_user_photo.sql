-- Profile photo URL for users. Required at registration for staff/ref
-- so admin can verify identity before approving the account.
ALTER TABLE `users` ADD COLUMN `photo_url` text;

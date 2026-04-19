CREATE INDEX `registrations_status_idx` ON `tournament_registrations` (`status`);--> statement-breakpoint
CREATE INDEX `registrations_coach_email_idx` ON `tournament_registrations` (`coach_email`);--> statement-breakpoint
CREATE INDEX `users_approved_idx` ON `users` (`approved`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);
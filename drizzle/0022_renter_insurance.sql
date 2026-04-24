-- Per-rental renter insurance, registration, license photo, additional driver.
ALTER TABLE `resource_bookings` ADD COLUMN `renter_license_photo_url` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `renter_insurance_provider` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `renter_insurance_policy_number` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `renter_insurance_expiry` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `renter_insurance_photo_url` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `renter_registration_number` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `renter_registration_state` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `renter_registration_expiry` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `declined_collision_waiver` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `additional_driver_name` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `additional_driver_license` text;

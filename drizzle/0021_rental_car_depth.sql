-- Expand resources into a proper rental-car fleet record.
ALTER TABLE `resources` ADD COLUMN `weekly_rate_cents` integer;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `monthly_rate_cents` integer;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `mileage_included_per_day` integer;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `mileage_overage_cents_per_mile` integer;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `late_fee_cents_per_hour` integer;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `security_deposit_cents` integer;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `vin` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `make` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `model` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `year` integer;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `color` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `transmission` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `fuel_type` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `seats` integer;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `current_mileage` integer;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `registration_expiry` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `insurance_provider` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `insurance_policy_number` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `insurance_expiry` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `vehicle_status` text DEFAULT 'available' NOT NULL;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `next_oil_change_mileage` integer;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `next_inspection_at` text;
--> statement-breakpoint
ALTER TABLE `resources` ADD COLUMN `image_url` text;
--> statement-breakpoint

-- Expand resource_bookings into a full rental contract record.
ALTER TABLE `resource_bookings` ADD COLUMN `contract_number` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `renter_license_number` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `renter_license_state` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `renter_license_expiry` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `checkout_at` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `checkin_at` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `checkout_photo_urls` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `checkin_photo_urls` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `signature_url` text;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `mileage_driven` integer;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `mileage_overage_cents` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `fuel_charge_cents` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `late_fee_cents` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `damage_charge_cents` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `total_cents` integer;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `security_deposit_cents` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `deposit_released` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `resource_bookings` ADD COLUMN `deposit_released_at` text;
--> statement-breakpoint

-- Maintenance log
CREATE TABLE `resource_maintenance` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `resource_id` integer NOT NULL,
  `type` text DEFAULT 'other' NOT NULL,
  `description` text NOT NULL,
  `mileage_at` integer,
  `cost_cents` integer DEFAULT 0,
  `vendor` text,
  `performed_at` text NOT NULL,
  `next_service_mileage` integer,
  `notes` text,
  `recorded_by` integer,
  `created_at` text NOT NULL,
  FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `resource_maintenance_resource_idx` ON `resource_maintenance` (`resource_id`);
--> statement-breakpoint
CREATE INDEX `resource_maintenance_performed_idx` ON `resource_maintenance` (`performed_at`);
--> statement-breakpoint

-- Damage log
CREATE TABLE `resource_damage` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `resource_id` integer NOT NULL,
  `booking_id` integer,
  `severity` text DEFAULT 'cosmetic' NOT NULL,
  `description` text NOT NULL,
  `location` text,
  `photo_urls` text,
  `repair_cost_cents` integer,
  `repaired` integer DEFAULT 0 NOT NULL,
  `repaired_at` text,
  `reported_at` text NOT NULL,
  `reported_by` integer,
  `notes` text,
  FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`booking_id`) REFERENCES `resource_bookings`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `resource_damage_resource_idx` ON `resource_damage` (`resource_id`);
--> statement-breakpoint
CREATE INDEX `resource_damage_booking_idx` ON `resource_damage` (`booking_id`);
--> statement-breakpoint
CREATE INDEX `resource_damage_repaired_idx` ON `resource_damage` (`repaired`);

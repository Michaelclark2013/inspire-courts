-- SMS + journey automation
CREATE TABLE `sms_messages` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `member_id` integer,
  `user_id` integer,
  `phone` text NOT NULL,
  `direction` text NOT NULL,
  `body` text NOT NULL,
  `status` text DEFAULT 'queued' NOT NULL,
  `twilio_sid` text,
  `error_code` text,
  `error_message` text,
  `thread_key` text,
  `journey_id` integer,
  `journey_step_id` integer,
  `sent_by` integer,
  `created_at` text NOT NULL,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE set null,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null,
  FOREIGN KEY (`sent_by`) REFERENCES `users`(`id`) ON DELETE set null
);
CREATE INDEX `sms_member_idx` ON `sms_messages` (`member_id`);
CREATE INDEX `sms_phone_idx` ON `sms_messages` (`phone`);
CREATE INDEX `sms_thread_idx` ON `sms_messages` (`thread_key`);
CREATE INDEX `sms_created_idx` ON `sms_messages` (`created_at`);

CREATE TABLE `sms_opt_outs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `phone` text NOT NULL UNIQUE,
  `reason` text,
  `created_at` text NOT NULL
);
CREATE INDEX `sms_optout_phone_idx` ON `sms_opt_outs` (`phone`);

CREATE TABLE `journeys` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `trigger` text DEFAULT 'manual' NOT NULL,
  `active` integer DEFAULT 1 NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE TABLE `journey_steps` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `journey_id` integer NOT NULL,
  `ordering` integer DEFAULT 0 NOT NULL,
  `channel` text DEFAULT 'sms' NOT NULL,
  `body` text NOT NULL,
  `subject` text,
  `delay_hours` integer DEFAULT 0 NOT NULL,
  `skip_if_events` text,
  FOREIGN KEY (`journey_id`) REFERENCES `journeys`(`id`) ON DELETE cascade
);
CREATE INDEX `journey_steps_journey_idx` ON `journey_steps` (`journey_id`);

CREATE TABLE `journey_enrollments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `journey_id` integer NOT NULL,
  `member_id` integer NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `next_step_ordering` integer DEFAULT 0 NOT NULL,
  `next_fire_at` text,
  `halted_by_reply_at` text,
  `started_at` text NOT NULL,
  `completed_at` text,
  FOREIGN KEY (`journey_id`) REFERENCES `journeys`(`id`) ON DELETE cascade,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade
);
CREATE INDEX `journey_enrollments_member_idx` ON `journey_enrollments` (`member_id`);
CREATE INDEX `journey_enrollments_journey_idx` ON `journey_enrollments` (`journey_id`);
CREATE INDEX `journey_enrollments_fire_idx` ON `journey_enrollments` (`next_fire_at`);
CREATE INDEX `journey_enrollments_status_idx` ON `journey_enrollments` (`status`);

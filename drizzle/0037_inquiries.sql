-- Inquiries — lead-capture engine for the public site (no self-booking).
CREATE TABLE `inquiries` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `kind` text DEFAULT 'general' NOT NULL,
  `status` text DEFAULT 'new' NOT NULL,
  `name` text NOT NULL,
  `email` text,
  `phone` text,
  `details_json` text,
  `message` text,
  `sports` text,
  `source` text,
  `page_url` text,
  `sla_due_at` text,
  `assigned_to` integer,
  `first_touch_at` text,
  `closed_at` text,
  `close_reason` text,
  `submitted_ip` text,
  `submitted_ua` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE set null
);
CREATE INDEX `inquiries_kind_idx` ON `inquiries` (`kind`);
CREATE INDEX `inquiries_status_idx` ON `inquiries` (`status`);
CREATE INDEX `inquiries_assigned_idx` ON `inquiries` (`assigned_to`);
CREATE INDEX `inquiries_sla_idx` ON `inquiries` (`sla_due_at`);
CREATE INDEX `inquiries_created_idx` ON `inquiries` (`created_at`);

CREATE TABLE `inquiry_notes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `inquiry_id` integer NOT NULL,
  `author_user_id` integer,
  `body` text NOT NULL,
  `kind` text DEFAULT 'note',
  `created_at` text NOT NULL,
  FOREIGN KEY (`inquiry_id`) REFERENCES `inquiries`(`id`) ON DELETE cascade,
  FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON DELETE set null
);
CREATE INDEX `inquiry_notes_inquiry_idx` ON `inquiry_notes` (`inquiry_id`);

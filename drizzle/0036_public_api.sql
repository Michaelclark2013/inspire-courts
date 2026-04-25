-- Public API + webhooks
CREATE TABLE `api_keys` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `label` text NOT NULL,
  `key_hash` text NOT NULL UNIQUE,
  `prefix` text NOT NULL,
  `scopes` text DEFAULT 'read' NOT NULL,
  `created_by` integer,
  `last_used_at` text,
  `revoked_at` text,
  `expires_at` text,
  `created_at` text NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null
);
CREATE INDEX `api_keys_hash_idx` ON `api_keys` (`key_hash`);
CREATE INDEX `api_keys_revoked_idx` ON `api_keys` (`revoked_at`);

CREATE TABLE `webhook_subscriptions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `url` text NOT NULL,
  `events` text DEFAULT '*' NOT NULL,
  `secret` text NOT NULL,
  `active` integer DEFAULT 1 NOT NULL,
  `created_by` integer,
  `last_delivery_at` text,
  `last_delivery_status` integer,
  `failure_count` integer DEFAULT 0 NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null
);
CREATE INDEX `webhook_subs_active_idx` ON `webhook_subscriptions` (`active`);

CREATE TABLE `webhook_deliveries` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `subscription_id` integer NOT NULL,
  `event_type` text NOT NULL,
  `payload` text NOT NULL,
  `attempted_at` text NOT NULL,
  `status` integer,
  `response_body` text,
  `error_message` text,
  `attempt_number` integer DEFAULT 1 NOT NULL,
  FOREIGN KEY (`subscription_id`) REFERENCES `webhook_subscriptions`(`id`) ON DELETE cascade
);
CREATE INDEX `webhook_deliveries_sub_idx` ON `webhook_deliveries` (`subscription_id`);
CREATE INDEX `webhook_deliveries_attempted_idx` ON `webhook_deliveries` (`attempted_at`);

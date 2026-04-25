-- Recurring billing engine — subscriptions, payment methods, invoices.
-- Drives the SaaS-tier moneymaker: lifecycle states, dunning retries,
-- per-charge audit trail.

ALTER TABLE `members` ADD COLUMN `square_customer_id` text;

CREATE TABLE `subscriptions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `member_id` integer NOT NULL,
  `plan_id` integer NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `interval` text DEFAULT 'monthly' NOT NULL,
  `price_cents` integer NOT NULL,
  `trial_ends_at` text,
  `current_period_start` text NOT NULL,
  `current_period_end` text NOT NULL,
  `payment_method_id` integer,
  `failed_attempts` integer DEFAULT 0 NOT NULL,
  `last_charge_at` text,
  `last_charge_status` text,
  `next_retry_at` text,
  `cancelled_at` text,
  `cancel_reason` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade,
  FOREIGN KEY (`plan_id`) REFERENCES `membership_plans`(`id`) ON DELETE restrict
);

CREATE INDEX `subscriptions_member_idx` ON `subscriptions` (`member_id`);
CREATE INDEX `subscriptions_status_idx` ON `subscriptions` (`status`);
CREATE INDEX `subscriptions_period_end_idx` ON `subscriptions` (`current_period_end`);
CREATE INDEX `subscriptions_retry_idx` ON `subscriptions` (`next_retry_at`);

CREATE TABLE `payment_methods` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `member_id` integer NOT NULL,
  `square_customer_id` text NOT NULL,
  `square_card_id` text NOT NULL,
  `brand` text,
  `last4` text,
  `exp_month` integer,
  `exp_year` integer,
  `cardholder_name` text,
  `is_default` integer DEFAULT 1 NOT NULL,
  `disabled_at` text,
  `created_at` text NOT NULL,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade
);

CREATE INDEX `payment_methods_member_idx` ON `payment_methods` (`member_id`);
CREATE INDEX `payment_methods_square_card_idx` ON `payment_methods` (`square_card_id`);

CREATE TABLE `invoices` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `member_id` integer NOT NULL,
  `subscription_id` integer,
  `amount_cents` integer NOT NULL,
  `currency` text DEFAULT 'USD' NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `period_start` text,
  `period_end` text,
  `square_payment_id` text,
  `square_receipt_url` text,
  `failure_code` text,
  `failure_message` text,
  `attempted_at` text,
  `paid_at` text,
  `refunded_at` text,
  `created_at` text NOT NULL,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade,
  FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE set null
);

CREATE INDEX `invoices_member_idx` ON `invoices` (`member_id`);
CREATE INDEX `invoices_subscription_idx` ON `invoices` (`subscription_id`);
CREATE INDEX `invoices_status_idx` ON `invoices` (`status`);
CREATE INDEX `invoices_paid_at_idx` ON `invoices` (`paid_at`);

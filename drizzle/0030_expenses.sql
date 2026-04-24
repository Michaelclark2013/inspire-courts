-- Expense tracking counterweight to revenue so the dashboard can
-- show actual profit margin instead of top-line receipts.
CREATE TABLE `expenses` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `description` text NOT NULL,
  `category` text DEFAULT 'other' NOT NULL,
  `amount_cents` integer NOT NULL,
  `vendor` text,
  `payment_method` text,
  `incurred_at` text NOT NULL,
  `receipt_url` text,
  `tax_deductible` integer DEFAULT 1,
  `resource_id` integer,
  `notes` text,
  `created_by` integer,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE set null,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `expenses_category_idx` ON `expenses` (`category`);
--> statement-breakpoint
CREATE INDEX `expenses_incurred_idx` ON `expenses` (`incurred_at`);
--> statement-breakpoint
CREATE INDEX `expenses_vendor_idx` ON `expenses` (`vendor`);

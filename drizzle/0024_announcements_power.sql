-- Beef up announcements: priority, category, pinning, scheduled
-- publish, CTA button, image, push tracking, view count.
ALTER TABLE `announcements` ADD COLUMN `priority` text DEFAULT 'normal' NOT NULL;
--> statement-breakpoint
ALTER TABLE `announcements` ADD COLUMN `category` text DEFAULT 'general' NOT NULL;
--> statement-breakpoint
ALTER TABLE `announcements` ADD COLUMN `pinned` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `announcements` ADD COLUMN `scheduled_publish_at` text;
--> statement-breakpoint
ALTER TABLE `announcements` ADD COLUMN `cta_label` text;
--> statement-breakpoint
ALTER TABLE `announcements` ADD COLUMN `cta_url` text;
--> statement-breakpoint
ALTER TABLE `announcements` ADD COLUMN `image_url` text;
--> statement-breakpoint
ALTER TABLE `announcements` ADD COLUMN `push_sent` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `announcements` ADD COLUMN `push_sent_at` text;
--> statement-breakpoint
ALTER TABLE `announcements` ADD COLUMN `view_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `announcements` ADD COLUMN `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `announcements_priority_idx` ON `announcements` (`priority`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `announcements_pinned_idx` ON `announcements` (`pinned`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `announcements_scheduled_idx` ON `announcements` (`scheduled_publish_at`);

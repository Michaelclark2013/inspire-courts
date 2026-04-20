CREATE TABLE `site_content` (
	`page_id` text PRIMARY KEY NOT NULL,
	`content_json` text NOT NULL,
	`label` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` integer,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);

-- In-app direct messaging — staff↔staff and admin↔portal users.

CREATE TABLE `conversations` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `last_message_at` text NOT NULL,
  `last_message_preview` text,
  `last_message_sender_id` integer,
  `created_by` integer,
  `created_at` text NOT NULL,
  FOREIGN KEY (`last_message_sender_id`) REFERENCES `users`(`id`) ON DELETE set null,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null
);
CREATE INDEX `conversations_last_msg_idx` ON `conversations` (`last_message_at`);

CREATE TABLE `conversation_participants` (
  `conversation_id` integer NOT NULL,
  `user_id` integer NOT NULL,
  `last_read_at` text,
  `joined_at` text NOT NULL,
  PRIMARY KEY (`conversation_id`, `user_id`),
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE cascade,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);
CREATE INDEX `conv_participants_conv_idx` ON `conversation_participants` (`conversation_id`);
CREATE INDEX `conv_participants_user_idx` ON `conversation_participants` (`user_id`);

CREATE TABLE `messages` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `conversation_id` integer NOT NULL,
  `sender_user_id` integer NOT NULL,
  `body` text NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE cascade,
  FOREIGN KEY (`sender_user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);
CREATE INDEX `messages_conv_idx` ON `messages` (`conversation_id`, `created_at`);
CREATE INDEX `messages_sender_idx` ON `messages` (`sender_user_id`);

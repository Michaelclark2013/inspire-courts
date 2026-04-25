-- Churn risk scoring — daily-computed score per member.
CREATE TABLE `member_risk_scores` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `member_id` integer NOT NULL UNIQUE,
  `score` integer DEFAULT 0 NOT NULL,
  `tier` text DEFAULT 'low' NOT NULL,
  `primary_reason` text,
  `days_since_last_visit` integer,
  `visits_trend` integer,
  `is_past_due` integer DEFAULT 0 NOT NULL,
  `tenure_days` integer,
  `dismissed_until` text,
  `computed_at` text NOT NULL,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE cascade
);

CREATE INDEX `member_risk_score_idx` ON `member_risk_scores` (`score`);
CREATE INDEX `member_risk_tier_idx` ON `member_risk_scores` (`tier`);
CREATE INDEX `member_risk_dismissed_idx` ON `member_risk_scores` (`dismissed_until`);

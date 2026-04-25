import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ── Users ───────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "staff", "ref", "front_desk", "coach", "parent"] })
    .notNull()
    .default("coach"),
  phone: text("phone"),
  approved: integer("approved", { mode: "boolean" }).default(true), // staff/ref need admin approval
  memberSince: text("member_since"), // Year they started (e.g. "2022") — for loyalty badge
  // Profile photo URL — required for staff/ref accounts so admin can
  // verify identity at time of approval. Also shown in /admin/roster.
  photoUrl: text("photo_url"),
  // ── Profile fact-check fields ───────────────────────────────────
  // YYYY-MM-DD birth date. Required for age-group eligibility checks
  // on tournament registration (can't register an athlete as 12U if
  // their DOB says they're 14). Stored as a plain ISO date string to
  // avoid timezone arithmetic surprises.
  birthDate: text("birth_date"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  // Postal address — used for reports + age-group league affiliation
  // (e.g. regional tournaments that scope to certain zip ranges).
  addressLine: text("address_line"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  // Marks the profile as "enough info to fact-check" — set true when
  // birthDate + emergency contact are both filled. Actions that need a
  // verified profile (waiver sign, tournament register) gate on this.
  profileComplete: integer("profile_complete", { mode: "boolean" }).default(false),
  // Bumped whenever this user's permission overrides change. The JWT
  // callback compares this ISO timestamp to the token's cached value
  // and re-hydrates on mismatch, so admin-side changes take effect
  // on the next request without forcing a re-login.
  permissionsUpdatedAt: text("permissions_updated_at"),
  // JSON blob of notification preferences. Keeps the column count
  // sane as we add new channels.
  //   { email: { announcements, gameReminders, weekly },
  //     push:  { announcements, gameReminders } }
  // null = opt-in to everything by default.
  notificationPrefsJson: text("notification_prefs_json"),
  // ── Email verification (R780 port from OFF SZN) ─────────────────
  // Null = unverified; ISO timestamp = verified at that moment.
  // Sensitive actions gate on isVerified(user) from lib/email-verification.
  emailVerifiedAt: text("email_verified_at"),
  // 32-byte random hex token (64 chars). Unique so a bad RNG surfaces
  // as a constraint violation instead of silently dupeing. Cleared on
  // successful verify so links become one-use.
  emailVerifyToken: text("email_verify_token").unique(),
  // 24-hour default TTL — expired tokens return a specific error so
  // the UI can offer a resend affordance.
  emailVerifyExpiresAt: text("email_verify_expires_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  // Admin approvals endpoint filters by approved=false — previously a
  // full-table scan on every poll of /api/admin/approvals.
  index("users_approved_idx").on(table.approved),
  index("users_role_idx").on(table.role),
]);

// ── Teams ───────────────────────────────────────────────────────────────────

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  division: text("division"),
  season: text("season"),
  coachUserId: integer("coach_user_id").references(() => users.id),
  sheetsTeamName: text("sheets_team_name"), // links to Google Sheets "Team Name" column
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── Players ─────────────────────────────────────────────────────────────────

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  parentUserId: integer("parent_user_id").references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  division: text("division"),
  jerseyNumber: text("jersey_number"),
  memberSince: text("member_since"), // Year they started playing with us
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── Games ───────────────────────────────────────────────────────────────────

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  division: text("division"),
  court: text("court"),
  eventName: text("event_name"),
  scheduledTime: text("scheduled_time"),
  status: text("status", { enum: ["scheduled", "live", "final"] })
    .notNull()
    .default("scheduled"),
  // Scorekeeper's photo of the physical scoreboard at final — ends
  // disputes. Base64 data URL (capped ~200KB client-side) OR an
  // external https:// URL (e.g. Drive link).
  finalScoreboardPhotoUrl: text("final_scoreboard_photo_url"),
  // Who finalized + when — separate from gameScores.updated_by because
  // status transitions and score rows happen in the same txn and this
  // is the authoritative "game over" stamp.
  finalizedBy: integer("finalized_by").references(() => users.id, {
    onDelete: "set null",
  }),
  finalizedAt: text("finalized_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("games_status_idx").on(table.status),
  index("games_scheduled_time_idx").on(table.scheduledTime),
]);

// ── Password Reset Tokens ───────────────────────────────────────────────────

export const resetTokens = sqliteTable("reset_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── Game Scores ─────────────────────────────────────────────────────────────

export const gameScores = sqliteTable("game_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id),
  homeScore: integer("home_score").notNull().default(0),
  awayScore: integer("away_score").notNull().default(0),
  quarter: text("quarter"), // "1", "2", "3", "4", "OT", or "final"
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("game_scores_game_id_idx").on(table.gameId),
]);

// ── Tournaments ─────────────────────────────────────────────────────────────

export const tournaments = sqliteTable("tournaments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  location: text("location"),
  format: text("format", {
    enum: ["single_elim", "double_elim", "round_robin", "pool_play"],
  })
    .notNull()
    .default("single_elim"),
  divisions: text("divisions"), // JSON array e.g. '["8U","10U","12U"]'
  courts: text("courts"), // JSON array e.g. '["Court 1","Court 2"]'
  gameLength: integer("game_length").default(40), // minutes
  breakLength: integer("break_length").default(10), // minutes between games
  status: text("status", {
    enum: ["draft", "published", "active", "completed"],
  })
    .notNull()
    .default("draft"),
  // Registration fields
  entryFee: integer("entry_fee"), // in cents (e.g. 5000 = $50)
  maxTeamsPerDivision: integer("max_teams_per_division"),
  registrationDeadline: text("registration_deadline"), // ISO date
  registrationOpen: integer("registration_open", { mode: "boolean" }).default(false),
  requireWaivers: integer("require_waivers", { mode: "boolean" }).default(true),
  requirePayment: integer("require_payment", { mode: "boolean" }).default(true),
  description: text("description"), // tournament rules / info
  createdBy: integer("created_by").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("tournaments_status_idx").on(table.status),
  index("tournaments_start_date_idx").on(table.startDate),
]);

// ── Tournament Teams ────────────────────────────────────────────────────────

export const tournamentTeams = sqliteTable("tournament_teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id),
  teamId: integer("team_id").references(() => teams.id),
  teamName: text("team_name").notNull(),
  division: text("division"),
  seed: integer("seed"),
  poolGroup: text("pool_group"), // "A", "B", "C", etc.
  eliminated: integer("eliminated", { mode: "boolean" }).default(false),
  players: text("players"), // JSON array: [{name, jersey}]
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("tournament_teams_tournament_idx").on(table.tournamentId),
  index("tournament_teams_unique_idx").on(table.tournamentId, table.teamName, table.division),
]);

// ── Tournament Games (bracket links) ────────────────────────────────────────

export const tournamentGames = sqliteTable("tournament_games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id),
  round: text("round"), // "1","2","QF","SF","F"
  bracketPosition: integer("bracket_position"), // slot in bracket
  poolGroup: text("pool_group"),
  winnerAdvancesTo: integer("winner_advances_to"), // self-ref tournament_games.id
  loserDropsTo: integer("loser_drops_to"), // for double-elim
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ── Tournament Registrations ────────────────────────────────────────────────

export const tournamentRegistrations = sqliteTable("tournament_registrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id),
  teamName: text("team_name").notNull(),
  coachName: text("coach_name").notNull(),
  coachEmail: text("coach_email").notNull(),
  coachPhone: text("coach_phone"),
  division: text("division"),
  playerCount: integer("player_count"),
  entryFee: integer("entry_fee"), // cents — snapshot at time of registration
  paymentStatus: text("payment_status", {
    enum: ["pending", "paid", "refunded", "waived"],
  })
    .notNull()
    .default("pending"),
  squarePaymentId: text("square_payment_id"),
  squareOrderId: text("square_order_id"),
  squareCheckoutUrl: text("square_checkout_url"),
  rosterSubmitted: integer("roster_submitted", { mode: "boolean" }).default(false),
  waiversSigned: integer("waivers_signed", { mode: "boolean" }).default(false),
  status: text("status", {
    enum: ["pending", "approved", "rejected", "waitlisted"],
  })
    .notNull()
    .default("pending"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("registrations_tournament_idx").on(table.tournamentId),
  index("registrations_order_idx").on(table.squareOrderId),
  index("registrations_payment_status_idx").on(table.paymentStatus),
  // Admin filters by status (?status=pending|approved|rejected) — previously
  // full-table scans.
  index("registrations_status_idx").on(table.status),
  // Audit-log lookups + "find a coach's registrations" need this.
  index("registrations_coach_email_idx").on(table.coachEmail),
]);

// ── Check-Ins ───────────────────────────────────────────────────────────────

export const checkins = sqliteTable("checkins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerName: text("player_name").notNull(),
  teamName: text("team_name").notNull(),
  division: text("division"),
  // "no_show" lets front-desk staff explicitly mark a team as absent with
  // forfeiture instead of leaving the slot ambiguous (not-yet-checked-in).
  type: text("type", { enum: ["checkin", "waiver", "no_show"] })
    .notNull()
    .default("checkin"),
  checkedInBy: integer("checked_in_by").references(() => users.id),
  timestamp: text("timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("checkins_team_idx").on(table.teamName),
  index("checkins_timestamp_idx").on(table.timestamp),
]);

// ── Waivers ─────────────────────────────────────────────────────────────────

export const waivers = sqliteTable("waivers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerName: text("player_name").notNull(),
  parentName: text("parent_name"),
  teamName: text("team_name"),
  email: text("email"),
  phone: text("phone"),
  signedAt: text("signed_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  driveDocId: text("drive_doc_id"),
  // ── Waiver 2.0 fields (all nullable for backwards compat) ──
  // E-signature capture: base64 PNG data URL of the drawn
  // signature. Small (~5-20KB typical), stored inline so liability
  // evidence is always with the record. Typed name kept as a
  // fallback / legal reinforcement.
  signatureDataUrl: text("signature_data_url"),
  signedByName: text("signed_by_name"),
  // Expiration: most gym waivers expire annually. Cron flags anyone
  // whose waiver lapses so front desk re-prompts on next check-in.
  expiresAt: text("expires_at"),
  // Kind helps separate general gym waivers from program-specific
  // (Jiu Jitsu combat waiver) and tournament-specific ones.
  waiverType: text("waiver_type", {
    enum: ["general", "program", "tournament", "rental", "other"],
  })
    .notNull()
    .default("general"),
  // Optional link to a program (if waiverType=program) so the
  // program registration flow can check waiver coverage.
  programId: integer("program_id"),
  // Optional link to a member for fast per-member lookup.
  memberId: integer("member_id"),
  // Document version — bump when waiver text changes so we can
  // see which rev each person signed.
  waiverVersion: text("waiver_version"),
  // User-agent + IP at sign time = liability evidence.
  signedUserAgent: text("signed_user_agent"),
  signedIp: text("signed_ip"),
}, (table) => [
  index("waivers_email_idx").on(table.email),
  index("waivers_team_idx").on(table.teamName),
  index("waivers_expires_idx").on(table.expiresAt),
  index("waivers_member_idx").on(table.memberId),
  index("waivers_program_idx").on(table.programId),
]);

// ── Announcements ───────────────────────────────────────────────────────────

export const ANNOUNCEMENT_PRIORITIES = ["normal", "important", "urgent"] as const;
export const ANNOUNCEMENT_CATEGORIES = [
  "general",
  "tournament",
  "schedule",
  "maintenance",
  "safety",
  "weather",
  "celebration",
] as const;

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  audience: text("audience").notNull().default("all"), // "all", "coaches", "parents", or division like "14U"
  priority: text("priority", { enum: ANNOUNCEMENT_PRIORITIES })
    .notNull()
    .default("normal"),
  category: text("category", { enum: ANNOUNCEMENT_CATEGORIES })
    .notNull()
    .default("general"),
  // Pinned posts stick to the top of the portal feed regardless of date.
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  // When null, publishes immediately. When set, surfaces as "Scheduled"
  // in admin until that time, then becomes visible.
  scheduledPublishAt: text("scheduled_publish_at"),
  // Action button on the announcement card (e.g. "View schedule").
  ctaLabel: text("cta_label"),
  ctaUrl: text("cta_url"),
  // Optional hero image URL (drive link or uploaded asset).
  imageUrl: text("image_url"),
  // Has a push notification been sent? Admin can "re-broadcast" if needed.
  pushSent: integer("push_sent", { mode: "boolean" }).notNull().default(false),
  pushSentAt: text("push_sent_at"),
  // Lightweight impression counter — incremented by the portal feed
  // endpoint when the post enters a user's list.
  viewCount: integer("view_count").notNull().default(0),
  createdBy: integer("created_by").references(() => users.id),
  expiresAt: text("expires_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("announcements_audience_idx").on(table.audience),
  index("announcements_priority_idx").on(table.priority),
  index("announcements_pinned_idx").on(table.pinned),
  index("announcements_scheduled_idx").on(table.scheduledPublishAt),
]);

// ── Push Subscriptions ─────────────────────────────────────────────────────

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id"),
  userEmail: text("user_email"),
  userRole: text("user_role"),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ── Audit Log ──────────────────────────────────────────────────────────────
// Append-only log of admin-level mutations. Purpose: answer "who changed X
// and when" for role changes, approvals, deletions, and any other sensitive
// admin operation. Entries are never edited or deleted.

export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Who did the action — user.id of the admin performing it (nullable if
  // session.user.id is unavailable, though that should never happen for
  // admin routes).
  actorUserId: integer("actor_user_id"),
  actorEmail: text("actor_email"),
  actorRole: text("actor_role"),
  // What happened — free-form short slug like "user.role_changed",
  // "user.approved", "user.rejected", "user.deleted", "registration.bulk_update".
  action: text("action").notNull(),
  // Which entity — table name + id combo so we can reconstruct later.
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  // Before/after snapshot as JSON — enough to revert if needed.
  beforeJson: text("before_json"),
  afterJson: text("after_json"),
  // Request fingerprint — captured for security investigations (e.g.
  // "was this admin action taken from an unusual IP after a credential
  // theft?"). All nullable because non-request call sites may exist.
  actorIp: text("actor_ip"),
  actorUserAgent: text("actor_user_agent"),
  // Per-request correlation id from middleware (X-Request-Id). Joins
  // audit entries to the server logs + client error reports for the
  // same request.
  requestId: text("request_id"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("audit_log_actor_idx").on(table.actorUserId),
  index("audit_log_entity_idx").on(table.entityType, table.entityId),
  index("audit_log_created_idx").on(table.createdAt),
]);

// Site content — one row per page. `content_json` holds the full
// PageContent blob (sections + fields + list items) so the
// /admin/content editor can round-trip a page in one update.
//
// Why not the filesystem? The previous content.ts persisted to a
// local content.json via fs.writeFileSync, which silently no-ops on
// Vercel's read-only serverless filesystem — every save in production
// was being dropped. Moving to the DB makes admin edits actually stick
// across requests + deploys.
export const siteContent = sqliteTable("site_content", {
  pageId: text("page_id").primaryKey(),
  contentJson: text("content_json").notNull(),
  label: text("label").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedBy: integer("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

// ── Phase 1: Staff + Time Clock ──────────────────────────────────────
// Replaces the Google Sheets check-out flow. Every time entry links to
// a user (FK), which gives real join-able reporting instead of name
// string-matching. `staff_profiles` extends `users` with employment
// metadata so a single person can be a coach AND get paid as a ref
// without duplicating rows.

// Employment classification — drives tax-form logic without dictating
// payment method. "cash_no_1099" is an explicit bucket for under-$600
// informal pay that doesn't trigger a 1099-NEC. The YTD aggregate is
// surfaced in the admin list so a worker approaching $600 is visible
// before they cross the threshold.
export const EMPLOYMENT_CLASSIFICATIONS = [
  "w2",
  "1099",
  "cash_no_1099",
  "volunteer",
  "stipend",
] as const;

// Payment method is orthogonal to classification — a W2 employee can
// get paid via direct deposit while a cash_no_1099 ref gets Venmo.
export const PAYMENT_METHODS = [
  "direct_deposit",
  "check",
  "cash",
  "venmo",
  "zelle",
  "paypal",
  "other",
] as const;

// Pay rate type — hourly (default), per_shift (flat rate for a game-day
// shift regardless of length), per_game (refs paid per whistled game),
// salary (biweekly fixed), stipend (flat one-off).
export const PAY_RATE_TYPES = [
  "hourly",
  "per_shift",
  "per_game",
  "salary",
  "stipend",
] as const;

export const staffProfiles = sqliteTable("staff_profiles", {
  // 1:1 with users so session-based auth Just Works. Any user_id
  // without a staff_profiles row is "not on the staff roster" —
  // parents/coaches/players never get one.
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  employmentClassification: text("employment_classification", {
    enum: EMPLOYMENT_CLASSIFICATIONS,
  })
    .notNull()
    .default("cash_no_1099"),
  paymentMethod: text("payment_method", { enum: PAYMENT_METHODS })
    .notNull()
    .default("venmo"),
  payRateCents: integer("pay_rate_cents").notNull().default(0),
  payRateType: text("pay_rate_type", { enum: PAY_RATE_TYPES })
    .notNull()
    .default("hourly"),
  // Role tags as a comma-separated list — lets one person be a
  // ref + scorekeeper + front desk without three rows. Intentionally
  // not a JSON array so SQLite LIKE-searches stay cheap.
  roleTags: text("role_tags").notNull().default(""),
  // Payout handle (Venmo @, Zelle email/phone, check-payable-to, etc.)
  // kept in a single field since it mirrors paymentMethod.
  payoutHandle: text("payout_handle"),
  hireDate: text("hire_date"),
  emergencyContactJson: text("emergency_contact_json"),
  notes: text("notes"),
  status: text("status", { enum: ["active", "on_leave", "terminated"] })
    .notNull()
    .default("active"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("staff_profiles_status_idx").on(table.status),
  index("staff_profiles_classification_idx").on(table.employmentClassification),
]);

// Clock-in source — kiosk runs at the facility front-desk tablet,
// mobile is the PWA from a worker's phone (geo-fenced), manual is an
// admin-keyed retroactive entry (e.g. tablet was offline).
export const TIME_ENTRY_SOURCES = ["kiosk", "mobile", "manual"] as const;

export const timeEntries = sqliteTable("time_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Nullable: an open entry (user clocked in, hasn't clocked out).
  // Queries for "who is on the clock now?" = clockOutAt IS NULL.
  clockInAt: text("clock_in_at").notNull(),
  clockOutAt: text("clock_out_at"),
  source: text("source", { enum: TIME_ENTRY_SOURCES })
    .notNull()
    .default("kiosk"),
  // Geo stamps — stored as text (ISO-style) so we don't pay the
  // double-precision real overhead; precision to ~5 decimals is
  // enough for a 1m-radius facility fence.
  clockInLat: text("clock_in_lat"),
  clockInLng: text("clock_in_lng"),
  clockOutLat: text("clock_out_lat"),
  clockOutLng: text("clock_out_lng"),
  // Unpaid break in minutes. Default 0; admin can edit during
  // approval if the worker forgot to log their break.
  breakMinutes: integer("break_minutes").notNull().default(0),
  // Optional shift context — a tournament day with multiple refs
  // on one tournament benefits from grouping entries by event.
  tournamentId: integer("tournament_id").references(() => tournaments.id, {
    onDelete: "set null",
  }),
  role: text("role"), // "ref" / "front_desk" / etc — snapshot of which hat they were wearing
  // Rate snapshot at clock-in. If the staff_profiles rate changes
  // later, already-logged entries stay priced at their original
  // rate (this is how you prevent accidental retroactive re-pricing).
  payRateCents: integer("pay_rate_cents").notNull().default(0),
  payRateType: text("pay_rate_type", { enum: PAY_RATE_TYPES })
    .notNull()
    .default("hourly"),
  // Optional per-entry bonus (tournament referee bonus, late-night
  // differential). Admin sets at approval time.
  bonusCents: integer("bonus_cents").notNull().default(0),
  notes: text("notes"),
  // Approval flow: open → pending → approved. Payroll roll-ups in
  // Phase 3 will only count approved entries.
  status: text("status", { enum: ["open", "pending", "approved", "rejected"] })
    .notNull()
    .default("open"),
  approvedBy: integer("approved_by").references(() => users.id, {
    onDelete: "set null",
  }),
  approvedAt: text("approved_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("time_entries_user_idx").on(table.userId),
  index("time_entries_status_idx").on(table.status),
  index("time_entries_clock_in_idx").on(table.clockInAt),
  // "Who is on the clock right now" query hits this index.
  index("time_entries_open_idx").on(table.clockOutAt),
  index("time_entries_tournament_idx").on(table.tournamentId),
]);

// ── Phase 2: Shift Scheduling ────────────────────────────────────────
// Shifts are the planned version of what eventually shows up in
// time_entries. One shift can be assigned to multiple workers
// (required_headcount > 1) via shift_assignments. Leaving shifts
// unassigned lets admins publish an "open shift" that staff can claim.

export const SHIFT_STATUS = ["draft", "published", "cancelled", "completed"] as const;

export const shifts = sqliteTable("shifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Optional: link a shift to a tournament so the schedule page can
  // show "Memorial Day Classic: 6 shifts, 4 filled". Nullable because
  // non-tournament shifts (front-desk weekday coverage) exist too.
  tournamentId: integer("tournament_id").references(() => tournaments.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  // Primary role the shift covers (ref, scorekeeper, front_desk, etc.).
  // Staff with this role tag get priority in the open-shift board.
  role: text("role"),
  startAt: text("start_at").notNull(),
  endAt: text("end_at").notNull(),
  // Comma-sep court ids / labels where applicable. Kept as text for
  // the same reason role_tags is — LIKE queries stay cheap.
  courts: text("courts"),
  requiredHeadcount: integer("required_headcount").notNull().default(1),
  notes: text("notes"),
  status: text("status", { enum: SHIFT_STATUS }).notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("shifts_start_at_idx").on(table.startAt),
  index("shifts_status_idx").on(table.status),
  index("shifts_tournament_idx").on(table.tournamentId),
]);

export const SHIFT_ASSIGNMENT_STATUS = [
  "assigned",
  "confirmed",
  "declined",
  "no_show",
  "completed",
] as const;

export const shiftAssignments = sqliteTable("shift_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shiftId: integer("shift_id")
    .notNull()
    .references(() => shifts.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: SHIFT_ASSIGNMENT_STATUS })
    .notNull()
    .default("assigned"),
  // Optional per-shift rate override (e.g. tournament bonus pay for
  // a specific day). Null means "use the worker's staff_profile rate".
  payRateCentsOverride: integer("pay_rate_cents_override"),
  bonusCents: integer("bonus_cents").notNull().default(0),
  assignedBy: integer("assigned_by").references(() => users.id, {
    onDelete: "set null",
  }),
  assignedAt: text("assigned_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  respondedAt: text("responded_at"),
  notes: text("notes"),
}, (table) => [
  index("shift_assignments_shift_idx").on(table.shiftId),
  index("shift_assignments_user_idx").on(table.userId),
  index("shift_assignments_status_idx").on(table.status),
  // Prevent the same worker from being double-booked on one shift.
  index("shift_assignments_unique_idx").on(table.shiftId, table.userId),
]);

// ── Resources & Bookings (admin-only) ────────────────────────────────
// Generalized so the team van is the first resource but equipment
// (projectors, scoreboards) and court blocks for external rental
// can share the same table.

export const RESOURCE_KINDS = [
  "vehicle",
  "equipment",
  "court",
  "room",
  "other",
] as const;

export const VEHICLE_STATUS = [
  "available",
  "rented",
  "maintenance",
  "out_of_service",
  "reserved",
] as const;

export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  kind: text("kind", { enum: RESOURCE_KINDS }).notNull().default("vehicle"),
  description: text("description"),
  // Full rate card — hourly, daily, weekly, monthly. All optional;
  // stored in cents. Mileage + late fees sit alongside.
  dailyRateCents: integer("daily_rate_cents"),
  hourlyRateCents: integer("hourly_rate_cents"),
  weeklyRateCents: integer("weekly_rate_cents"),
  monthlyRateCents: integer("monthly_rate_cents"),
  mileageIncludedPerDay: integer("mileage_included_per_day"),
  mileageOverageCentsPerMile: integer("mileage_overage_cents_per_mile"),
  lateFeeCentsPerHour: integer("late_fee_cents_per_hour"),
  securityDepositCents: integer("security_deposit_cents"),
  // Vehicle identity + spec. Nullable for non-vehicle rows.
  licensePlate: text("license_plate"),
  vin: text("vin"),
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  color: text("color"),
  transmission: text("transmission"),   // "automatic" | "manual"
  fuelType: text("fuel_type"),          // "gasoline" | "diesel" | "ev" | "hybrid"
  seats: integer("seats"),
  capacity: integer("capacity"),
  currentMileage: integer("current_mileage"),
  // Regulatory/legal compliance — expiries drive dashboard alerts.
  registrationExpiry: text("registration_expiry"),
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNumber: text("insurance_policy_number"),
  insuranceExpiry: text("insurance_expiry"),
  vehicleStatus: text("vehicle_status", { enum: VEHICLE_STATUS })
    .notNull()
    .default("available"),
  nextOilChangeMileage: integer("next_oil_change_mileage"),
  nextInspectionAt: text("next_inspection_at"),
  imageUrl: text("image_url"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("resources_kind_idx").on(table.kind),
  index("resources_active_idx").on(table.active),
]);

export const RESOURCE_BOOKING_STATUS = [
  "tentative",
  "confirmed",
  "in_use",
  "returned",
  "cancelled",
  "no_show",
] as const;

export const resourceBookings = sqliteTable("resource_bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  resourceId: integer("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  // Renter can be either an existing user (internal — a coach booking
  // the van for a team trip) or an external party (name/email/phone
  // without a user record). Both fields are present; at least one must
  // be populated (handler enforces).
  renterUserId: integer("renter_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  renterName: text("renter_name"),
  renterEmail: text("renter_email"),
  renterPhone: text("renter_phone"),
  startAt: text("start_at").notNull(),
  endAt: text("end_at").notNull(),
  status: text("status", { enum: RESOURCE_BOOKING_STATUS })
    .notNull()
    .default("tentative"),
  // Computed at create-time from the resource's rate + duration, but
  // stored so an admin can override without fighting recompute logic.
  amountCents: integer("amount_cents").notNull().default(0),
  paid: integer("paid", { mode: "boolean" }).notNull().default(false),
  paymentMethod: text("payment_method"),
  // Contract + driver capture. Printed contract number for paper
  // trail; driver's license is legally required for vehicle rentals.
  contractNumber: text("contract_number"),
  renterLicenseNumber: text("renter_license_number"),
  renterLicenseState: text("renter_license_state"),
  renterLicenseExpiry: text("renter_license_expiry"),
  renterLicensePhotoUrl: text("renter_license_photo_url"),
  // Renter's personal auto insurance — captured per-rental so the
  // rental company can verify coverage before handing over a vehicle.
  // Separate from the business's own insurance on the resources row.
  renterInsuranceProvider: text("renter_insurance_provider"),
  renterInsurancePolicyNumber: text("renter_insurance_policy_number"),
  renterInsuranceExpiry: text("renter_insurance_expiry"),
  renterInsurancePhotoUrl: text("renter_insurance_photo_url"),
  // Renter's vehicle registration (if using their own insurance to
  // cover this rental — some policies require it on file).
  renterRegistrationNumber: text("renter_registration_number"),
  renterRegistrationState: text("renter_registration_state"),
  renterRegistrationExpiry: text("renter_registration_expiry"),
  // Waiver: renter declined optional damage coverage offered by us.
  declinedCollisionWaiver: integer("declined_collision_waiver", { mode: "boolean" })
    .notNull()
    .default(false),
  // Secondary/additional driver — name only; licenses of extra drivers
  // go on a separate addendum that gets attached as a photo URL.
  additionalDriverName: text("additional_driver_name"),
  additionalDriverLicense: text("additional_driver_license"),
  // Vehicle checkout/checkin snapshots.
  odometerStart: integer("odometer_start"),
  odometerEnd: integer("odometer_end"),
  fuelStart: text("fuel_start"),
  fuelEnd: text("fuel_end"),
  checkoutAt: text("checkout_at"),
  checkinAt: text("checkin_at"),
  checkoutPhotoUrls: text("checkout_photo_urls"), // JSON array
  checkinPhotoUrls: text("checkin_photo_urls"),   // JSON array
  signatureUrl: text("signature_url"),
  // Computed fees — captured at checkin so a later rate change doesn't
  // retroactively alter a past booking's total.
  mileageDriven: integer("mileage_driven"),
  mileageOverageCents: integer("mileage_overage_cents").default(0),
  fuelChargeCents: integer("fuel_charge_cents").default(0),
  lateFeeCents: integer("late_fee_cents").default(0),
  damageChargeCents: integer("damage_charge_cents").default(0),
  totalCents: integer("total_cents"),
  // Security deposit hold + release.
  securityDepositCents: integer("security_deposit_cents").default(0),
  depositReleased: integer("deposit_released", { mode: "boolean" })
    .notNull()
    .default(false),
  depositReleasedAt: text("deposit_released_at"),
  purpose: text("purpose"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("resource_bookings_resource_idx").on(table.resourceId),
  index("resource_bookings_start_idx").on(table.startAt),
  index("resource_bookings_status_idx").on(table.status),
  index("resource_bookings_renter_user_idx").on(table.renterUserId),
]);

// ── Phase 3: Payroll ────────────────────────────────────────────────
// pay_periods defines the window; rollups are computed on the fly
// from approved time_entries inside that window. Once a period is
// locked, time entries that fall inside it can no longer be edited
// (enforced by the timeclock PATCH handler) — this is the "sign-off"
// gesture that prevents retroactive tampering after payroll runs.

export const PAY_PERIOD_STATUS = ["open", "locked", "paid"] as const;

export const payPeriods = sqliteTable("pay_periods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),            // "2026-04-01 → 2026-04-14"
  startsAt: text("starts_at").notNull(),     // inclusive
  endsAt: text("ends_at").notNull(),         // exclusive
  status: text("status", { enum: PAY_PERIOD_STATUS }).notNull().default("open"),
  lockedBy: integer("locked_by").references(() => users.id, {
    onDelete: "set null",
  }),
  lockedAt: text("locked_at"),
  paidAt: text("paid_at"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("pay_periods_starts_idx").on(table.startsAt),
  index("pay_periods_status_idx").on(table.status),
]);

// ── Members & Memberships ───────────────────────────────────────────
// The customer side of the gym — recurring members on monthly/annual
// plans. Separate from `users` (which is the auth/portal table) because
// many members never create an account; the front desk tracks them by
// name + phone + membership card. When a member DOES create an account,
// users.id is linked via the optional userId column.

export const MEMBERSHIP_PLAN_TYPES = [
  "unlimited",
  "single_sport",
  "family",
  "day_pass",
  "class_pack",
  "other",
] as const;

export const membershipPlans = sqliteTable("membership_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: MEMBERSHIP_PLAN_TYPES })
    .notNull()
    .default("unlimited"),
  description: text("description"),
  priceMonthlyCents: integer("price_monthly_cents"),
  priceAnnualCents: integer("price_annual_cents"),
  priceOnceCents: integer("price_once_cents"), // day pass / class pack
  // Included perks as a comma-separated tag list — matches the
  // role_tags pattern on staff_profiles for LIKE-search cheapness.
  includes: text("includes").notNull().default(""),
  // Visit caps; null = unlimited.
  maxVisitsPerMonth: integer("max_visits_per_month"),
  maxVisitsPerWeek: integer("max_visits_per_week"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("membership_plans_active_idx").on(table.active),
]);

export const MEMBER_STATUS = [
  "active",
  "paused",
  "past_due",
  "cancelled",
  "trial",
] as const;

export const MEMBER_SOURCES = [
  "website",
  "walk_in",
  "referral",
  "tournament",
  "instagram",
  "google",
  "other",
] as const;

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Optional user link — populated when the member creates a portal
  // account. Most members are front-desk-only and have no user row.
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  birthDate: text("birth_date"),
  membershipPlanId: integer("membership_plan_id").references(
    () => membershipPlans.id,
    { onDelete: "set null" }
  ),
  status: text("status", { enum: MEMBER_STATUS })
    .notNull()
    .default("active"),
  source: text("source", { enum: MEMBER_SOURCES }).notNull().default("walk_in"),
  joinedAt: text("joined_at").notNull(),
  // Next renewal date — front-desk surfaces "renewing this week" so
  // the card-on-file can be updated proactively before a failed charge.
  nextRenewalAt: text("next_renewal_at"),
  autoRenew: integer("auto_renew", { mode: "boolean" }).notNull().default(true),
  paymentMethod: text("payment_method"),
  emergencyContactJson: text("emergency_contact_json"),
  // Family plan linkage — primary member owns the plan, dependents
  // inherit. Null = standalone member.
  primaryMemberId: integer("primary_member_id"),
  // Square Customer object ID — created lazily the first time a member
  // adds a card or is charged. paymentMethods rows reference it via
  // squareCustomerId for redundancy.
  squareCustomerId: text("square_customer_id"),
  notes: text("notes"),
  // Stamped by the renewal-reminder cron so we don't re-email the
  // same person more than once per renewal cycle. Cleared when the
  // member's next_renewal_at is moved forward (handled in the PUT).
  renewalReminderSentAt: text("renewal_reminder_sent_at"),
  // Membership pause window — when set, member.status should be
  // "paused" and the cron auto-flips back to "active" on/after this
  // date. Clean separation from next_renewal_at.
  pausedUntil: text("paused_until"),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("members_status_idx").on(table.status),
  index("members_plan_idx").on(table.membershipPlanId),
  index("members_next_renewal_idx").on(table.nextRenewalAt),
  index("members_email_idx").on(table.email),
  index("members_phone_idx").on(table.phone),
  index("members_primary_idx").on(table.primaryMemberId),
  index("members_paused_until_idx").on(table.pausedUntil),
]);

export const MEMBER_VISIT_TYPES = [
  "open_gym",
  "class",
  "tournament",
  "private_training",
  "guest_pass",
  "other",
] as const;

export const memberVisits = sqliteTable("member_visits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  visitedAt: text("visited_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  type: text("type", { enum: MEMBER_VISIT_TYPES }).notNull().default("open_gym"),
  checkedInBy: integer("checked_in_by").references(() => users.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
}, (table) => [
  index("member_visits_member_idx").on(table.memberId),
  index("member_visits_visited_idx").on(table.visitedAt),
]);

// ── Staff Certifications (Phase 4) ──────────────────────────────────
// Expiring-cert alerts on the ops dashboard. Types kept as a loose
// enum so rare/one-off credentials (e.g. "AED renewal 2026") slot in.

export const CERTIFICATION_TYPES = [
  "cpr",
  "first_aid",
  "aed",
  "background_check",
  "ref_level_1",
  "ref_level_2",
  "ref_level_3",
  "coaching_license",
  "drivers_license",
  "w4",
  "i9",
  "other",
] as const;

export const staffCertifications = sqliteTable("staff_certifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: CERTIFICATION_TYPES })
    .notNull()
    .default("other"),
  label: text("label"), // optional human name ("Red Cross CPR — 2026")
  issuedAt: text("issued_at"),
  expiresAt: text("expires_at"),
  documentUrl: text("document_url"), // Drive / S3 link to the PDF
  verifiedBy: integer("verified_by").references(() => users.id, {
    onDelete: "set null",
  }),
  verifiedAt: text("verified_at"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("staff_certifications_user_idx").on(table.userId),
  index("staff_certifications_expires_idx").on(table.expiresAt),
  index("staff_certifications_type_idx").on(table.type),
]);

// ── Maintenance Tickets (Phase 4) ───────────────────────────────────
// Facility upkeep — broken hoops, leaking water fountains, HVAC
// calls, etc. Priority drives the ops-dashboard alert surface.

export const MAINTENANCE_PRIORITY = ["low", "medium", "high", "urgent"] as const;
export const MAINTENANCE_STATUS = [
  "open",
  "in_progress",
  "waiting_vendor",
  "resolved",
  "closed",
] as const;

export const maintenanceTickets = sqliteTable("maintenance_tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"), // "Court 3" / "Lobby" / "Men's locker room"
  priority: text("priority", { enum: MAINTENANCE_PRIORITY })
    .notNull()
    .default("medium"),
  status: text("status", { enum: MAINTENANCE_STATUS })
    .notNull()
    .default("open"),
  reportedBy: integer("reported_by").references(() => users.id, {
    onDelete: "set null",
  }),
  assignedTo: integer("assigned_to").references(() => users.id, {
    onDelete: "set null",
  }),
  // Optional link to the specific resource if the ticket is about
  // the team van, a specific scoreboard, etc.
  resourceId: integer("resource_id").references(() => resources.id, {
    onDelete: "set null",
  }),
  photoUrls: text("photo_urls"), // JSON array of uploaded photo URLs
  vendorName: text("vendor_name"),
  costCents: integer("cost_cents"),
  resolvedAt: text("resolved_at"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("maintenance_tickets_status_idx").on(table.status),
  index("maintenance_tickets_priority_idx").on(table.priority),
  index("maintenance_tickets_assigned_idx").on(table.assignedTo),
]);

// ── Programs / Classes / Camps ──────────────────────────────────────
// The umbrella for everything with sessions + enrollment: camps,
// clinics, leagues, open gym, private training, classes. A program
// is the template (e.g. "Summer Basketball Camp Week 1"); sessions
// are the individual slots; registrations are the enrolled players.

export const PROGRAM_TYPES = [
  "camp",
  "clinic",
  "league",
  "open_gym",
  "private_training",
  "class",
  "other",
] as const;

export const programs = sqliteTable("programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: PROGRAM_TYPES }).notNull().default("camp"),
  description: text("description"),
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  // Default capacity per session — individual sessions can override.
  capacityPerSession: integer("capacity_per_session"),
  priceCents: integer("price_cents"),
  // Comma-sep tags — beginner, intermediate, advanced, shooting, etc.
  tags: text("tags").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("programs_type_idx").on(table.type),
  index("programs_active_idx").on(table.active),
]);

export const PROGRAM_SESSION_STATUS = [
  "scheduled",
  "live",
  "completed",
  "cancelled",
] as const;

export const programSessions = sqliteTable("program_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  programId: integer("program_id")
    .notNull()
    .references(() => programs.id, { onDelete: "cascade" }),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  instructorUserId: integer("instructor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  // Location — free-form ("Court 3", "Turf", "Studio A") because we
  // don't have a locations table yet.
  location: text("location"),
  capacityOverride: integer("capacity_override"),
  status: text("status", { enum: PROGRAM_SESSION_STATUS })
    .notNull()
    .default("scheduled"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("program_sessions_program_idx").on(table.programId),
  index("program_sessions_starts_idx").on(table.startsAt),
  index("program_sessions_status_idx").on(table.status),
  index("program_sessions_instructor_idx").on(table.instructorUserId),
]);

export const PROGRAM_REGISTRATION_STATUS = [
  "registered",
  "waitlist",
  "attended",
  "no_show",
  "cancelled",
] as const;

export const programRegistrations = sqliteTable("program_registrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => programSessions.id, { onDelete: "cascade" }),
  // Flexible: can link to an existing member, an existing user, or
  // just be a free-form participant (walk-in camp registration by
  // phone, no account needed).
  memberId: integer("member_id").references(() => members.id, {
    onDelete: "set null",
  }),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  participantName: text("participant_name").notNull(),
  participantEmail: text("participant_email"),
  participantPhone: text("participant_phone"),
  guardianName: text("guardian_name"), // for minors
  guardianPhone: text("guardian_phone"),
  waiverSignedAt: text("waiver_signed_at"),
  status: text("status", { enum: PROGRAM_REGISTRATION_STATUS })
    .notNull()
    .default("registered"),
  paid: integer("paid", { mode: "boolean" }).notNull().default(false),
  amountCents: integer("amount_cents"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  registeredBy: integer("registered_by").references(() => users.id, {
    onDelete: "set null",
  }),
  registeredAt: text("registered_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("program_registrations_session_idx").on(table.sessionId),
  index("program_registrations_member_idx").on(table.memberId),
  index("program_registrations_status_idx").on(table.status),
]);

// ── Staff Availability + Time Off (Phase 2 layer-2) ─────────────────

export const staffAvailability = sqliteTable("staff_availability", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // 0 = Sunday, 6 = Saturday. Matches JS Date.getDay().
  weekday: integer("weekday").notNull(),
  // HH:MM in 24h local time.
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  effectiveFrom: text("effective_from"),
  effectiveTo: text("effective_to"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("staff_availability_user_idx").on(table.userId),
  index("staff_availability_weekday_idx").on(table.weekday),
]);

export const TIME_OFF_TYPES = ["pto", "unpaid", "sick", "other"] as const;
export const TIME_OFF_STATUS = ["pending", "approved", "denied", "cancelled"] as const;

export const timeOffRequests = sqliteTable("time_off_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  type: text("type", { enum: TIME_OFF_TYPES }).notNull().default("pto"),
  status: text("status", { enum: TIME_OFF_STATUS })
    .notNull()
    .default("pending"),
  reason: text("reason"),
  approvedBy: integer("approved_by").references(() => users.id, {
    onDelete: "set null",
  }),
  approvedAt: text("approved_at"),
  denialReason: text("denial_reason"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("time_off_requests_user_idx").on(table.userId),
  index("time_off_requests_status_idx").on(table.status),
  index("time_off_requests_start_idx").on(table.startDate),
]);

// ── Equipment Inventory (Phase 4) ───────────────────────────────────
// Physical inventory separate from `resources` (which covers rentable
// items). Equipment here is stuff the gym owns + uses: scoreboards,
// basketballs, cones, first-aid kits, snack-bar stock. Tracks on-hand
// count + min threshold for reorder alerts.

export const EQUIPMENT_CATEGORIES = [
  "sports",           // balls, cones, pinnies, clocks
  "av",               // scoreboards, camera gear, mics
  "safety",           // first aid, AED pads, ice
  "janitorial",       // cleaning supplies
  "concessions",      // snack bar stock
  "office",           // front-desk supplies
  "other",
] as const;

export const equipment = sqliteTable("equipment", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sku: text("sku"),
  category: text("category", { enum: EQUIPMENT_CATEGORIES })
    .notNull()
    .default("other"),
  location: text("location"), // "Storage room A", "Court 3 cabinet"
  // Current count + reorder threshold. When on_hand <= min_quantity
  // the item shows up in the reorder-alert widget on /admin/reports.
  onHand: integer("on_hand").notNull().default(0),
  minQuantity: integer("min_quantity").notNull().default(0),
  unitCostCents: integer("unit_cost_cents"),
  supplier: text("supplier"),
  supplierSku: text("supplier_sku"),
  lastRestockedAt: text("last_restocked_at"),
  notes: text("notes"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("equipment_category_idx").on(table.category),
  index("equipment_active_idx").on(table.active),
]);

// Stock movements — audit trail for every in/out. Reports can answer
// "who took 10 basketballs out of storage" via the recorded_by FK.
export const STOCK_MOVEMENT_TYPES = [
  "restock",     // +N from supplier delivery
  "usage",       // -N consumed / given out
  "adjustment",  // +/-N count correction after physical audit
  "transfer",    // -N from one location, +N to another (future)
  "damage",      // -N written off
] as const;

export const equipmentStockMovements = sqliteTable("equipment_stock_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  equipmentId: integer("equipment_id")
    .notNull()
    .references(() => equipment.id, { onDelete: "cascade" }),
  type: text("type", { enum: STOCK_MOVEMENT_TYPES }).notNull(),
  // Signed delta — positive for restock/adjustment-up, negative for
  // usage/damage/adjustment-down.
  delta: integer("delta").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  notes: text("notes"),
  recordedBy: integer("recorded_by").references(() => users.id, {
    onDelete: "set null",
  }),
  occurredAt: text("occurred_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("equipment_stock_movements_eq_idx").on(table.equipmentId),
  index("equipment_stock_movements_occ_idx").on(table.occurredAt),
]);


// ── Gym events ──────────────────────────────────────────────────────────────
// Owner-managed gym calendar — private events like "Court 4 closed for
// maintenance", "Team practice 6–8pm", "Ref clinic". Surfaced on the
// main admin dashboard so the owner can see what's happening today at
// a glance without hunting through tournament/shift screens.
export const GYM_EVENT_CATEGORIES = [
  "practice",
  "maintenance",
  "training",
  "rental",
  "meeting",
  "closed",
  "other",
] as const;

export const gymEvents = sqliteTable("gym_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  category: text("category", { enum: GYM_EVENT_CATEGORIES })
    .notNull()
    .default("other"),
  // Free-text location/court descriptor — admins often type "Courts 1&2"
  // or "Back office" rather than picking from a dropdown.
  location: text("location"),
  startAt: text("start_at").notNull(), // ISO timestamp
  endAt: text("end_at").notNull(),     // ISO timestamp
  allDay: integer("all_day", { mode: "boolean" }).default(false),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("gym_events_start_at_idx").on(table.startAt),
  index("gym_events_category_idx").on(table.category),
]);

// ── Rental car depth ─────────────────────────────────────────────────
// The original `resources` + `resourceBookings` tables covered basic
// van reservations. This extension turns them into a proper rental
// operation: fleet detail (VIN, make, registration, insurance), rate
// cards (hourly/daily/weekly/monthly + mileage overage), maintenance
// logs, damage inspections, and renter driver's-license capture.
//
// New fields on `resources` and `resourceBookings` are added via
// migration 0021 (not declared inline to keep schema.ts readable).
// New standalone tables live here.

export const MAINTENANCE_TYPES = [
  "oil_change",
  "tire_rotation",
  "brake_service",
  "inspection",
  "repair",
  "cleaning",
  "other",
] as const;

export const resourceMaintenance = sqliteTable("resource_maintenance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  resourceId: integer("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  type: text("type", { enum: MAINTENANCE_TYPES }).notNull().default("other"),
  description: text("description").notNull(),
  // Mileage at time of service — also the benchmark for the next
  // service interval (currentMileage + intervalMileage).
  mileageAt: integer("mileage_at"),
  costCents: integer("cost_cents").default(0),
  vendor: text("vendor"),
  performedAt: text("performed_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  // Target odometer for the next service of this type. Lets the fleet
  // dashboard flag "oil change due in 400 miles".
  nextServiceMileage: integer("next_service_mileage"),
  notes: text("notes"),
  recordedBy: integer("recorded_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("resource_maintenance_resource_idx").on(table.resourceId),
  index("resource_maintenance_performed_idx").on(table.performedAt),
]);

export const DAMAGE_SEVERITY = ["cosmetic", "minor", "major", "total_loss"] as const;

export const resourceDamage = sqliteTable("resource_damage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  resourceId: integer("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  // Optional link to the booking where the damage was discovered —
  // helps allocate repair costs to a security deposit hold.
  bookingId: integer("booking_id").references(() => resourceBookings.id, {
    onDelete: "set null",
  }),
  severity: text("severity", { enum: DAMAGE_SEVERITY }).notNull().default("cosmetic"),
  description: text("description").notNull(),
  // Free-text area of the vehicle ("rear bumper", "driver-side door") —
  // richer than a dropdown for actual incident reporting.
  location: text("location"),
  photoUrls: text("photo_urls"), // JSON array of URLs
  repairCostCents: integer("repair_cost_cents"),
  repaired: integer("repaired", { mode: "boolean" }).notNull().default(false),
  repairedAt: text("repaired_at"),
  reportedAt: text("reported_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  reportedBy: integer("reported_by").references(() => users.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
}, (table) => [
  index("resource_damage_resource_idx").on(table.resourceId),
  index("resource_damage_booking_idx").on(table.bookingId),
  index("resource_damage_repaired_idx").on(table.repaired),
]);

// ── Per-user permission overrides ────────────────────────────────────
// Layer on top of the role-based PAGE_ACCESS map in lib/permissions.ts.
// Each row grants (granted=true) or revokes (granted=false) access
// to a specific admin page for a specific user. Overrides win over
// the role default — so a coach can be granted /admin/scores, or a
// staff member can have /admin/payroll specifically revoked.
//
// Keeping this table small (just userId + page + granted + meta) makes
// the matrix view cheap: one select per user, merge with role defaults
// at read time. The page names mirror the AdminPage union in
// lib/permissions.ts — see that file for the full list.

export const userPermissions = sqliteTable("user_permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  page: text("page").notNull(), // mirrors AdminPage union
  granted: integer("granted", { mode: "boolean" }).notNull(),
  reason: text("reason"),
  // Optional auto-expiry. When set and in the past, the override is
  // ignored by canAccessWithOverrides — useful for tournament-weekend
  // grants that should lapse back to the role default after the event.
  expiresAt: text("expires_at"),
  grantedBy: integer("granted_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("user_permissions_user_idx").on(table.userId),
  index("user_permissions_page_idx").on(table.page),
  // Unique pair — only one row per (user, page). The API upserts
  // by deleting + re-inserting to keep the handler simple.
  index("user_permissions_user_page_idx").on(table.userId, table.page),
  index("user_permissions_expires_idx").on(table.expiresAt),
]);

// ── Permission templates ─────────────────────────────────────────────
// Reusable bundles of (page → granted) pairs that admin can apply to
// any user in one click. Extends the hardcoded preset list in the
// bulk dialog — e.g. save "Tournament Weekend Scorekeeper" once, then
// drop that bundle on any ref for the event.
export const permissionTemplates = sqliteTable("permission_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  // JSON array: [{ page: "scores", granted: true }, …]
  pagesJson: text("pages_json").notNull().default("[]"),
  // Default duration in days when applied — null = permanent.
  defaultDurationDays: integer("default_duration_days"),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("permission_templates_name_idx").on(table.name),
]);

// ── Expenses ─────────────────────────────────────────────────────────
// Counterweight to revenue. Admin enters running costs (rent, utility,
// payroll chunks, marketing, supplies) so the dashboard can show real
// P&L instead of just top-line revenue.
export const EXPENSE_CATEGORIES = [
  "rent",
  "utilities",
  "payroll",
  "marketing",
  "supplies",
  "maintenance",
  "insurance",
  "vehicle",
  "equipment",
  "software",
  "professional",
  "taxes",
  "other",
] as const;

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  description: text("description").notNull(),
  category: text("category", { enum: EXPENSE_CATEGORIES }).notNull().default("other"),
  amountCents: integer("amount_cents").notNull(),
  vendor: text("vendor"),
  paymentMethod: text("payment_method"), // cash / card / ach / check
  incurredAt: text("incurred_at").notNull(),
  receiptUrl: text("receipt_url"),
  // Tax-relevant flag surfaces on an end-of-year deductible report.
  taxDeductible: integer("tax_deductible", { mode: "boolean" }).default(true),
  // Optional links — e.g. vehicle maintenance ties back to a resource.
  resourceId: integer("resource_id").references(() => resources.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("expenses_category_idx").on(table.category),
  index("expenses_incurred_idx").on(table.incurredAt),
  index("expenses_vendor_idx").on(table.vendor),
]);

// ── Score-entry depth: play-type tracking, player stats, live
//    collaboration, final-scoreboard photo ───────────────────────────

// Every gameScores row already carries homeScore/awayScore/quarter.
// This optional child table tracks the *play* that generated a score
// when the scorekeeper uses the labeled play buttons (FG, 3PT, FT,
// foul, etc) so the game record supports analytics + highlights.
export const PLAY_TYPES = [
  "free_throw",
  "field_goal",
  "three_pointer",
  "foul",
  "timeout",
  "adjustment",
] as const;

export const playEvents = sqliteTable("play_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  team: text("team", { enum: ["home", "away"] }).notNull(),
  playType: text("play_type", { enum: PLAY_TYPES }).notNull(),
  points: integer("points").notNull().default(0),
  // Optional link to a player row when the scorekeeper picked a name.
  // Nullable because team-total mode doesn't require a player.
  playerId: integer("player_id").references(() => players.id, {
    onDelete: "set null",
  }),
  playerJersey: integer("player_jersey"),
  playerName: text("player_name"), // denormalized for historical queries
  quarter: text("quarter"),
  // For undo — scorekeeper can void an event instead of deleting it.
  // Voided events stay in the audit trail but don't count toward totals.
  voided: integer("voided", { mode: "boolean" }).notNull().default(false),
  voidedAt: text("voided_at"),
  recordedBy: integer("recorded_by").references(() => users.id, {
    onDelete: "set null",
  }),
  recordedAt: text("recorded_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("play_events_game_idx").on(table.gameId),
  index("play_events_player_idx").on(table.playerId),
  index("play_events_recorded_idx").on(table.recordedAt),
  index("play_events_voided_idx").on(table.voided),
]);

// Live collaboration — who's currently scoring this game? Rows are
// upserted every 10s via heartbeat from the scorer's device, and any
// row older than 30s is treated as stale / the person left. Lets
// two scorekeepers see each other on opposite benches.
export const activeScoringSessions = sqliteTable("active_scoring_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startedAt: text("started_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  lastHeartbeatAt: text("last_heartbeat_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("active_scoring_game_idx").on(table.gameId),
  index("active_scoring_user_idx").on(table.userId),
  index("active_scoring_heartbeat_idx").on(table.lastHeartbeatAt),
]);

// Final-scoreboard photo per game — base64 data URL of the photo the
// scorekeeper takes of the physical scoreboard when finalizing.
// Ends disputes: "the parent says 58-42, here's the photo showing 58-42."
// Stored on games (not gameScores) because it's a per-game artifact,
// not per-score-update.

// ── Recurring billing (subscriptions, invoices, payment methods) ─────
// The actual SaaS-tier moneymaker. members.membershipPlanId stays as
// "what plan is this person on" — `subscriptions` is the lifecycle
// state machine that drives recurring charges, retries, and dunning.

export const SUBSCRIPTION_STATUS = [
  "trialing",     // free trial — no charges until trialEndsAt
  "active",       // current period paid, will renew at currentPeriodEnd
  "past_due",     // last charge failed, retries scheduled
  "paused",       // member pause — no charges, no churn
  "cancelled",    // terminal state
] as const;

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  planId: integer("plan_id")
    .notNull()
    .references(() => membershipPlans.id, { onDelete: "restrict" }),
  status: text("status", { enum: SUBSCRIPTION_STATUS }).notNull().default("active"),
  // Billing interval. Most plans are monthly; annual is "12 months".
  interval: text("interval", { enum: ["monthly", "annual"] }).notNull().default("monthly"),
  // Locked-in price at sign-up — protects existing members from price
  // changes on the membership plan. Cents per interval.
  priceCents: integer("price_cents").notNull(),
  // Trial — null means no trial. trialEndsAt overrides the first
  // currentPeriodEnd so we don't charge until trial is over.
  trialEndsAt: text("trial_ends_at"),
  // Current billing period — every successful charge bumps this
  // forward by `interval`. The cron renews when today >= currentPeriodEnd.
  currentPeriodStart: text("current_period_start").notNull(),
  currentPeriodEnd: text("current_period_end").notNull(),
  // Square card to charge on renewal. Null means "manual collect at
  // front desk" — front desk gets a daily list to chase.
  paymentMethodId: integer("payment_method_id"),
  // Dunning state — how many consecutive failed retries since the
  // last successful charge. Resets to 0 on success. At 3 we cancel.
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lastChargeAt: text("last_charge_at"),
  lastChargeStatus: text("last_charge_status", {
    enum: ["pending", "succeeded", "failed"],
  }),
  // When the cron should next try (used for retry scheduling).
  // null means "process at currentPeriodEnd" (normal renewal).
  nextRetryAt: text("next_retry_at"),
  cancelledAt: text("cancelled_at"),
  cancelReason: text("cancel_reason"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("subscriptions_member_idx").on(table.memberId),
  index("subscriptions_status_idx").on(table.status),
  index("subscriptions_period_end_idx").on(table.currentPeriodEnd),
  index("subscriptions_retry_idx").on(table.nextRetryAt),
]);

// Tokenized card from Square. Many-to-one with members (a member can
// have multiple cards on file; subscription points at one of them).
export const paymentMethods = sqliteTable("payment_methods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  squareCustomerId: text("square_customer_id").notNull(),
  squareCardId: text("square_card_id").notNull(), // the tokenized card ID we charge against
  brand: text("brand"),       // "VISA", "MASTERCARD", etc.
  last4: text("last4"),
  expMonth: integer("exp_month"),
  expYear: integer("exp_year"),
  cardholderName: text("cardholder_name"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(true),
  // Set when Square reports the card is no longer valid (declined,
  // closed, expired). Frontend surfaces a "fix payment" alert.
  disabledAt: text("disabled_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("payment_methods_member_idx").on(table.memberId),
  index("payment_methods_square_card_idx").on(table.squareCardId),
]);

// Every billing attempt — successful or not. The receipt log + the
// audit trail. `status='paid'` rows feed revenue reports; `status='failed'`
// drives dunning workflows.
export const INVOICE_STATUS = ["pending", "paid", "failed", "refunded", "void"] as const;

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id, {
    onDelete: "set null",
  }),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status", { enum: INVOICE_STATUS }).notNull().default("pending"),
  // Period this invoice covers — for the receipt UI.
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  // Square plumbing
  squarePaymentId: text("square_payment_id"),
  squareReceiptUrl: text("square_receipt_url"),
  failureCode: text("failure_code"),     // e.g. "CARD_DECLINED", "INSUFFICIENT_FUNDS"
  failureMessage: text("failure_message"),
  attemptedAt: text("attempted_at"),
  paidAt: text("paid_at"),
  refundedAt: text("refunded_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("invoices_member_idx").on(table.memberId),
  index("invoices_subscription_idx").on(table.subscriptionId),
  index("invoices_status_idx").on(table.status),
  index("invoices_paid_at_idx").on(table.paidAt),
]);

// ── Churn risk scoring (#3) ───────────────────────────────────────────
// Daily-computed risk score per member. Drives /admin/churn — the
// owner's "who to call this week" list. Recomputed nightly so the
// dashboard is fast (no LIKE-then-aggregate at request time).
export const memberRiskScores = sqliteTable("member_risk_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id")
    .notNull()
    .unique() // one score per member; cron upserts
    .references(() => members.id, { onDelete: "cascade" }),
  // 0 = healthy, 100 = imminent churn. Tiers: 0-30 low, 31-70 med, 71-100 high.
  score: integer("score").notNull().default(0),
  tier: text("tier", { enum: ["low", "medium", "high"] }).notNull().default("low"),
  // The dominant signal — drives the human-readable "why" badge.
  primaryReason: text("primary_reason"),
  // Component breakdown so the UI can show "why" without recomputing.
  daysSinceLastVisit: integer("days_since_last_visit"),
  visitsTrend: integer("visits_trend"), // delta vs previous 7d (negative = declining)
  isPastDue: integer("is_past_due", { mode: "boolean" }).notNull().default(false),
  tenureDays: integer("tenure_days"),
  // Owner can mark "I called them, ignore for 14d" — surfaced as
  // dismissedUntil. Cron preserves this on re-score.
  dismissedUntil: text("dismissed_until"),
  computedAt: text("computed_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("member_risk_score_idx").on(table.score),
  index("member_risk_tier_idx").on(table.tier),
  index("member_risk_dismissed_idx").on(table.dismissedUntil),
]);

// ── SMS + Journey automation (#5) ─────────────────────────────────────
// Two-way SMS via Twilio + scheduled journey messages. Every send is
// logged for opt-out compliance + reply threading. Journeys are
// templated multi-step sequences (welcome, win-back, renewal reminder).

export const SMS_DIRECTION = ["outbound", "inbound"] as const;
export const SMS_STATUS = ["queued", "sent", "delivered", "failed", "received"] as const;

export const smsMessages = sqliteTable("sms_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Resolves to either members.id, users.id, or just the raw phone for
  // unknown numbers (lead funnel). At least one of memberId/userId/phone
  // is always set.
  memberId: integer("member_id").references(() => members.id, { onDelete: "set null" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  phone: text("phone").notNull(),  // E.164: +1480xxxxxxx
  direction: text("direction", { enum: SMS_DIRECTION }).notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: SMS_STATUS }).notNull().default("queued"),
  twilioSid: text("twilio_sid"),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  // For threading — outbound messages stamp this so inbound replies
  // can be associated back to the original send.
  threadKey: text("thread_key"),
  // Which journey + step generated this (null for ad-hoc admin sends).
  journeyId: integer("journey_id"),
  journeyStepId: integer("journey_step_id"),
  sentBy: integer("sent_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("sms_member_idx").on(table.memberId),
  index("sms_phone_idx").on(table.phone),
  index("sms_thread_idx").on(table.threadKey),
  index("sms_created_idx").on(table.createdAt),
]);

// SMS opt-out registry. Honors STOP / UNSUBSCRIBE keywords. Every
// outbound send must check this set first.
export const smsOptOuts = sqliteTable("sms_opt_outs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phone: text("phone").notNull().unique(),
  reason: text("reason"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("sms_optout_phone_idx").on(table.phone),
]);

// Journey definitions — multi-step automated sequences.
// Examples: "welcome" (5 messages over 30 days), "winback" (3 messages
// over 14d after no_visit), "renewal_reminder" (2 messages 3d/1d before
// next_renewal_at).
export const JOURNEY_TRIGGERS = [
  "manual",
  "member_created",
  "member_past_due",
  "renewal_in_3d",
  "high_churn_risk",
] as const;

export const journeys = sqliteTable("journeys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  trigger: text("trigger", { enum: JOURNEY_TRIGGERS }).notNull().default("manual"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Steps within a journey. delayHours=0 fires immediately on enrollment,
// delayHours=24 fires 1 day after the previous step.
export const journeySteps = sqliteTable("journey_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  journeyId: integer("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  ordering: integer("ordering").notNull().default(0),
  channel: text("channel", { enum: ["sms", "email", "push"] }).notNull().default("sms"),
  // Message body. Supports `{firstName}`, `{lastName}`, `{daysSinceLastVisit}` placeholders.
  body: text("body").notNull(),
  subject: text("subject"), // email only
  delayHours: integer("delay_hours").notNull().default(0),
  // If the member checks in / pays / etc. before this step fires,
  // skip it. Comma-separated list of skip events.
  skipIfEvents: text("skip_if_events"),
}, (table) => [
  index("journey_steps_journey_idx").on(table.journeyId),
]);

// One row per (member, journey) enrollment. Tracks state machine cursor.
export const JOURNEY_ENROLLMENT_STATUS = ["active", "completed", "cancelled", "skipped"] as const;

export const journeyEnrollments = sqliteTable("journey_enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  journeyId: integer("journey_id").notNull().references(() => journeys.id, { onDelete: "cascade" }),
  memberId: integer("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  status: text("status", { enum: JOURNEY_ENROLLMENT_STATUS }).notNull().default("active"),
  // The next step that should fire + when. Cron looks for nextFireAt <= now.
  nextStepOrdering: integer("next_step_ordering").notNull().default(0),
  nextFireAt: text("next_fire_at"),
  // Stamped when the member replied to ANY message in this journey —
  // signals to the cron that a human took over (skip remaining steps).
  haltedByReplyAt: text("halted_by_reply_at"),
  startedAt: text("started_at").notNull().$defaultFn(() => new Date().toISOString()),
  completedAt: text("completed_at"),
}, (table) => [
  index("journey_enrollments_member_idx").on(table.memberId),
  index("journey_enrollments_journey_idx").on(table.journeyId),
  index("journey_enrollments_fire_idx").on(table.nextFireAt),
  index("journey_enrollments_status_idx").on(table.status),
]);

// ── Workout tracking + leaderboards (#7) ──────────────────────────────
// Members log results from class workouts / training sessions. Drives
// per-class leaderboards (CrossFit playbook) + personal-best tracking.
// Why this matters for retention: members come back to beat their own
// numbers and to show up on the board.

export const WORKOUT_SCORE_TYPES = [
  "time",        // lower = better (e.g. mile time, "Fran")
  "reps",        // higher = better (e.g. max push-ups in 1 min)
  "weight",      // higher = better (e.g. 1RM bench press)
  "rounds",      // higher = better (AMRAP-style)
  "distance",    // higher = better (e.g. 5k row)
] as const;

export const workouts = sqliteTable("workouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),       // "Fran", "5K Row", "Max Free Throws / Min"
  description: text("description"),
  scoreType: text("score_type", { enum: WORKOUT_SCORE_TYPES }).notNull(),
  // Whether lower or higher is better — derived from scoreType but
  // explicit so a custom workout can override (e.g. "min penalty time").
  lowerIsBetter: integer("lower_is_better", { mode: "boolean" }).notNull().default(false),
  // Optional category for filtering ("strength", "conditioning", "skill").
  category: text("category"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("workouts_active_idx").on(table.active),
]);

export const workoutResults = sqliteTable("workout_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workoutId: integer("workout_id").notNull().references(() => workouts.id, { onDelete: "cascade" }),
  // Member-side: results posted by a member to their own log.
  memberId: integer("member_id").references(() => members.id, { onDelete: "cascade" }),
  // User-side: staff/coaches can also post (good for class leaderboards
  // where the coach inputs everyone's number after class).
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  // Numeric value in the unit implied by scoreType. For "time" it's
  // total seconds; for "weight" it's pounds; for "reps" it's count;
  // for "rounds" it's whole rounds; for "distance" it's meters.
  scoreNumeric: integer("score_numeric").notNull(),
  // Free-text addendum ("scaled", "Rx", form notes from coach).
  scoreNote: text("score_note"),
  // Display string — e.g. "4:32" for time-type even though stored as 272.
  // Computed at write time so the leaderboard doesn't need to reformat.
  scoreDisplay: text("score_display"),
  performedAt: text("performed_at").notNull(),
  // Coach who verified — leaderboards can filter "verified-only" so
  // the records stay credible.
  verifiedBy: integer("verified_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("workout_results_workout_idx").on(table.workoutId),
  index("workout_results_member_idx").on(table.memberId),
  index("workout_results_user_idx").on(table.userId),
  index("workout_results_score_idx").on(table.scoreNumeric),
  index("workout_results_performed_idx").on(table.performedAt),
]);

// ── Public API + webhooks (#9) ────────────────────────────────────────
// API keys for external integrations (Zapier, custom dashboards, etc.).
// Hashed (sha256) in storage so a DB leak doesn't expose live keys.
// Each request is rate-limited per key in apiKeyRequests.

export const apiKeys = sqliteTable("api_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Human label so admin can distinguish "Zapier" from "ProShop POS".
  label: text("label").notNull(),
  // sha256 hex of the secret key. The plaintext is shown ONCE on
  // creation and never again.
  keyHash: text("key_hash").notNull().unique(),
  // First 8 chars of the plaintext for display ("ic_a1b2c3d4...").
  // Lets the admin recognize the key without revealing the secret.
  prefix: text("prefix").notNull(),
  // Comma-sep scopes. v1: "read", "write". Future: "read:members", etc.
  scopes: text("scopes").notNull().default("read"),
  // Owner — for revocation + audit.
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  lastUsedAt: text("last_used_at"),
  revokedAt: text("revoked_at"),
  expiresAt: text("expires_at"),  // null = no expiry
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("api_keys_hash_idx").on(table.keyHash),
  index("api_keys_revoked_idx").on(table.revokedAt),
]);

// Webhook subscriptions — external URLs we POST to when domain events
// happen (member.created, subscription.cancelled, game.finalized, etc.).
// Each delivery is signed with the secret so receivers can verify.
export const webhookSubscriptions = sqliteTable("webhook_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  // Comma-sep list of event types this subscriber wants. "*" = all.
  events: text("events").notNull().default("*"),
  // Signing secret — receiver uses HMAC-SHA256 to verify.
  secret: text("secret").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  lastDeliveryAt: text("last_delivery_at"),
  lastDeliveryStatus: integer("last_delivery_status"),
  failureCount: integer("failure_count").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("webhook_subs_active_idx").on(table.active),
]);

// Delivery log for retries + debugging.
export const webhookDeliveries = sqliteTable("webhook_deliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subscriptionId: integer("subscription_id")
    .notNull()
    .references(() => webhookSubscriptions.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull(), // JSON string of the body
  attemptedAt: text("attempted_at").notNull().$defaultFn(() => new Date().toISOString()),
  status: integer("status"),  // HTTP status returned, null on network error
  responseBody: text("response_body"),
  errorMessage: text("error_message"),
  attemptNumber: integer("attempt_number").notNull().default(1),
}, (table) => [
  index("webhook_deliveries_sub_idx").on(table.subscriptionId),
  index("webhook_deliveries_attempted_idx").on(table.attemptedAt),
]);

// ── Inquiries (lead capture engine) ───────────────────────────────────
// Public-site visitors submit one of six inquiry types (court rental,
// training, party, league, tournament host, membership). This is the
// conversion engine — no self-booking, every submission becomes a lead
// that lands in /admin/inquiries with a 30-min SLA timer + auto SMS reply.

export const INQUIRY_KINDS = [
  "court_rental",
  "training",
  "party",
  "league",
  "tournament_host",
  "membership",
  "general",
] as const;

export const INQUIRY_STATUS = [
  "new",          // just submitted
  "contacted",    // rep made first touch
  "qualifying",   // mid-conversation
  "won",          // converted to member/booking/registration
  "lost",         // not a fit / went cold
] as const;

export const inquiries = sqliteTable("inquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: INQUIRY_KINDS }).notNull().default("general"),
  status: text("status", { enum: INQUIRY_STATUS }).notNull().default("new"),
  // Contact
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  // Tailored fields — captured as JSON so each inquiry kind can have
  // its own shape without a column explosion. Form schema lives in
  // src/lib/inquiry-forms.ts and renders by `kind`.
  detailsJson: text("details_json"),
  // Free-text "anything else?" — always shown.
  message: text("message"),
  // Sport interest — comma-sep, helps SEO + routing.
  sports: text("sports"),
  // Marketing source — utm_source / referrer / "homepage_hero" / etc.
  source: text("source"),
  pageUrl: text("page_url"),
  // SLA — auto-calc 30 min from createdAt. Surfaced in /admin/inquiries
  // as a countdown chip; turns red when overdue.
  slaDueAt: text("sla_due_at"),
  // Assigned rep (admin user). Null = unassigned, on the queue.
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
  firstTouchAt: text("first_touch_at"),
  closedAt: text("closed_at"),
  closeReason: text("close_reason"), // for status=won/lost
  // Anti-spam — IP + user-agent for after-the-fact triage.
  submittedIp: text("submitted_ip"),
  submittedUa: text("submitted_ua"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("inquiries_kind_idx").on(table.kind),
  index("inquiries_status_idx").on(table.status),
  index("inquiries_assigned_idx").on(table.assignedTo),
  index("inquiries_sla_idx").on(table.slaDueAt),
  index("inquiries_created_idx").on(table.createdAt),
]);

// Audit log of every status change / note added — gives the admin a
// timeline view without joining against the main audit_log.
export const inquiryNotes = sqliteTable("inquiry_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inquiryId: integer("inquiry_id")
    .notNull()
    .references(() => inquiries.id, { onDelete: "cascade" }),
  authorUserId: integer("author_user_id").references(() => users.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  // null for plain notes; "status_change" / "sms_sent" / "email_sent"
  // for system-generated entries.
  kind: text("kind").default("note"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("inquiry_notes_inquiry_idx").on(table.inquiryId),
]);

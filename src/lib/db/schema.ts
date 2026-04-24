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
]);

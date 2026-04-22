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
}, (table) => [
  index("waivers_email_idx").on(table.email),
  index("waivers_team_idx").on(table.teamName),
]);

// ── Announcements ───────────────────────────────────────────────────────────

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  audience: text("audience").notNull().default("all"), // "all", "coaches", "parents", or division like "14U"
  createdBy: integer("created_by").references(() => users.id),
  expiresAt: text("expires_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index("announcements_audience_idx").on(table.audience),
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

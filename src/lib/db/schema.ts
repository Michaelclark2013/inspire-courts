import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

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
  memberSince: text("member_since"), // Year they started (e.g. "2022") — for loyalty badge
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

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
});

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
});

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
  createdBy: integer("created_by").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

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
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

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

// ── Check-Ins ───────────────────────────────────────────────────────────────

export const checkins = sqliteTable("checkins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerName: text("player_name").notNull(),
  teamName: text("team_name").notNull(),
  division: text("division"),
  type: text("type", { enum: ["checkin", "waiver"] })
    .notNull()
    .default("checkin"),
  checkedInBy: integer("checked_in_by").references(() => users.id),
  timestamp: text("timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

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
});

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
});

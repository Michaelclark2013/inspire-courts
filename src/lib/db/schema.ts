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

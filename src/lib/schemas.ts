import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("A valid email is required").max(254),
  phone: z.string().max(30).optional(),
  inquiryType: z.string().max(100).optional(),
  message: z.string().min(1, "Message is required").max(5000),
});

const VALID_EVENT_TYPES = new Set([
  "Practice",
  "Tournament",
  "Party / Event",
  "Open Gym",
  "Other",
]);

export const bookSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("A valid email is required").max(254),
  phone: z.string().min(1, "Phone is required").max(30),
  sport: z.string().min(1, "Sport is required").max(50),
  eventType: z
    .string()
    .min(1, "Event type is required")
    .refine((v) => VALID_EVENT_TYPES.has(v), "Invalid event type."),
  preferredDate: z
    .string()
    .min(1, "Preferred date is required")
    .refine((val) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(val) >= today;
    }, "Preferred date must be today or in the future."),
  preferredTime: z.string().min(1, "Preferred time is required").max(50),
  courts: z.string().min(1, "Courts needed is required").max(50),
  notes: z.string().max(2000).optional(),
});

export const chatSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .max(40)
    .optional(),
  sessionId: z.string().max(128).optional(),
  pathname: z.string().max(256).optional(),
});

export const subscribeSchema = z.object({
  email: z.string().email("A valid email is required"),
});

// Admin user create — bcrypt.hash(12) is CPU-expensive so POST is
// rate-limited upstream; this schema covers the shape only. Password
// is capped at 72 because bcrypt silently truncates beyond that and
// we refuse to let two different long passwords collide.
export const userCreateSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  name: z.string().min(1, "Name is required").max(200),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be 72 characters or fewer (bcrypt truncates)"),
  role: z.enum(["admin", "staff", "ref", "front_desk", "coach", "parent"]),
  phone: z.string().max(30).optional().nullable(),
  memberSince: z.string().max(10).optional().nullable(),
});

// Admin user update — fields optional so partial updates pass through.
// `id` is required; every other field is patch-style.
export const userUpdateSchema = z.object({
  id: z.number().int().positive(),
  role: z.enum(["admin", "staff", "ref", "front_desk", "coach", "parent"]).optional(),
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(30).optional().nullable(),
  approved: z.boolean().optional(),
});

// Admin approvals PATCH — accepts either a single userId (legacy) or
// a bulk userIds[] array capped server-side at 200.
export const approvalsPatchSchema = z
  .object({
    userId: z.number().int().positive().optional(),
    userIds: z.array(z.number().int().positive()).max(200).optional(),
    action: z.enum(["approve", "reject"]),
  })
  .refine(
    (v) => v.userId != null || (Array.isArray(v.userIds) && v.userIds.length > 0),
    "userId or userIds[] is required"
  );

// Admin tournament create — mirrors the columns the POST handler
// inserts. Description and location caps match the DB-side trims.
export const tournamentCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  format: z
    .enum(["single_elim", "double_elim", "round_robin", "pool_play"])
    .optional(),
  divisions: z.array(z.string()).optional(),
  courts: z.array(z.string()).optional(),
  gameLength: z.number().int().positive().max(600).optional(),
  breakLength: z.number().int().nonnegative().max(120).optional(),
  entryFee: z.number().nonnegative().optional().nullable(),
  maxTeamsPerDivision: z.number().int().positive().optional().nullable(),
  registrationDeadline: z.string().optional().nullable(),
  registrationOpen: z.boolean().optional(),
  description: z.string().max(5000).optional().nullable(),
});

// Admin game create — mirrors games table columns the POST handler
// inserts. scheduledTime is kept as a bounded string so either ISO
// or human-readable "Sat 10am" labels can flow through.
export const gameCreateSchema = z.object({
  homeTeam: z.string().min(1, "homeTeam is required").max(200),
  awayTeam: z.string().min(1, "awayTeam is required").max(200),
  division: z.string().max(50).optional().nullable(),
  court: z.string().max(50).optional().nullable(),
  eventName: z.string().max(200).optional().nullable(),
  scheduledTime: z.string().max(40).optional().nullable(),
});

// Admin game score update (PUT/PATCH). Partial by design: the handler
// inserts a new gameScores row when home+awayScore are present and/or
// flips the games.status when status is present. quarter is whatever
// label (Q1, H2, OT, "1") the ref enters, so keep it open-ended but
// length-capped.
export const scoreUpdateSchema = z.object({
  gameId: z.number().int().positive(),
  homeScore: z.number().int().nonnegative().max(999).optional(),
  awayScore: z.number().int().nonnegative().max(999).optional(),
  quarter: z.string().max(20).optional().nullable(),
  status: z.enum(["scheduled", "live", "final"]).optional(),
});

// Admin tournament update — partial patch. `format` enum here is the
// POST-era set PLUS two legacy names ("single_elimination",
// "double_elimination", "pool_to_bracket") that predate the create
// schema; PUT keeps accepting them so existing rows can be edited.
export const tournamentUpdateSchema = z.object({
  name: z.string().max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  format: z
    .enum([
      "single_elim",
      "double_elim",
      "round_robin",
      "pool_play",
      "single_elimination",
      "double_elimination",
      "pool_to_bracket",
    ])
    .optional(),
  divisions: z.array(z.string()).optional(),
  courts: z.array(z.string()).optional(),
  gameLength: z.number().int().positive().max(600).optional(),
  breakLength: z.number().int().nonnegative().max(120).optional(),
  status: z.enum(["draft", "published", "active", "completed"]).optional(),
});

// Admin walk-in registration — admin-created regs skip the public
// payment/approval flow and go straight to approved+waived. Every
// field length-capped to match the DB sanitization the handler does
// server-side. paymentStatus enum mirrors the DB CHECK constraint.
export const registrationCreateSchema = z.object({
  teamName: z.string().min(1, "Team name is required").max(200),
  coachName: z.string().min(1, "Coach name is required").max(200),
  coachEmail: z.string().email().max(255).optional().nullable(),
  division: z.string().max(50).optional().nullable(),
  paymentStatus: z.enum(["pending", "paid", "refunded", "waived"]).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

// Admin team add — teamName flows into every bracket games row via
// the tournament generator, so every field is length-capped. teamId
// optionally links back to a persistent Team row for stats.
export const teamAddSchema = z.object({
  teamName: z.string().min(1, "Team name is required").max(100),
  teamId: z.number().int().positive().optional().nullable(),
  division: z.string().max(50).optional().nullable(),
  seed: z.number().int().positive().optional(),
  poolGroup: z.string().max(20).optional().nullable(),
});

// Admin checkin — front desk dual-writes to DB + Google Sheets. Type
// covers regular check-in, waiver submission, and explicit no-show so
// forfeit slots can be cleared during a tournament.
export const checkinSchema = z.object({
  playerName: z.string().min(1, "Player name is required").max(100),
  teamName: z.string().max(100).optional(),
  division: z.string().max(50).optional().nullable(),
  type: z.enum(["checkin", "waiver", "no_show"]).optional(),
});

// Admin notify broadcast — gated behind canAccess("tournaments") and
// aggressively rate-limited (Gmail quota). Audience is a discriminant
// that maps to a role-set server-side.
export const notifySchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(10000),
  audience: z.enum(["coaches", "parents", "refs", "staff", "all"]),
  tournamentId: z.number().int().positive().optional().nullable(),
});

// Admin announcements — validated server-side on POST. Audience is an
// enum so unknown values fall back to "all" (mirrors the previous
// hand-rolled validation).
export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  body: z.string().min(1, "Body is required").max(10000),
  audience: z.enum(["all", "coaches", "parents"]).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

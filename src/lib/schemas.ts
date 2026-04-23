import { z } from "zod";

// Public (unauthenticated) schemas live in ./schemas/public.ts so the
// attack-surface audit is easy. Re-exported here so existing imports
// `import { contactSchema } from "@/lib/schemas"` keep working.
export {
  contactSchema,
  bookSchema,
  chatSchema,
  subscribeSchema,
} from "./schemas/public";

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

// Admin registration bulk-update — either registrationId (legacy)
// or ids[] (bulk, capped at 200). At least one target-status field
// must be set but we let the handler decide if the request is a
// no-op; schema just validates types.
export const registrationUpdateSchema = z
  .object({
    registrationId: z.number().int().positive().optional(),
    ids: z.array(z.number().int().positive()).max(200).optional(),
    status: z
      .enum(["pending", "approved", "rejected", "cancelled", "waitlist"])
      .optional(),
    paymentStatus: z.enum(["pending", "paid", "refunded", "waived"]).optional(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (v) => v.registrationId != null || (Array.isArray(v.ids) && v.ids.length > 0),
    "registrationId or ids[] is required"
  );

// Staff profile + time-clock schemas live in ./schemas/staff.ts.
export {
  staffProfileCreateSchema,
  staffProfileUpdateSchema,
  clockInSchema,
  clockOutSchema,
  timeEntryPatchSchema,
  timeEntryCreateSchema,
} from "./schemas/staff";

// Shift scheduling schemas live in ./schemas/shifts.ts.
export {
  shiftCreateSchema,
  shiftUpdateSchema,
  shiftAssignSchema,
  shiftAssignmentPatchSchema,
  shiftResponseSchema,
} from "./schemas/shifts";

// Resources + bookings live in ./schemas/resources.ts.
export {
  resourceCreateSchema,
  resourceUpdateSchema,
  resourceBookingCreateSchema,
  resourceBookingUpdateSchema,
} from "./schemas/resources";

// ── Phase 3: Payroll ─────────────────────────────────────────────────
const PAY_PERIOD_STATUS_ENUM = z.enum(["open", "locked", "paid"]);

export const payPeriodCreateSchema = z
  .object({
    label: z.string().min(1, "Label is required").max(100),
    startsAt: z.string().min(1).max(40),
    endsAt: z.string().min(1).max(40),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (v) => Date.parse(v.startsAt) < Date.parse(v.endsAt),
    { message: "startsAt must precede endsAt", path: ["endsAt"] }
  );

export const payPeriodUpdateSchema = z.object({
  id: z.number().int().positive(),
  label: z.string().min(1).max(100).optional(),
  startsAt: z.string().max(40).optional(),
  endsAt: z.string().max(40).optional(),
  status: PAY_PERIOD_STATUS_ENUM.optional(),
  notes: z.string().max(2000).optional().nullable(),
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

// Admin announcement update — partial patch shape. At least one of
// title/body/audience/expiresAt must be present; handler enforces that
// (Zod `refine` is overkill here since the "no fields" 400 is cheap).
export const announcementUpdateSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(255).optional(),
  body: z.string().min(1).max(10000).optional(),
  audience: z.enum(["all", "coaches", "parents"]).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

// Admin team delete body — single field, but Zod gives us consistent
// 422 errors instead of the hand-rolled 400 the handler used to throw.
export const teamDeleteSchema = z.object({
  teamEntryId: z.number().int().positive(),
});

// Admin team update — partial patch of a tournament_teams row.
// `players` is a JSON array stored stringified; schema validates
// the array shape and the handler still sanitizes each player
// (length caps) before JSON.stringify to protect the bracket engine.
export const teamUpdateSchema = z.object({
  teamEntryId: z.number().int().positive(),
  seed: z.number().int().positive().optional(),
  poolGroup: z.string().max(20).optional().nullable(),
  eliminated: z.boolean().optional(),
  players: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        jersey: z.string().max(10).optional().nullable(),
      })
    )
    .max(50)
    .optional(),
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

// Members + plans + visits + CSV import live in ./schemas/members.ts.
export {
  membershipPlanCreateSchema,
  membershipPlanUpdateSchema,
  memberCreateSchema,
  memberUpdateSchema,
  memberVisitCreateSchema,
  memberImportRowSchema,
  memberImportSchema,
} from "./schemas/members";

// Certifications + maintenance tickets live in their own files.
export {
  certificationCreateSchema,
  certificationUpdateSchema,
} from "./schemas/certifications";
export {
  maintenanceTicketCreateSchema,
  maintenanceTicketUpdateSchema,
} from "./schemas/maintenance";

// Programs + sessions + registrations + session generator live in
// ./schemas/programs.ts.
export {
  programCreateSchema,
  programUpdateSchema,
  programSessionCreateSchema,
  programSessionUpdateSchema,
  programRegistrationCreateSchema,
  programRegistrationUpdateSchema,
  sessionGeneratorSchema,
} from "./schemas/programs";

// Staff availability + time off live in ./schemas/availability.ts.
export {
  staffAvailabilityCreateSchema,
  timeOffRequestCreateSchema,
  timeOffRequestPatchSchema,
} from "./schemas/availability";

// Equipment + stock movements live in ./schemas/equipment.ts.
export {
  equipmentCreateSchema,
  equipmentUpdateSchema,
  stockMovementCreateSchema,
} from "./schemas/equipment";

// Waivers schema lives in ./schemas/waivers.ts for legal-audit isolation.
export { waiverSignSchema } from "./schemas/waivers";

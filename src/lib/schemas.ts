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

// ── Phase 1: Staff + Time Clock ───────────────────────────────────────
// Mirrors the DB enums so clients send the same strings the handler
// inserts — no mapping layer in between.

const EMPLOYMENT_CLASSIFICATION_ENUM = z.enum([
  "w2",
  "1099",
  "cash_no_1099",
  "volunteer",
  "stipend",
]);
const PAYMENT_METHOD_ENUM = z.enum([
  "direct_deposit",
  "check",
  "cash",
  "venmo",
  "zelle",
  "paypal",
  "other",
]);
const PAY_RATE_TYPE_ENUM = z.enum([
  "hourly",
  "per_shift",
  "per_game",
  "salary",
  "stipend",
]);
const STAFF_STATUS_ENUM = z.enum(["active", "on_leave", "terminated"]);

// Admin-create staff profile. `userId` is required — a staff profile
// always extends an existing user row (no orphan staff). Pay rate
// captured in cents to avoid float-drift over a year of payroll math.
export const staffProfileCreateSchema = z.object({
  userId: z.number().int().positive(),
  employmentClassification: EMPLOYMENT_CLASSIFICATION_ENUM.optional(),
  paymentMethod: PAYMENT_METHOD_ENUM.optional(),
  payRateCents: z.number().int().nonnegative().max(1_000_000).optional(),
  payRateType: PAY_RATE_TYPE_ENUM.optional(),
  roleTags: z.string().max(200).optional(),
  payoutHandle: z.string().max(200).optional().nullable(),
  hireDate: z.string().max(20).optional().nullable(),
  emergencyContactJson: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: STAFF_STATUS_ENUM.optional(),
});

// Patch shape — userId is the target, every other field optional.
export const staffProfileUpdateSchema = z.object({
  userId: z.number().int().positive(),
  employmentClassification: EMPLOYMENT_CLASSIFICATION_ENUM.optional(),
  paymentMethod: PAYMENT_METHOD_ENUM.optional(),
  payRateCents: z.number().int().nonnegative().max(1_000_000).optional(),
  payRateType: PAY_RATE_TYPE_ENUM.optional(),
  roleTags: z.string().max(200).optional(),
  payoutHandle: z.string().max(200).optional().nullable(),
  hireDate: z.string().max(20).optional().nullable(),
  emergencyContactJson: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: STAFF_STATUS_ENUM.optional(),
});

// Clock-in payload from the portal/kiosk. Lat/lng are strings so
// browser `navigator.geolocation` values round-trip without float
// precision fights. role is the hat-they're-wearing snapshot.
export const clockInSchema = z.object({
  role: z.string().max(50).optional(),
  tournamentId: z.number().int().positive().optional().nullable(),
  lat: z.string().max(30).optional().nullable(),
  lng: z.string().max(30).optional().nullable(),
  source: z.enum(["kiosk", "mobile", "manual"]).optional(),
});

export const clockOutSchema = z.object({
  lat: z.string().max(30).optional().nullable(),
  lng: z.string().max(30).optional().nullable(),
  breakMinutes: z.number().int().nonnegative().max(480).optional(),
});

// Admin-side time-entry edit (retroactive fixes, manual entry,
// approval/rejection). Any subset of fields can be patched.
export const timeEntryPatchSchema = z.object({
  entryId: z.number().int().positive(),
  clockInAt: z.string().max(40).optional(),
  clockOutAt: z.string().max(40).optional().nullable(),
  breakMinutes: z.number().int().nonnegative().max(480).optional(),
  role: z.string().max(50).optional().nullable(),
  tournamentId: z.number().int().positive().optional().nullable(),
  payRateCents: z.number().int().nonnegative().max(1_000_000).optional(),
  payRateType: PAY_RATE_TYPE_ENUM.optional(),
  bonusCents: z.number().int().nonnegative().max(1_000_000).optional(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(["open", "pending", "approved", "rejected"]).optional(),
});

// Admin-created manual entry (e.g. tablet was offline, admin is
// keying a retroactive shift). clockInAt required; clockOutAt
// optional because an admin might log only the start.
export const timeEntryCreateSchema = z.object({
  userId: z.number().int().positive(),
  clockInAt: z.string().min(1).max(40),
  clockOutAt: z.string().max(40).optional().nullable(),
  breakMinutes: z.number().int().nonnegative().max(480).optional(),
  role: z.string().max(50).optional().nullable(),
  tournamentId: z.number().int().positive().optional().nullable(),
  payRateCents: z.number().int().nonnegative().max(1_000_000).optional(),
  payRateType: PAY_RATE_TYPE_ENUM.optional(),
  bonusCents: z.number().int().nonnegative().max(1_000_000).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

// ── Phase 2: Shift Scheduling ─────────────────────────────────────────
const SHIFT_STATUS_ENUM = z.enum(["draft", "published", "cancelled", "completed"]);
const SHIFT_ASSIGNMENT_STATUS_ENUM = z.enum([
  "assigned",
  "confirmed",
  "declined",
  "no_show",
  "completed",
]);

// Shift create — admin schedules a new shift (assigned later).
// Start must precede end; we enforce via z.refine so the handler
// doesn't have to double-check.
export const shiftCreateSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    role: z.string().max(50).optional().nullable(),
    tournamentId: z.number().int().positive().optional().nullable(),
    startAt: z.string().min(1, "Start required").max(40),
    endAt: z.string().min(1, "End required").max(40),
    courts: z.string().max(200).optional().nullable(),
    requiredHeadcount: z.number().int().positive().max(50).optional(),
    notes: z.string().max(2000).optional().nullable(),
    status: SHIFT_STATUS_ENUM.optional(),
  })
  .refine(
    (v) => Date.parse(v.startAt) < Date.parse(v.endAt),
    { message: "startAt must precede endAt", path: ["endAt"] }
  );

export const shiftUpdateSchema = z
  .object({
    id: z.number().int().positive(),
    title: z.string().min(1).max(200).optional(),
    role: z.string().max(50).optional().nullable(),
    tournamentId: z.number().int().positive().optional().nullable(),
    startAt: z.string().max(40).optional(),
    endAt: z.string().max(40).optional(),
    courts: z.string().max(200).optional().nullable(),
    requiredHeadcount: z.number().int().positive().max(50).optional(),
    notes: z.string().max(2000).optional().nullable(),
    status: SHIFT_STATUS_ENUM.optional(),
  })
  .refine(
    (v) =>
      !v.startAt || !v.endAt || Date.parse(v.startAt) < Date.parse(v.endAt),
    { message: "startAt must precede endAt", path: ["endAt"] }
  );

// Admin-side assignment — assign one or many users to a shift. Bulk
// cap 50 (a shift never has 50 workers; bigger payloads are a bug).
export const shiftAssignSchema = z.object({
  shiftId: z.number().int().positive(),
  userIds: z.array(z.number().int().positive()).min(1).max(50),
  payRateCentsOverride: z.number().int().nonnegative().max(1_000_000).optional().nullable(),
  bonusCents: z.number().int().nonnegative().max(1_000_000).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

// Admin or worker-side status transition. Worker calls confirm/decline
// from the portal; admin calls no_show/completed from the timeclock
// approval view.
export const shiftAssignmentPatchSchema = z.object({
  assignmentId: z.number().int().positive(),
  status: SHIFT_ASSIGNMENT_STATUS_ENUM.optional(),
  payRateCentsOverride: z.number().int().nonnegative().max(1_000_000).optional().nullable(),
  bonusCents: z.number().int().nonnegative().max(1_000_000).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

// Worker-side confirm/decline from /portal/staff/schedule. No pay-rate
// or bonus fields — workers can't change their own pay.
export const shiftResponseSchema = z.object({
  assignmentId: z.number().int().positive(),
  response: z.enum(["confirmed", "declined"]),
  notes: z.string().max(500).optional().nullable(),
});

// ── Resources & Bookings ─────────────────────────────────────────────
const RESOURCE_KIND_ENUM = z.enum(["vehicle", "equipment", "court", "room", "other"]);
const RESOURCE_BOOKING_STATUS_ENUM = z.enum([
  "tentative",
  "confirmed",
  "in_use",
  "returned",
  "cancelled",
  "no_show",
]);

export const resourceCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  kind: RESOURCE_KIND_ENUM.optional(),
  description: z.string().max(2000).optional().nullable(),
  dailyRateCents: z.number().int().nonnegative().max(10_000_000).optional().nullable(),
  hourlyRateCents: z.number().int().nonnegative().max(1_000_000).optional().nullable(),
  licensePlate: z.string().max(20).optional().nullable(),
  capacity: z.number().int().positive().max(100).optional().nullable(),
  active: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const resourceUpdateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(200).optional(),
  kind: RESOURCE_KIND_ENUM.optional(),
  description: z.string().max(2000).optional().nullable(),
  dailyRateCents: z.number().int().nonnegative().max(10_000_000).optional().nullable(),
  hourlyRateCents: z.number().int().nonnegative().max(1_000_000).optional().nullable(),
  licensePlate: z.string().max(20).optional().nullable(),
  capacity: z.number().int().positive().max(100).optional().nullable(),
  active: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const resourceBookingCreateSchema = z
  .object({
    resourceId: z.number().int().positive(),
    renterUserId: z.number().int().positive().optional().nullable(),
    renterName: z.string().max(200).optional().nullable(),
    renterEmail: z.string().email().max(255).optional().nullable(),
    renterPhone: z.string().max(30).optional().nullable(),
    startAt: z.string().min(1).max(40),
    endAt: z.string().min(1).max(40),
    status: RESOURCE_BOOKING_STATUS_ENUM.optional(),
    amountCents: z.number().int().nonnegative().max(100_000_000).optional(),
    paid: z.boolean().optional(),
    paymentMethod: z.string().max(30).optional().nullable(),
    odometerStart: z.number().int().nonnegative().max(10_000_000).optional().nullable(),
    fuelStart: z.string().max(20).optional().nullable(),
    purpose: z.string().max(500).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (v) => Date.parse(v.startAt) < Date.parse(v.endAt),
    { message: "startAt must precede endAt", path: ["endAt"] }
  )
  .refine(
    (v) => v.renterUserId != null || (v.renterName && v.renterName.trim().length > 0),
    { message: "Either renterUserId or renterName is required", path: ["renterName"] }
  );

export const resourceBookingUpdateSchema = z
  .object({
    id: z.number().int().positive(),
    renterUserId: z.number().int().positive().optional().nullable(),
    renterName: z.string().max(200).optional().nullable(),
    renterEmail: z.string().email().max(255).optional().nullable(),
    renterPhone: z.string().max(30).optional().nullable(),
    startAt: z.string().max(40).optional(),
    endAt: z.string().max(40).optional(),
    status: RESOURCE_BOOKING_STATUS_ENUM.optional(),
    amountCents: z.number().int().nonnegative().max(100_000_000).optional(),
    paid: z.boolean().optional(),
    paymentMethod: z.string().max(30).optional().nullable(),
    odometerStart: z.number().int().nonnegative().max(10_000_000).optional().nullable(),
    odometerEnd: z.number().int().nonnegative().max(10_000_000).optional().nullable(),
    fuelStart: z.string().max(20).optional().nullable(),
    fuelEnd: z.string().max(20).optional().nullable(),
    purpose: z.string().max(500).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (v) =>
      !v.startAt || !v.endAt || Date.parse(v.startAt) < Date.parse(v.endAt),
    { message: "startAt must precede endAt", path: ["endAt"] }
  );

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

// ── Members & Memberships ───────────────────────────────────────────
const MEMBERSHIP_PLAN_TYPE_ENUM = z.enum([
  "unlimited", "single_sport", "family", "day_pass", "class_pack", "other",
]);
const MEMBER_STATUS_ENUM = z.enum([
  "active", "paused", "past_due", "cancelled", "trial",
]);
const MEMBER_SOURCE_ENUM = z.enum([
  "website", "walk_in", "referral", "tournament", "instagram", "google", "other",
]);
const MEMBER_VISIT_TYPE_ENUM = z.enum([
  "open_gym", "class", "tournament", "private_training", "guest_pass", "other",
]);

export const membershipPlanCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: MEMBERSHIP_PLAN_TYPE_ENUM.optional(),
  description: z.string().max(2000).optional().nullable(),
  priceMonthlyCents: z.number().int().nonnegative().max(10_000_000).optional().nullable(),
  priceAnnualCents: z.number().int().nonnegative().max(100_000_000).optional().nullable(),
  priceOnceCents: z.number().int().nonnegative().max(10_000_000).optional().nullable(),
  includes: z.string().max(500).optional(),
  maxVisitsPerMonth: z.number().int().positive().max(1000).optional().nullable(),
  maxVisitsPerWeek: z.number().int().positive().max(100).optional().nullable(),
  active: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const membershipPlanUpdateSchema = membershipPlanCreateSchema.extend({
  id: z.number().int().positive(),
  name: z.string().min(1).max(200).optional(),
});

export const memberCreateSchema = z.object({
  userId: z.number().int().positive().optional().nullable(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  birthDate: z.string().max(20).optional().nullable(),
  membershipPlanId: z.number().int().positive().optional().nullable(),
  status: MEMBER_STATUS_ENUM.optional(),
  source: MEMBER_SOURCE_ENUM.optional(),
  joinedAt: z.string().min(1).max(40),
  nextRenewalAt: z.string().max(40).optional().nullable(),
  autoRenew: z.boolean().optional(),
  paymentMethod: z.string().max(30).optional().nullable(),
  emergencyContactJson: z.string().max(2000).optional().nullable(),
  primaryMemberId: z.number().int().positive().optional().nullable(),
  // Pause window — daily cron auto-reactivates when this passes.
  // Null = not paused.
  pausedUntil: z.string().max(40).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const memberUpdateSchema = memberCreateSchema.partial().extend({
  id: z.number().int().positive(),
});

export const memberVisitCreateSchema = z.object({
  memberId: z.number().int().positive(),
  type: MEMBER_VISIT_TYPE_ENUM.optional(),
  notes: z.string().max(500).optional().nullable(),
  visitedAt: z.string().max(40).optional(),
});

// ── Certifications ─────────────────────────────────────────────────
const CERTIFICATION_TYPE_ENUM = z.enum([
  "cpr", "first_aid", "aed", "background_check",
  "ref_level_1", "ref_level_2", "ref_level_3",
  "coaching_license", "drivers_license", "w4", "i9", "other",
]);

export const certificationCreateSchema = z.object({
  userId: z.number().int().positive(),
  type: CERTIFICATION_TYPE_ENUM,
  label: z.string().max(200).optional().nullable(),
  issuedAt: z.string().max(40).optional().nullable(),
  expiresAt: z.string().max(40).optional().nullable(),
  documentUrl: z.string().url().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const certificationUpdateSchema = certificationCreateSchema.partial().extend({
  id: z.number().int().positive(),
});

// ── Maintenance Tickets ────────────────────────────────────────────
const MAINTENANCE_PRIORITY_ENUM = z.enum(["low", "medium", "high", "urgent"]);
const MAINTENANCE_STATUS_ENUM = z.enum([
  "open", "in_progress", "waiting_vendor", "resolved", "closed",
]);

export const maintenanceTicketCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  priority: MAINTENANCE_PRIORITY_ENUM.optional(),
  status: MAINTENANCE_STATUS_ENUM.optional(),
  assignedTo: z.number().int().positive().optional().nullable(),
  resourceId: z.number().int().positive().optional().nullable(),
  photoUrls: z.array(z.string().url()).max(20).optional(),
  vendorName: z.string().max(200).optional().nullable(),
  costCents: z.number().int().nonnegative().max(100_000_000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export const maintenanceTicketUpdateSchema = maintenanceTicketCreateSchema.partial().extend({
  id: z.number().int().positive(),
});

// ── Programs / Sessions / Registrations ────────────────────────────
const PROGRAM_TYPE_ENUM = z.enum([
  "camp", "clinic", "league", "open_gym", "private_training", "class", "other",
]);
const PROGRAM_SESSION_STATUS_ENUM = z.enum([
  "scheduled", "live", "completed", "cancelled",
]);
const PROGRAM_REGISTRATION_STATUS_ENUM = z.enum([
  "registered", "waitlist", "attended", "no_show", "cancelled",
]);

export const programCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: PROGRAM_TYPE_ENUM.optional(),
  description: z.string().max(5000).optional().nullable(),
  minAge: z.number().int().min(0).max(120).optional().nullable(),
  maxAge: z.number().int().min(0).max(120).optional().nullable(),
  capacityPerSession: z.number().int().positive().max(500).optional().nullable(),
  priceCents: z.number().int().nonnegative().max(10_000_000).optional().nullable(),
  tags: z.string().max(500).optional(),
  active: z.boolean().optional(),
});

export const programUpdateSchema = programCreateSchema.partial().extend({
  id: z.number().int().positive(),
});

export const programSessionCreateSchema = z
  .object({
    programId: z.number().int().positive(),
    startsAt: z.string().min(1).max(40),
    endsAt: z.string().min(1).max(40),
    instructorUserId: z.number().int().positive().optional().nullable(),
    location: z.string().max(100).optional().nullable(),
    capacityOverride: z.number().int().positive().max(500).optional().nullable(),
    status: PROGRAM_SESSION_STATUS_ENUM.optional(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine((v) => Date.parse(v.startsAt) < Date.parse(v.endsAt), {
    message: "startsAt must precede endsAt",
    path: ["endsAt"],
  });

export const programSessionUpdateSchema = z.object({
  id: z.number().int().positive(),
  startsAt: z.string().max(40).optional(),
  endsAt: z.string().max(40).optional(),
  instructorUserId: z.number().int().positive().optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  capacityOverride: z.number().int().positive().max(500).optional().nullable(),
  status: PROGRAM_SESSION_STATUS_ENUM.optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const programRegistrationCreateSchema = z.object({
  sessionId: z.number().int().positive(),
  memberId: z.number().int().positive().optional().nullable(),
  userId: z.number().int().positive().optional().nullable(),
  participantName: z.string().min(1).max(200),
  participantEmail: z.string().email().max(255).optional().nullable(),
  participantPhone: z.string().max(30).optional().nullable(),
  guardianName: z.string().max(200).optional().nullable(),
  guardianPhone: z.string().max(30).optional().nullable(),
  status: PROGRAM_REGISTRATION_STATUS_ENUM.optional(),
  paid: z.boolean().optional(),
  amountCents: z.number().int().nonnegative().max(10_000_000).optional().nullable(),
  paymentMethod: z.string().max(30).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const programRegistrationUpdateSchema = programRegistrationCreateSchema.partial().extend({
  id: z.number().int().positive(),
});

// ── Staff Availability + Time Off ──────────────────────────────────
export const staffAvailabilityCreateSchema = z
  .object({
    userId: z.number().int().positive(),
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM"),
    effectiveFrom: z.string().max(20).optional().nullable(),
    effectiveTo: z.string().max(20).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: "startTime must precede endTime",
    path: ["endTime"],
  });

export const timeOffRequestCreateSchema = z
  .object({
    userId: z.number().int().positive().optional(),
    startDate: z.string().min(1).max(20),
    endDate: z.string().min(1).max(20),
    type: z.enum(["pto", "unpaid", "sick", "other"]).optional(),
    reason: z.string().max(500).optional().nullable(),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: "startDate must be on or before endDate",
    path: ["endDate"],
  });

export const timeOffRequestPatchSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["pending", "approved", "denied", "cancelled"]),
  denialReason: z.string().max(500).optional().nullable(),
});

// ── Equipment Inventory ────────────────────────────────────────────
const EQUIPMENT_CATEGORY_ENUM = z.enum([
  "sports", "av", "safety", "janitorial", "concessions", "office", "other",
]);

export const equipmentCreateSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().max(100).optional().nullable(),
  category: EQUIPMENT_CATEGORY_ENUM.optional(),
  location: z.string().max(100).optional().nullable(),
  onHand: z.number().int().nonnegative().max(1_000_000).optional(),
  minQuantity: z.number().int().nonnegative().max(1_000_000).optional(),
  unitCostCents: z.number().int().nonnegative().max(10_000_000).optional().nullable(),
  supplier: z.string().max(200).optional().nullable(),
  supplierSku: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  active: z.boolean().optional(),
});

export const equipmentUpdateSchema = equipmentCreateSchema.partial().extend({
  id: z.number().int().positive(),
});

export const stockMovementCreateSchema = z.object({
  equipmentId: z.number().int().positive(),
  type: z.enum(["restock", "usage", "adjustment", "transfer", "damage"]),
  delta: z.number().int(),
  notes: z.string().max(500).optional().nullable(),
});

// ── Program session generator — recurring sessions ─────────────────
export const sessionGeneratorSchema = z.object({
  programId: z.number().int().positive(),
  firstStartsAt: z.string().min(1).max(40),
  durationMinutes: z.number().int().positive().max(1440), // 1 day max
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  untilDate: z.string().min(1).max(20), // YYYY-MM-DD
  instructorUserId: z.number().int().positive().optional().nullable(),
  location: z.string().max(100).optional().nullable(),
});

// ── Member CSV import ──────────────────────────────────────────────
// One row at a time. Handler loops over the array inside a DB
// transaction so the whole import is atomic (all-or-nothing on
// validation failure).
export const memberImportRowSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  birthDate: z.string().max(20).optional().nullable(),
  membershipPlanId: z.number().int().positive().optional().nullable(),
  planName: z.string().max(200).optional().nullable(), // resolved to id server-side
  status: z.enum(["active", "paused", "past_due", "cancelled", "trial"]).optional(),
  source: z.enum(["website", "walk_in", "referral", "tournament", "instagram", "google", "other"]).optional(),
  joinedAt: z.string().min(1).max(40),
  nextRenewalAt: z.string().max(40).optional().nullable(),
  autoRenew: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const memberImportSchema = z.object({
  rows: z.array(memberImportRowSchema).min(1).max(1000),
  dryRun: z.boolean().optional(),
});

// ── Waivers 2.0 ────────────────────────────────────────────────────
export const waiverSignSchema = z.object({
  playerName: z.string().min(1).max(200),
  parentName: z.string().max(200).optional().nullable(),
  teamName: z.string().max(200).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  // data-URL signature (PNG base64). Capped at ~500KB so a rogue
  // client can't upload 10MB of trash inside the signature blob.
  signatureDataUrl: z.string().startsWith("data:image/").max(500_000),
  signedByName: z.string().min(1).max(200),
  waiverType: z.enum(["general", "program", "tournament", "rental", "other"]).optional(),
  programId: z.number().int().positive().optional().nullable(),
  memberId: z.number().int().positive().optional().nullable(),
  waiverVersion: z.string().max(40).optional(),
  // Expiration — if not provided, admin API can fill from a default.
  expiresAt: z.string().max(40).optional().nullable(),
});

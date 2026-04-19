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

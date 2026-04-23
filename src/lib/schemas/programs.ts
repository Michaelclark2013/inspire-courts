// Programs + sessions + registrations + recurring-session generator.
// Programs are the main recurring-revenue product alongside memberships,
// so the zod envelope here is the source of truth for what fields the
// admin UI + public registration flow can write.

import { z } from "zod";

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

// Recurring-session generator: admin picks weekdays + until-date, handler
// creates one session per matching weekday until untilDate.
export const sessionGeneratorSchema = z.object({
  programId: z.number().int().positive(),
  firstStartsAt: z.string().min(1).max(40),
  durationMinutes: z.number().int().positive().max(1440), // 1 day max
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  untilDate: z.string().min(1).max(20), // YYYY-MM-DD
  instructorUserId: z.number().int().positive().optional().nullable(),
  location: z.string().max(100).optional().nullable(),
});

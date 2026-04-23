// Shift scheduling: admin creates shifts, assigns users, workers
// confirm/decline from the portal. Start-before-end enforced at
// schema level so handlers don't double-check.

import { z } from "zod";

const SHIFT_STATUS_ENUM = z.enum(["draft", "published", "cancelled", "completed"]);
const SHIFT_ASSIGNMENT_STATUS_ENUM = z.enum([
  "assigned",
  "confirmed",
  "declined",
  "no_show",
  "completed",
]);

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

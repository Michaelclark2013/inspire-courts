// Staff profile + time-clock schemas. Pay-rate fields are in cents to
// avoid float drift over a year of payroll math. Enums mirror the DB
// CHECK constraints so clients send the same strings the handler inserts.

import { z } from "zod";

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
// always extends an existing user row (no orphan staff).
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

// Members + membership plans + visits + CSV import schemas.
// Touches billing (`priceMonthlyCents`), retention (`pausedUntil`,
// `autoRenew`, `nextRenewalAt`), and PII (`birthDate`, `email`, `phone`) —
// keeping the whole domain in one file makes the review scope obvious.

import { z } from "zod";

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

// CSV import: one row at a time. Handler loops over the array inside a
// DB transaction so the whole import is atomic (all-or-nothing on
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

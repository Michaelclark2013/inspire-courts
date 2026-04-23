// Resource catalog (vehicles, equipment, courts, rooms) + booking
// lifecycle. Rates in cents for float-drift safety; either-or refine
// on renterUserId/renterName since a booking can be under a logged-in
// account or a walk-in.

import { z } from "zod";

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

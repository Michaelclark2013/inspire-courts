// Staff weekly availability + time-off requests.
// Used by the scheduling engine to determine who can be put on a shift,
// and by the time-off approval flow.

import { z } from "zod";

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

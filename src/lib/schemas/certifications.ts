// Staff certification tracking (CPR, first aid, ref licensing, W4/I9,
// etc.). Expirations drive compliance reminders.

import { z } from "zod";

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

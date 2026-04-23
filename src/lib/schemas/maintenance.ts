// Maintenance ticket tracking (court repairs, equipment issues, etc.).
// Front desk files them, admin triages.

import { z } from "zod";

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

// Equipment inventory + stock-movement schemas. Keeps the
// category/type enums co-located with the schemas that reference them
// so changes don't have to chase through schemas.ts.

import { z } from "zod";

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

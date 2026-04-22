import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { equipment, equipmentStockMovements } from "@/lib/db/schema";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import {
  equipmentCreateSchema,
  equipmentUpdateSchema,
  stockMovementCreateSchema,
} from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/equipment
//   ?category=sports|av|safety|janitorial|concessions|office|other
//   ?belowThreshold=true — only items at or below min_quantity
//   ?active=true (default) | false | any
export const GET = withTiming("admin.equipment.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "equipment")) {
    return apiError("Unauthorized", 401);
  }
  const sp = request.nextUrl.searchParams;
  const category = sp.get("category");
  const belowThreshold = sp.get("belowThreshold") === "true";
  const activeParam = sp.get("active");

  const filters: SQL[] = [];
  if (category && ["sports", "av", "safety", "janitorial", "concessions", "office", "other"].includes(category)) {
    filters.push(
      eq(
        equipment.category,
        category as "sports" | "av" | "safety" | "janitorial" | "concessions" | "office" | "other"
      )
    );
  }
  if (belowThreshold) {
    filters.push(sql`${equipment.onHand} <= ${equipment.minQuantity}`);
  }
  if (activeParam !== "any") {
    filters.push(eq(equipment.active, activeParam === "false" ? false : true));
  }

  try {
    const rows = await db
      .select()
      .from(equipment)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(equipment.category, equipment.name);
    return NextResponse.json({ data: rows, total: rows.length });
  } catch (err) {
    logger.error("Failed to fetch equipment", { error: String(err) });
    return apiError("Failed to fetch equipment", 500);
  }
});

export const POST = withTiming("admin.equipment.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "equipment")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, equipmentCreateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const [created] = await db.insert(equipment).values({
      name: b.name,
      sku: b.sku ?? null,
      category: b.category ?? "other",
      location: b.location ?? null,
      onHand: b.onHand ?? 0,
      minQuantity: b.minQuantity ?? 0,
      unitCostCents: b.unitCostCents ?? null,
      supplier: b.supplier ?? null,
      supplierSku: b.supplierSku ?? null,
      notes: b.notes ?? null,
      active: b.active ?? true,
    }).returning();
    await recordAudit({
      session, request, action: "equipment.created",
      entityType: "equipment", entityId: created.id, before: null,
      after: { name: created.name, category: created.category, onHand: created.onHand },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create equipment", { error: String(err) });
    return apiError("Failed to create equipment", 500);
  }
});

export const PUT = withTiming("admin.equipment.update", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "equipment")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, equipmentUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { id, ...rest } = parsed.data;
  try {
    const [before] = await db.select().from(equipment).where(eq(equipment.id, id)).limit(1);
    if (!before) return apiNotFound("Equipment not found");
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) updates[k] = v;
    const [updated] = await db.update(equipment).set(updates).where(eq(equipment.id, id)).returning();
    await recordAudit({
      session, request, action: "equipment.updated",
      entityType: "equipment", entityId: id,
      before: { onHand: before.onHand, minQuantity: before.minQuantity },
      after: updates,
    });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update equipment", { error: String(err) });
    return apiError("Failed to update equipment", 500);
  }
});

// POST /api/admin/equipment/movement — record a stock change.
// Delta is signed. Atomically updates equipment.onHand and writes the
// audit row to equipment_stock_movements.
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

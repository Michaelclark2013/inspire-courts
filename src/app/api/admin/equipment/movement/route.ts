import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { equipment, equipmentStockMovements, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import { stockMovementCreateSchema } from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/equipment/movement?equipmentId=X — usage history for
// one item. Joins the recording user so the UI shows "Jake took 2".
export const GET = withTiming("admin.equipment_movement.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "equipment")) {
    return apiError("Unauthorized", 401);
  }
  const idRaw = request.nextUrl.searchParams.get("equipmentId");
  const equipmentId = Number(idRaw);
  if (!idRaw || !Number.isInteger(equipmentId) || equipmentId <= 0) {
    return apiError("equipmentId required", 400);
  }
  try {
    const rows = await db
      .select({
        id: equipmentStockMovements.id,
        type: equipmentStockMovements.type,
        delta: equipmentStockMovements.delta,
        balanceAfter: equipmentStockMovements.balanceAfter,
        notes: equipmentStockMovements.notes,
        recordedBy: equipmentStockMovements.recordedBy,
        recordedByName: users.name,
        occurredAt: equipmentStockMovements.occurredAt,
      })
      .from(equipmentStockMovements)
      .leftJoin(users, eq(users.id, equipmentStockMovements.recordedBy))
      .where(eq(equipmentStockMovements.equipmentId, equipmentId))
      .orderBy(desc(equipmentStockMovements.occurredAt))
      .limit(100);
    return NextResponse.json({ data: rows, total: rows.length });
  } catch (err) {
    logger.error("Failed to fetch movements", { error: String(err) });
    return apiError("Failed to fetch movements", 500);
  }
});

// POST — record a stock movement. Runs in a transaction so the
// onHand update + movement row are atomic. Refuses movements that
// would take the balance below zero (caller should use adjustment
// for audit-correction increases, or restock first).
export const POST = withTiming("admin.equipment_movement.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "equipment")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, stockMovementCreateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  if (b.delta === 0) return apiError("Delta cannot be zero", 400);
  try {
    const result = await db.transaction(async (tx) => {
      const [item] = await tx.select().from(equipment).where(eq(equipment.id, b.equipmentId)).limit(1);
      if (!item) throw new Error("not_found");
      const nextBalance = item.onHand + b.delta;
      if (nextBalance < 0) throw new Error(`would_go_negative:${item.onHand}`);
      const recorder = session.user.id ? Number(session.user.id) : null;
      const now = new Date().toISOString();
      const [movement] = await tx.insert(equipmentStockMovements).values({
        equipmentId: b.equipmentId,
        type: b.type,
        delta: b.delta,
        balanceAfter: nextBalance,
        notes: b.notes ?? null,
        recordedBy: recorder && !isNaN(recorder) ? recorder : null,
      }).returning();
      const updateFields: Record<string, unknown> = { onHand: nextBalance, updatedAt: now };
      if (b.type === "restock") updateFields.lastRestockedAt = now;
      await tx.update(equipment).set(updateFields).where(eq(equipment.id, b.equipmentId));
      return movement;
    });
    await recordAudit({
      session, request, action: `equipment.${b.type}`,
      entityType: "equipment", entityId: b.equipmentId, before: null,
      after: { type: b.type, delta: b.delta, balanceAfter: result.balanceAfter },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const msg = (err as Error).message || "";
    if (msg === "not_found") return apiNotFound("Equipment not found");
    if (msg.startsWith("would_go_negative")) {
      const current = msg.split(":")[1];
      return apiError(`On-hand would go below zero (current: ${current})`, 409);
    }
    logger.error("Failed to record movement", { error: String(err) });
    return apiError("Failed to record movement", 500);
  }
});

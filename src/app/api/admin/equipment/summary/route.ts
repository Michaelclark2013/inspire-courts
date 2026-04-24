import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { equipment, equipmentStockMovements } from "@/lib/db/schema";
import { and, eq, gte, sql, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/equipment/summary — roll-ups for the inventory dashboard.
// Per-category counts + reorder list + 30-day movement feed + value on hand.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString();

    const [
      items,
      categoryAgg,
      movementAgg,
      recentMovements,
    ] = await Promise.all([
      db
        .select()
        .from(equipment)
        .where(eq(equipment.active, true))
        .orderBy(equipment.category, equipment.name),
      db
        .select({
          category: equipment.category,
          items: sql<number>`count(*)`,
          onHand: sql<number>`coalesce(sum(${equipment.onHand}), 0)`,
          valueCents: sql<number>`coalesce(sum(${equipment.onHand} * coalesce(${equipment.unitCostCents}, 0)), 0)`,
          lowStock: sql<number>`coalesce(sum(case when ${equipment.onHand} <= ${equipment.minQuantity} then 1 else 0 end), 0)`,
        })
        .from(equipment)
        .where(eq(equipment.active, true))
        .groupBy(equipment.category),
      db
        .select({
          type: equipmentStockMovements.type,
          count: sql<number>`count(*)`,
          totalDelta: sql<number>`coalesce(sum(${equipmentStockMovements.delta}), 0)`,
        })
        .from(equipmentStockMovements)
        .where(gte(equipmentStockMovements.occurredAt, thirtyDaysAgo))
        .groupBy(equipmentStockMovements.type),
      db
        .select({
          id: equipmentStockMovements.id,
          equipmentId: equipmentStockMovements.equipmentId,
          type: equipmentStockMovements.type,
          delta: equipmentStockMovements.delta,
          balanceAfter: equipmentStockMovements.balanceAfter,
          occurredAt: equipmentStockMovements.occurredAt,
          notes: equipmentStockMovements.notes,
          equipmentName: equipment.name,
          equipmentCategory: equipment.category,
        })
        .from(equipmentStockMovements)
        .leftJoin(equipment, eq(equipment.id, equipmentStockMovements.equipmentId))
        .orderBy(desc(equipmentStockMovements.occurredAt))
        .limit(25),
    ]);

    const needsReorder = items.filter((i) => i.onHand <= i.minQuantity);
    const totalValueCents = items.reduce(
      (s, i) => s + i.onHand * (i.unitCostCents || 0),
      0
    );

    return NextResponse.json(
      {
        items,
        categoryAgg,
        movementAgg,
        recentMovements,
        needsReorder,
        totals: {
          items: items.length,
          onHand: items.reduce((s, i) => s + i.onHand, 0),
          valueCents: totalValueCents,
          needsReorder: needsReorder.length,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("equipment summary failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

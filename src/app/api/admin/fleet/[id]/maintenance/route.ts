import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { resourceMaintenance, resources, MAINTENANCE_TYPES } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// POST /api/admin/fleet/[id]/maintenance — log a service event.
// Optionally bumps the vehicle's current_mileage if provided.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const resourceId = Number(idStr);
  if (!Number.isInteger(resourceId) || resourceId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    if (!description) {
      return NextResponse.json({ error: "Description required" }, { status: 400 });
    }
    const rawType = typeof body?.type === "string" ? body.type : "other";
    const type = (MAINTENANCE_TYPES as readonly string[]).includes(rawType)
      ? (rawType as (typeof MAINTENANCE_TYPES)[number])
      : "other";

    const mileageAt = Number.isFinite(Number(body?.mileageAt)) ? Number(body.mileageAt) : null;
    const costCents = Number.isFinite(Number(body?.costCents)) ? Number(body.costCents) : 0;
    const nextServiceMileage = Number.isFinite(Number(body?.nextServiceMileage))
      ? Number(body.nextServiceMileage)
      : null;

    const [entry] = await db
      .insert(resourceMaintenance)
      .values({
        resourceId,
        type,
        description,
        mileageAt,
        costCents,
        vendor: typeof body?.vendor === "string" ? body.vendor.trim() || null : null,
        performedAt: typeof body?.performedAt === "string" && body.performedAt
          ? body.performedAt
          : new Date().toISOString(),
        nextServiceMileage,
        notes: typeof body?.notes === "string" ? body.notes.trim() || null : null,
        recordedBy: Number(session.user.id),
      })
      .returning();

    // Roll service expectations forward when applicable.
    const updates: Record<string, unknown> = {};
    if (type === "oil_change" && nextServiceMileage) {
      updates.nextOilChangeMileage = nextServiceMileage;
    }
    if (mileageAt !== null) {
      updates.currentMileage = mileageAt;
    }
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      await db.update(resources).set(updates).where(eq(resources.id, resourceId));
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    logger.error("maintenance log failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to log maintenance" }, { status: 500 });
  }
}

// GET /api/admin/fleet/[id]/maintenance — list.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: idStr } = await params;
  const resourceId = Number(idStr);
  if (!Number.isInteger(resourceId) || resourceId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const rows = await db
      .select()
      .from(resourceMaintenance)
      .where(eq(resourceMaintenance.resourceId, resourceId))
      .orderBy(desc(resourceMaintenance.performedAt));
    return NextResponse.json(rows);
  } catch (err) {
    logger.error("maintenance list failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

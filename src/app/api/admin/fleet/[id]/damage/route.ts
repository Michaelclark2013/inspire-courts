import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { resourceDamage, DAMAGE_SEVERITY } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// POST /api/admin/fleet/[id]/damage — log a damage incident.
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
    const rawSev = typeof body?.severity === "string" ? body.severity : "cosmetic";
    const severity = (DAMAGE_SEVERITY as readonly string[]).includes(rawSev)
      ? (rawSev as (typeof DAMAGE_SEVERITY)[number])
      : "cosmetic";

    const bookingId = Number.isFinite(Number(body?.bookingId)) ? Number(body.bookingId) : null;
    const repairCostCents = Number.isFinite(Number(body?.repairCostCents))
      ? Number(body.repairCostCents)
      : null;
    const photoUrls = Array.isArray(body?.photoUrls) ? JSON.stringify(body.photoUrls) : null;

    const [entry] = await db
      .insert(resourceDamage)
      .values({
        resourceId,
        bookingId,
        severity,
        description,
        location: typeof body?.location === "string" ? body.location.trim() || null : null,
        photoUrls,
        repairCostCents,
        reportedBy: Number(session.user.id),
        notes: typeof body?.notes === "string" ? body.notes.trim() || null : null,
      })
      .returning();

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    logger.error("damage log failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to log damage" }, { status: 500 });
  }
}

// PATCH /api/admin/fleet/[id]/damage?damageId=N — mark repaired.
export async function PATCH(
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
    const { searchParams } = new URL(request.url);
    const damageId = Number(searchParams.get("damageId"));
    if (!Number.isInteger(damageId) || damageId <= 0) {
      return NextResponse.json({ error: "damageId required" }, { status: 400 });
    }
    const [updated] = await db
      .update(resourceDamage)
      .set({
        repaired: true,
        repairedAt: new Date().toISOString(),
      })
      .where(eq(resourceDamage.id, damageId))
      .returning();
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("damage repair failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to mark repaired" }, { status: 500 });
  }
}

// GET list
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
  const rows = await db
    .select()
    .from(resourceDamage)
    .where(eq(resourceDamage.resourceId, resourceId))
    .orderBy(desc(resourceDamage.reportedAt));
  return NextResponse.json(rows);
}

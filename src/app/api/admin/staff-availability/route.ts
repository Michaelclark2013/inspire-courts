import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { staffAvailability, users } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import { staffAvailabilityCreateSchema } from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/staff-availability
//   ?userId=X — only that worker's windows
//   default: everyone's windows joined with names
export const GET = withTiming("admin.availability.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "roster")) {
    return apiError("Unauthorized", 401);
  }
  const sp = request.nextUrl.searchParams;
  const userIdRaw = sp.get("userId");
  const userId = Number(userIdRaw);
  try {
    let query = db
      .select({
        id: staffAvailability.id,
        userId: staffAvailability.userId,
        name: users.name,
        weekday: staffAvailability.weekday,
        startTime: staffAvailability.startTime,
        endTime: staffAvailability.endTime,
        effectiveFrom: staffAvailability.effectiveFrom,
        effectiveTo: staffAvailability.effectiveTo,
        notes: staffAvailability.notes,
      })
      .from(staffAvailability)
      .leftJoin(users, eq(users.id, staffAvailability.userId))
      .$dynamic();
    if (userIdRaw && Number.isInteger(userId) && userId > 0) {
      query = query.where(eq(staffAvailability.userId, userId));
    }
    const rows = await query.orderBy(
      asc(staffAvailability.weekday),
      asc(staffAvailability.startTime)
    );
    return NextResponse.json({ data: rows, total: rows.length });
  } catch (err) {
    logger.error("Failed to load availability", { error: String(err) });
    return apiError("Failed to load", 500);
  }
});

export const POST = withTiming("admin.availability.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "roster")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, staffAvailabilityCreateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const [created] = await db.insert(staffAvailability).values({
      userId: b.userId,
      weekday: b.weekday,
      startTime: b.startTime,
      endTime: b.endTime,
      effectiveFrom: b.effectiveFrom ?? null,
      effectiveTo: b.effectiveTo ?? null,
      notes: b.notes ?? null,
    }).returning();
    await recordAudit({
      session, request, action: "staff_availability.created",
      entityType: "staff_availability", entityId: created.id, before: null,
      after: { userId: b.userId, weekday: b.weekday, window: `${b.startTime}-${b.endTime}` },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create availability", { error: String(err) });
    return apiError("Failed to save", 500);
  }
});

export const DELETE = withTiming("admin.availability.delete", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "roster")) {
    return apiError("Unauthorized", 401);
  }
  const idRaw = request.nextUrl.searchParams.get("id");
  const id = Number(idRaw);
  if (!idRaw || !Number.isInteger(id) || id <= 0) return apiError("Valid id required", 400);
  try {
    const [before] = await db.select().from(staffAvailability).where(eq(staffAvailability.id, id)).limit(1);
    if (!before) return apiNotFound("Window not found");
    await db.delete(staffAvailability).where(eq(staffAvailability.id, id));
    await recordAudit({
      session, request, action: "staff_availability.deleted",
      entityType: "staff_availability", entityId: id,
      before: { userId: before.userId, weekday: before.weekday }, after: null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Failed to delete availability", { error: String(err) });
    return apiError("Failed to delete", 500);
  }
});

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { shifts, shiftAssignments, users } from "@/lib/db/schema";
import { and, asc , eq, gte, inArray, lt, sql, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import { shiftCreateSchema, shiftUpdateSchema } from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/shifts — list shifts joined with assignment counts.
//   ?status=draft|published|cancelled|completed
//   ?tournamentId=123
//   ?from=ISO&to=ISO    default: today → +30 days
//   ?role=ref
export const GET = withTiming("admin.shifts.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }

  const sp = request.nextUrl.searchParams;
  const statusFilter = sp.get("status");
  const tournamentIdRaw = sp.get("tournamentId");
  const roleFilter = sp.get("role");
  const from = sp.get("from") || new Date().toISOString().slice(0, 10);
  const to =
    sp.get("to") ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const filters: SQL[] = [];
  if (statusFilter && ["draft", "published", "cancelled", "completed"].includes(statusFilter)) {
    filters.push(
      eq(
        shifts.status,
        statusFilter as "draft" | "published" | "cancelled" | "completed"
      )
    );
  }
  const tournamentId = Number(tournamentIdRaw);
  if (tournamentIdRaw && Number.isInteger(tournamentId) && tournamentId > 0) {
    filters.push(eq(shifts.tournamentId, tournamentId));
  }
  if (roleFilter) filters.push(eq(shifts.role, roleFilter));
  filters.push(gte(shifts.startAt, from));
  filters.push(lt(shifts.startAt, to));

  try {
    const rows = await db
      .select()
      .from(shifts)
      .where(and(...filters))
      .orderBy(asc(shifts.startAt));

    if (rows.length === 0) return NextResponse.json({ data: [], total: 0 });

    // Batch-fetch assignment counts per shift so we can show "3/4
    // filled" without N+1 queries.
    const ids = rows.map((r) => r.id);
    const assignmentsRows = await db
      .select({
        shiftId: shiftAssignments.shiftId,
        userId: shiftAssignments.userId,
        name: users.name,
        status: shiftAssignments.status,
        assignmentId: shiftAssignments.id,
      })
      .from(shiftAssignments)
      .leftJoin(users, eq(users.id, shiftAssignments.userId))
      .where(inArray(shiftAssignments.shiftId, ids));

    const byShift = new Map<number, typeof assignmentsRows>();
    for (const a of assignmentsRows) {
      const list = byShift.get(a.shiftId) ?? [];
      list.push(a);
      byShift.set(a.shiftId, list);
    }

    const enriched = rows.map((r) => {
      const list = byShift.get(r.id) ?? [];
      return {
        ...r,
        assignments: list,
        assignedCount: list.filter(
          (a) => a.status !== "declined" && a.status !== "no_show"
        ).length,
        isOpen:
          list.filter((a) => a.status !== "declined" && a.status !== "no_show")
            .length < r.requiredHeadcount,
      };
    });

    return NextResponse.json(
      { data: enriched, total: enriched.length, from, to },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } }
    );
  } catch (err) {
    logger.error("Failed to fetch shifts", { error: String(err) });
    return apiError("Failed to fetch shifts", 500);
  }
});

// POST /api/admin/shifts — create a shift.
export const POST = withTiming("admin.shifts.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, shiftCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    const userId = session.user.id ? Number(session.user.id) : null;
    const [created] = await db
      .insert(shifts)
      .values({
        title: body.title,
        role: body.role ?? null,
        tournamentId: body.tournamentId ?? null,
        startAt: body.startAt,
        endAt: body.endAt,
        courts: body.courts ?? null,
        requiredHeadcount: body.requiredHeadcount ?? 1,
        notes: body.notes ?? null,
        status: body.status ?? "draft",
        createdBy: userId && !isNaN(userId) ? userId : null,
      })
      .returning();

    await recordAudit({
      session,
      request,
      action: "shift.created",
      entityType: "shift",
      entityId: created.id,
      before: null,
      after: {
        title: created.title,
        role: created.role,
        startAt: created.startAt,
        endAt: created.endAt,
        requiredHeadcount: created.requiredHeadcount,
        status: created.status,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create shift", { error: String(err) });
    return apiError("Failed to create shift", 500);
  }
});

// PUT /api/admin/shifts — update a shift.
export const PUT = withTiming("admin.shifts.update", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, shiftUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    const [before] = await db.select().from(shifts).where(eq(shifts.id, body.id)).limit(1);
    if (!before) return apiNotFound("Shift not found");

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.role !== undefined) updates.role = body.role;
    if (body.tournamentId !== undefined) updates.tournamentId = body.tournamentId;
    if (body.startAt !== undefined) updates.startAt = body.startAt;
    if (body.endAt !== undefined) updates.endAt = body.endAt;
    if (body.courts !== undefined) updates.courts = body.courts;
    if (body.requiredHeadcount !== undefined)
      updates.requiredHeadcount = body.requiredHeadcount;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.status !== undefined) updates.status = body.status;

    const [updated] = await db
      .update(shifts)
      .set(updates)
      .where(eq(shifts.id, body.id))
      .returning();

    const statusChanged = body.status !== undefined && body.status !== before.status;
    await recordAudit({
      session,
      request,
      action: statusChanged ? `shift.${body.status}` : "shift.updated",
      entityType: "shift",
      entityId: body.id,
      before: {
        title: before.title,
        startAt: before.startAt,
        endAt: before.endAt,
        status: before.status,
        requiredHeadcount: before.requiredHeadcount,
      },
      after: updates,
    });

    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update shift", { error: String(err) });
    return apiError("Failed to update shift", 500);
  }
});

// DELETE /api/admin/shifts?id=123 — hard delete (assignments cascade).
// Caller should generally cancel (status=cancelled) rather than delete,
// but a just-created shift with no one assigned is fine to drop.
export const DELETE = withTiming("admin.shifts.delete", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }

  const idRaw = request.nextUrl.searchParams.get("id");
  const id = Number(idRaw);
  if (!idRaw || !Number.isInteger(id) || id <= 0) return apiError("Valid id required", 400);

  try {
    const [before] = await db.select().from(shifts).where(eq(shifts.id, id)).limit(1);
    if (!before) return apiNotFound("Shift not found");

    const [{ assignedCount }] = await db
      .select({ assignedCount: sql<number>`count(*)` })
      .from(shiftAssignments)
      .where(eq(shiftAssignments.shiftId, id));
    if (Number(assignedCount) > 0) {
      return apiError(
        "Shift has assignments — cancel instead (PUT with status=cancelled)",
        409
      );
    }

    await db.delete(shifts).where(eq(shifts.id, id));
    await recordAudit({
      session,
      request,
      action: "shift.deleted",
      entityType: "shift",
      entityId: id,
      before: { title: before.title, startAt: before.startAt, status: before.status },
      after: null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Failed to delete shift", { error: String(err) });
    return apiError("Failed to delete shift", 500);
  }
});

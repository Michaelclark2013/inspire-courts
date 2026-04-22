import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceBookings } from "@/lib/db/schema";
import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import { resourceCreateSchema, resourceUpdateSchema } from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/resources — list the rental catalog.
//   ?kind=vehicle|equipment|court|room|other
//   ?active=true (default) / false / any
export const GET = withTiming("admin.resources.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }

  const sp = request.nextUrl.searchParams;
  const kind = sp.get("kind");
  const activeParam = sp.get("active");

  const filters: SQL[] = [];
  if (kind && ["vehicle", "equipment", "court", "room", "other"].includes(kind)) {
    filters.push(
      eq(resources.kind, kind as "vehicle" | "equipment" | "court" | "room" | "other")
    );
  }
  if (activeParam === "true" || activeParam == null) {
    filters.push(eq(resources.active, true));
  } else if (activeParam === "false") {
    filters.push(eq(resources.active, false));
  }
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  try {
    const rows = await db
      .select()
      .from(resources)
      .where(whereClause)
      .orderBy(resources.name);

    if (rows.length === 0) return NextResponse.json({ data: [], total: 0 });

    // Attach the next upcoming + active booking per resource so the
    // list view can say "in use until 4pm" without N+1 fetches.
    const ids = rows.map((r) => r.id);
    const nowIso = new Date().toISOString();
    const upcoming = await db
      .select({
        resourceId: resourceBookings.resourceId,
        id: resourceBookings.id,
        startAt: resourceBookings.startAt,
        endAt: resourceBookings.endAt,
        status: resourceBookings.status,
        renterName: resourceBookings.renterName,
      })
      .from(resourceBookings)
      .where(
        and(
          inArray(resourceBookings.resourceId, ids),
          sql`${resourceBookings.endAt} > ${nowIso}`,
          inArray(resourceBookings.status, [
            "tentative",
            "confirmed",
            "in_use",
          ])
        )
      )
      .orderBy(resourceBookings.startAt);

    const nextByResource = new Map<number, typeof upcoming[number]>();
    for (const b of upcoming) {
      if (!nextByResource.has(b.resourceId)) nextByResource.set(b.resourceId, b);
    }

    const enriched = rows.map((r) => ({
      ...r,
      nextBooking: nextByResource.get(r.id) ?? null,
    }));

    return NextResponse.json(
      { data: enriched, total: enriched.length },
      { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" } }
    );
  } catch (err) {
    logger.error("Failed to fetch resources", { error: String(err) });
    return apiError("Failed to fetch resources", 500);
  }
});

export const POST = withTiming("admin.resources.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, resourceCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    const [created] = await db
      .insert(resources)
      .values({
        name: body.name,
        kind: body.kind ?? "vehicle",
        description: body.description ?? null,
        dailyRateCents: body.dailyRateCents ?? null,
        hourlyRateCents: body.hourlyRateCents ?? null,
        licensePlate: body.licensePlate ?? null,
        capacity: body.capacity ?? null,
        active: body.active ?? true,
        notes: body.notes ?? null,
      })
      .returning();

    await recordAudit({
      session,
      request,
      action: "resource.created",
      entityType: "resource",
      entityId: created.id,
      before: null,
      after: {
        name: created.name,
        kind: created.kind,
        dailyRateCents: created.dailyRateCents,
        hourlyRateCents: created.hourlyRateCents,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create resource", { error: String(err) });
    return apiError("Failed to create resource", 500);
  }
});

export const PUT = withTiming("admin.resources.update", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, resourceUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    const [before] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, body.id))
      .limit(1);
    if (!before) return apiNotFound("Resource not found");

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.kind !== undefined) updates.kind = body.kind;
    if (body.description !== undefined) updates.description = body.description;
    if (body.dailyRateCents !== undefined) updates.dailyRateCents = body.dailyRateCents;
    if (body.hourlyRateCents !== undefined) updates.hourlyRateCents = body.hourlyRateCents;
    if (body.licensePlate !== undefined) updates.licensePlate = body.licensePlate;
    if (body.capacity !== undefined) updates.capacity = body.capacity;
    if (body.active !== undefined) updates.active = body.active;
    if (body.notes !== undefined) updates.notes = body.notes;

    const [updated] = await db
      .update(resources)
      .set(updates)
      .where(eq(resources.id, body.id))
      .returning();

    await recordAudit({
      session,
      request,
      action: "resource.updated",
      entityType: "resource",
      entityId: body.id,
      before: {
        name: before.name,
        kind: before.kind,
        dailyRateCents: before.dailyRateCents,
        hourlyRateCents: before.hourlyRateCents,
        active: before.active,
      },
      after: updates,
    });

    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update resource", { error: String(err) });
    return apiError("Failed to update resource", 500);
  }
});

// DELETE /api/admin/resources?id=123 — soft-delete via active=false
// if the resource has any bookings (tentative/confirmed/etc.). Hard
// delete only when there's no booking history.
export const DELETE = withTiming("admin.resources.delete", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }

  const idRaw = request.nextUrl.searchParams.get("id");
  const id = Number(idRaw);
  if (!idRaw || !Number.isInteger(id) || id <= 0) return apiError("Valid id required", 400);

  try {
    const [before] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, id))
      .limit(1);
    if (!before) return apiNotFound("Resource not found");

    const [{ c }] = await db
      .select({ c: sql<number>`count(*)` })
      .from(resourceBookings)
      .where(eq(resourceBookings.resourceId, id));

    if (Number(c) > 0) {
      await db
        .update(resources)
        .set({ active: false, updatedAt: new Date().toISOString() })
        .where(eq(resources.id, id));
      await recordAudit({
        session,
        request,
        action: "resource.archived",
        entityType: "resource",
        entityId: id,
        before: { active: before.active },
        after: { active: false },
      });
      return NextResponse.json({ ok: true, archived: true });
    }

    await db.delete(resources).where(eq(resources.id, id));
    await recordAudit({
      session,
      request,
      action: "resource.deleted",
      entityType: "resource",
      entityId: id,
      before: { name: before.name },
      after: null,
    });
    return NextResponse.json({ ok: true, deleted: true });
  } catch (err) {
    logger.error("Failed to delete resource", { error: String(err) });
    return apiError("Failed to delete resource", 500);
  }
});

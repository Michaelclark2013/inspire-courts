import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  programs,
  programSessions,
  programRegistrations,
  users,
} from "@/lib/db/schema";
import { and, asc, desc, eq, gte, inArray, lt, sql, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import {
  programSessionCreateSchema,
  programSessionUpdateSchema,
} from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/programs/sessions — list sessions with enrolled-count.
//   ?programId=X — narrow to one program
//   ?from=ISO&to=ISO — window (default: today → +60d)
//   ?status= — filter
export const GET = withTiming("admin.program_sessions.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "programs")) {
    return apiError("Unauthorized", 401);
  }
  const sp = request.nextUrl.searchParams;
  const programIdRaw = sp.get("programId");
  const statusFilter = sp.get("status");
  const from = sp.get("from") || new Date().toISOString();
  const to = sp.get("to") || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const filters: SQL[] = [gte(programSessions.startsAt, from), lt(programSessions.startsAt, to)];
  const programId = Number(programIdRaw);
  if (programIdRaw && Number.isInteger(programId) && programId > 0) {
    filters.push(eq(programSessions.programId, programId));
  }
  if (statusFilter && ["scheduled", "live", "completed", "cancelled"].includes(statusFilter)) {
    filters.push(eq(programSessions.status, statusFilter as "scheduled" | "live" | "completed" | "cancelled"));
  }

  try {
    const rows = await db
      .select({
        id: programSessions.id,
        programId: programSessions.programId,
        programName: programs.name,
        programType: programs.type,
        defaultCapacity: programs.capacityPerSession,
        priceCents: programs.priceCents,
        startsAt: programSessions.startsAt,
        endsAt: programSessions.endsAt,
        instructorUserId: programSessions.instructorUserId,
        instructorName: users.name,
        location: programSessions.location,
        capacityOverride: programSessions.capacityOverride,
        status: programSessions.status,
        notes: programSessions.notes,
      })
      .from(programSessions)
      .leftJoin(programs, eq(programs.id, programSessions.programId))
      .leftJoin(users, eq(users.id, programSessions.instructorUserId))
      .where(and(...filters))
      .orderBy(asc(programSessions.startsAt));

    if (rows.length === 0) return NextResponse.json({ data: [], total: 0 });

    // Enrolled counts in one aggregate.
    const ids = rows.map((r) => r.id);
    const counts = await db
      .select({
        sessionId: programRegistrations.sessionId,
        enrolled: sql<number>`sum(case when ${programRegistrations.status} in ('registered','attended') then 1 else 0 end)`,
        waitlist: sql<number>`sum(case when ${programRegistrations.status} = 'waitlist' then 1 else 0 end)`,
        total: sql<number>`count(*)`,
      })
      .from(programRegistrations)
      .where(inArray(programRegistrations.sessionId, ids))
      .groupBy(programRegistrations.sessionId);
    const byId = new Map(counts.map((r) => [r.sessionId, r]));

    const enriched = rows.map((r) => {
      const c = byId.get(r.id);
      const cap = r.capacityOverride ?? r.defaultCapacity ?? null;
      const enrolled = Number(c?.enrolled) || 0;
      return {
        ...r,
        capacity: cap,
        enrolled,
        waitlist: Number(c?.waitlist) || 0,
        totalRegistrations: Number(c?.total) || 0,
        openSeats: cap != null ? Math.max(0, cap - enrolled) : null,
      };
    });
    return NextResponse.json({ data: enriched, total: enriched.length, from, to });
  } catch (err) {
    logger.error("Failed to fetch sessions", { error: String(err) });
    return apiError("Failed to fetch sessions", 500);
  }
});

export const POST = withTiming("admin.program_sessions.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "programs")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, programSessionCreateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const [created] = await db.insert(programSessions).values({
      programId: b.programId,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      instructorUserId: b.instructorUserId ?? null,
      location: b.location ?? null,
      capacityOverride: b.capacityOverride ?? null,
      status: b.status ?? "scheduled",
      notes: b.notes ?? null,
    }).returning();
    await recordAudit({
      session, request, action: "program_session.created",
      entityType: "program_session", entityId: created.id, before: null,
      after: { programId: b.programId, startsAt: created.startsAt },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create session", { error: String(err) });
    return apiError("Failed to create session", 500);
  }
});

export const PUT = withTiming("admin.program_sessions.update", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "programs")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, programSessionUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { id, ...rest } = parsed.data;
  try {
    const [before] = await db.select().from(programSessions).where(eq(programSessions.id, id)).limit(1);
    if (!before) return apiNotFound("Session not found");
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) updates[k] = v;
    const [updated] = await db.update(programSessions).set(updates).where(eq(programSessions.id, id)).returning();
    await recordAudit({
      session, request,
      action: rest.status && rest.status !== before.status ? `program_session.${rest.status}` : "program_session.updated",
      entityType: "program_session", entityId: id,
      before: { status: before.status, startsAt: before.startsAt },
      after: updates,
    });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update session", { error: String(err) });
    return apiError("Failed to update session", 500);
  }
});

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  programs,
  programSessions} from "@/lib/db/schema";
import { and , eq, gte, inArray, sql, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import { programCreateSchema, programUpdateSchema } from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/programs — list active programs with next-session
// and enrolled-count enrichments.
//   ?type=camp|clinic|league|open_gym|private_training|class
//   ?active=true (default) / false / any
export const GET = withTiming("admin.programs.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "programs")) {
    return apiError("Unauthorized", 401);
  }
  const sp = request.nextUrl.searchParams;
  const type = sp.get("type");
  const activeParam = sp.get("active");

  const filters: SQL[] = [];
  if (type && ["camp", "clinic", "league", "open_gym", "private_training", "class", "other"].includes(type)) {
    filters.push(
      eq(programs.type, type as "camp" | "clinic" | "league" | "open_gym" | "private_training" | "class" | "other")
    );
  }
  if (activeParam !== "any") {
    filters.push(eq(programs.active, activeParam === "false" ? false : true));
  }

  try {
    const rows = await db
      .select()
      .from(programs)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(programs.name);

    if (rows.length === 0) return NextResponse.json({ data: [], total: 0 });

    const ids = rows.map((r) => r.id);
    const nowIso = new Date().toISOString();
    const [upcoming, sessionCounts] = await Promise.all([
      db
        .select({
          programId: programSessions.programId,
          id: programSessions.id,
          startsAt: programSessions.startsAt,
          endsAt: programSessions.endsAt,
          status: programSessions.status,
          location: programSessions.location,
        })
        .from(programSessions)
        .where(
          and(
            inArray(programSessions.programId, ids),
            gte(programSessions.startsAt, nowIso)
          )
        )
        .orderBy(programSessions.startsAt),
      db
        .select({
          programId: programSessions.programId,
          total: sql<number>`count(*)`,
        })
        .from(programSessions)
        .where(inArray(programSessions.programId, ids))
        .groupBy(programSessions.programId),
    ]);

    const nextByProgram = new Map<number, typeof upcoming[number]>();
    for (const s of upcoming) if (!nextByProgram.has(s.programId)) nextByProgram.set(s.programId, s);
    const totalByProgram = new Map(sessionCounts.map((r) => [r.programId, Number(r.total) || 0]));

    const enriched = rows.map((r) => ({
      ...r,
      nextSession: nextByProgram.get(r.id) ?? null,
      totalSessions: totalByProgram.get(r.id) ?? 0,
    }));
    return NextResponse.json({ data: enriched, total: enriched.length });
  } catch (err) {
    logger.error("Failed to fetch programs", { error: String(err) });
    return apiError("Failed to fetch programs", 500);
  }
});

export const POST = withTiming("admin.programs.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "programs")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, programCreateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const createdBy = session.user.id ? Number(session.user.id) : null;
    const [created] = await db
      .insert(programs)
      .values({
        name: b.name,
        type: b.type ?? "camp",
        description: b.description ?? null,
        minAge: b.minAge ?? null,
        maxAge: b.maxAge ?? null,
        capacityPerSession: b.capacityPerSession ?? null,
        priceCents: b.priceCents ?? null,
        tags: b.tags ?? "",
        active: b.active ?? true,
        createdBy: createdBy && !isNaN(createdBy) ? createdBy : null,
      })
      .returning();
    await recordAudit({
      session, request, action: "program.created",
      entityType: "program", entityId: created.id, before: null,
      after: { name: created.name, type: created.type, priceCents: created.priceCents },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create program", { error: String(err) });
    return apiError("Failed to create program", 500);
  }
});

export const PUT = withTiming("admin.programs.update", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "programs")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, programUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { id, ...rest } = parsed.data;
  try {
    const [before] = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
    if (!before) return apiNotFound("Program not found");
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) updates[k] = v;
    const [updated] = await db.update(programs).set(updates).where(eq(programs.id, id)).returning();
    await recordAudit({
      session, request, action: "program.updated",
      entityType: "program", entityId: id,
      before: { name: before.name, priceCents: before.priceCents, active: before.active },
      after: updates,
    });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update program", { error: String(err) });
    return apiError("Failed to update program", 500);
  }
});

export const DELETE = withTiming("admin.programs.delete", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return apiError("Unauthorized", 401);
  }
  const idRaw = request.nextUrl.searchParams.get("id");
  const id = Number(idRaw);
  if (!idRaw || !Number.isInteger(id) || id <= 0) return apiError("Valid id required", 400);
  try {
    // Always archive — preserve session + registration history.
    await db.update(programs).set({ active: false, updatedAt: new Date().toISOString() }).where(eq(programs.id, id));
    await recordAudit({
      session, request, action: "program.archived",
      entityType: "program", entityId: id, before: null, after: { active: false },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Failed to archive program", { error: String(err) });
    return apiError("Failed to archive program", 500);
  }
});

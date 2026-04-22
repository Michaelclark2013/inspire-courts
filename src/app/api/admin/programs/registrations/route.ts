import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  programRegistrations,
  programSessions,
  programs,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import {
  programRegistrationCreateSchema,
  programRegistrationUpdateSchema,
} from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/programs/registrations?sessionId=X — roster for one session.
export const GET = withTiming("admin.program_registrations.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "programs")) {
    return apiError("Unauthorized", 401);
  }
  const sp = request.nextUrl.searchParams;
  const sessionIdRaw = sp.get("sessionId");
  const sessionId = Number(sessionIdRaw);
  if (!sessionIdRaw || !Number.isInteger(sessionId) || sessionId <= 0) {
    return apiError("sessionId required", 400);
  }
  try {
    const rows = await db
      .select()
      .from(programRegistrations)
      .where(eq(programRegistrations.sessionId, sessionId))
      .orderBy(programRegistrations.registeredAt);
    return NextResponse.json({ data: rows, total: rows.length });
  } catch (err) {
    logger.error("Failed to fetch registrations", { error: String(err) });
    return apiError("Failed to fetch registrations", 500);
  }
});

// POST — register a participant. Auto-waitlists if capacity is full,
// auto-fills amount from the program price if paid=true and no override.
export const POST = withTiming("admin.program_registrations.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "programs")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, programRegistrationCreateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    // Look up session + program to apply defaults.
    const [sessionRow] = await db
      .select({
        id: programSessions.id,
        capacityOverride: programSessions.capacityOverride,
        defaultCapacity: programs.capacityPerSession,
        priceCents: programs.priceCents,
        status: programSessions.status,
      })
      .from(programSessions)
      .leftJoin(programs, eq(programs.id, programSessions.programId))
      .where(eq(programSessions.id, b.sessionId))
      .limit(1);
    if (!sessionRow) return apiNotFound("Session not found");
    if (sessionRow.status === "cancelled") {
      return apiError("Session is cancelled — cannot register", 409);
    }

    // Auto-waitlist if at capacity.
    let status = b.status ?? "registered";
    const cap = sessionRow.capacityOverride ?? sessionRow.defaultCapacity;
    if (cap && status === "registered") {
      const [{ enrolled }] = await db
        .select({ enrolled: sql<number>`count(*)` })
        .from(programRegistrations)
        .where(
          and(
            eq(programRegistrations.sessionId, b.sessionId),
            sql`${programRegistrations.status} IN ('registered','attended')`
          )
        );
      if (Number(enrolled) >= cap) status = "waitlist";
    }

    const registeredBy = session.user.id ? Number(session.user.id) : null;
    const [created] = await db.insert(programRegistrations).values({
      sessionId: b.sessionId,
      memberId: b.memberId ?? null,
      userId: b.userId ?? null,
      participantName: b.participantName.trim(),
      participantEmail: b.participantEmail ?? null,
      participantPhone: b.participantPhone ?? null,
      guardianName: b.guardianName ?? null,
      guardianPhone: b.guardianPhone ?? null,
      status,
      paid: b.paid ?? false,
      amountCents: b.amountCents ?? sessionRow.priceCents ?? null,
      paymentMethod: b.paymentMethod ?? null,
      notes: b.notes ?? null,
      registeredBy: registeredBy && !isNaN(registeredBy) ? registeredBy : null,
    }).returning();
    await recordAudit({
      session, request, action: "program_registration.created",
      entityType: "program_registration", entityId: created.id, before: null,
      after: { sessionId: b.sessionId, participant: b.participantName, status },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to register", { error: String(err) });
    return apiError("Failed to register", 500);
  }
});

export const PUT = withTiming("admin.program_registrations.update", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "programs")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, programRegistrationUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { id, ...rest } = parsed.data;
  try {
    const [before] = await db.select().from(programRegistrations).where(eq(programRegistrations.id, id)).limit(1);
    if (!before) return apiNotFound("Registration not found");
    const updates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) updates[k] = v;
    const [updated] = await db.update(programRegistrations).set(updates).where(eq(programRegistrations.id, id)).returning();
    await recordAudit({
      session, request,
      action: rest.status && rest.status !== before.status ? `program_registration.${rest.status}` : "program_registration.updated",
      entityType: "program_registration", entityId: id,
      before: { status: before.status, paid: before.paid },
      after: updates,
    });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update registration", { error: String(err) });
    return apiError("Failed to update registration", 500);
  }
});

export const DELETE = withTiming("admin.program_registrations.delete", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "programs")) {
    return apiError("Unauthorized", 401);
  }
  const idRaw = request.nextUrl.searchParams.get("id");
  const id = Number(idRaw);
  if (!idRaw || !Number.isInteger(id) || id <= 0) return apiError("Valid id required", 400);
  try {
    const [before] = await db.select().from(programRegistrations).where(eq(programRegistrations.id, id)).limit(1);
    if (!before) return apiNotFound("Registration not found");
    // Soft-cancel to preserve history.
    await db.update(programRegistrations).set({ status: "cancelled" }).where(eq(programRegistrations.id, id));
    await recordAudit({
      session, request, action: "program_registration.cancelled",
      entityType: "program_registration", entityId: id,
      before: { status: before.status }, after: { status: "cancelled" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Failed to cancel registration", { error: String(err) });
    return apiError("Failed to cancel registration", 500);
  }
});

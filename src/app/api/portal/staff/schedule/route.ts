import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { shifts, shiftAssignments } from "@/lib/db/schema";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { shiftResponseSchema } from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/portal/schedule — returns the caller's upcoming assignments
// AND the currently open shifts (role-matched if possible) so the
// "claim an open shift" flow has everything in one round-trip.
export const GET = withTiming("portal.schedule", async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) return apiError("Unauthorized", 401);

  const nowIso = new Date().toISOString();

  try {
    const myAssignments = await db
      .select({
        assignmentId: shiftAssignments.id,
        status: shiftAssignments.status,
        payRateCentsOverride: shiftAssignments.payRateCentsOverride,
        bonusCents: shiftAssignments.bonusCents,
        notes: shiftAssignments.notes,
        shift: shifts,
      })
      .from(shiftAssignments)
      .leftJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(
        and(
          eq(shiftAssignments.userId, userId),
          gte(shifts.endAt, nowIso)
        )
      )
      .orderBy(shifts.startAt);

    // Open published shifts that still need headcount and that this
    // user isn't already on. Simple two-query approach (assignment
    // counts per shift, then filter client-side) — good enough until
    // shift volume becomes large.
    const published = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.status, "published"), gte(shifts.endAt, nowIso)))
      .orderBy(shifts.startAt);

    const publishedIds = published.map((p) => p.id);
    let counts: Record<number, number> = {};
    let myShiftIds = new Set<number>();
    if (publishedIds.length > 0) {
      const countRows = await db
        .select({
          shiftId: shiftAssignments.shiftId,
          c: sql<number>`count(*)`,
          hasMe: sql<number>`sum(case when ${shiftAssignments.userId} = ${userId} then 1 else 0 end)`,
        })
        .from(shiftAssignments)
        .where(
          and(
            inArray(shiftAssignments.shiftId, publishedIds),
            inArray(shiftAssignments.status, [
              "assigned",
              "confirmed",
              "completed",
            ])
          )
        )
        .groupBy(shiftAssignments.shiftId);

      counts = Object.fromEntries(countRows.map((r) => [r.shiftId, Number(r.c) || 0]));
      myShiftIds = new Set(
        countRows.filter((r) => Number(r.hasMe) > 0).map((r) => r.shiftId)
      );
    }

    const openShifts = published
      .filter(
        (s) =>
          !myShiftIds.has(s.id) &&
          (counts[s.id] ?? 0) < s.requiredHeadcount
      )
      .map((s) => ({ ...s, filled: counts[s.id] ?? 0 }));

    return NextResponse.json(
      { myAssignments, openShifts, asOf: nowIso },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("Failed to load portal schedule", { error: String(err) });
    return apiError("Failed to load schedule", 500);
  }
});

// PATCH /api/portal/schedule — worker-side confirm/decline of their
// own assignment. Rejects attempts to modify someone else's record.
export const PATCH = withTiming("portal.schedule.respond", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) return apiError("Unauthorized", 401);

  const parsed = await parseJsonBody(request, shiftResponseSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    const [before] = await db
      .select()
      .from(shiftAssignments)
      .where(eq(shiftAssignments.id, body.assignmentId))
      .limit(1);
    if (!before) return apiNotFound("Assignment not found");
    if (before.userId !== userId) {
      return apiError("You can only respond to your own assignments", 403);
    }
    if (before.status !== "assigned") {
      return apiError(
        `Assignment is already ${before.status} — cannot change`,
        409
      );
    }

    const nowIso = new Date().toISOString();
    const [updated] = await db
      .update(shiftAssignments)
      .set({
        status: body.response,
        respondedAt: nowIso,
        notes: body.notes ?? before.notes,
      })
      .where(eq(shiftAssignments.id, body.assignmentId))
      .returning();

    await recordAudit({
      session,
      request,
      action: `shift_assignment.worker_${body.response}`,
      entityType: "shift_assignment",
      entityId: body.assignmentId,
      before: { status: before.status },
      after: { status: body.response },
    });

    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to respond to shift", { error: String(err) });
    return apiError("Failed to respond", 500);
  }
});

// POST /api/portal/schedule — claim an open shift (self-assign).
export const POST = withTiming("portal.schedule.claim", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) return apiError("Unauthorized", 401);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }
  const shiftId = Number((raw as { shiftId?: unknown })?.shiftId);
  if (!Number.isInteger(shiftId) || shiftId <= 0) {
    return apiError("shiftId required", 400);
  }

  try {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, shiftId)).limit(1);
    if (!shift) return apiNotFound("Shift not found");
    if (shift.status !== "published") {
      return apiError("Shift is not open for claims", 409);
    }

    // Refuse if already claimed. Racing claims are benign — the
    // unique-ish index will reject the dupe at the DB layer too.
    const [existing] = await db
      .select({ id: shiftAssignments.id })
      .from(shiftAssignments)
      .where(
        and(eq(shiftAssignments.shiftId, shiftId), eq(shiftAssignments.userId, userId))
      )
      .limit(1);
    if (existing) return apiError("You are already on this shift", 409);

    // Refuse if headcount is already satisfied.
    const [{ filled }] = await db
      .select({ filled: sql<number>`count(*)` })
      .from(shiftAssignments)
      .where(
        and(
          eq(shiftAssignments.shiftId, shiftId),
          inArray(shiftAssignments.status, ["assigned", "confirmed", "completed"])
        )
      );
    if (Number(filled) >= shift.requiredHeadcount) {
      return apiError("Shift is fully staffed", 409);
    }

    const [created] = await db
      .insert(shiftAssignments)
      .values({
        shiftId,
        userId,
        status: "confirmed", // self-claim implies confirmation
        assignedBy: userId,
        respondedAt: new Date().toISOString(),
      })
      .returning();

    await recordAudit({
      session,
      request,
      action: "shift_assignment.self_claimed",
      entityType: "shift_assignment",
      entityId: created.id,
      before: null,
      after: { shiftId, userId },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to claim shift", { error: String(err) });
    return apiError("Failed to claim shift", 500);
  }
});

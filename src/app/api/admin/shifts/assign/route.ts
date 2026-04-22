import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { shifts, shiftAssignments, users } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import {
  shiftAssignSchema,
  shiftAssignmentPatchSchema,
} from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// POST /api/admin/shifts/assign — bulk assign workers to one shift.
// Skips users already assigned (idempotent). Returns the full list
// of assignments on the shift after the upsert.
export const POST = withTiming(
  "admin.shifts.assign",
  async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
      return apiError("Unauthorized", 401);
    }

    const parsed = await parseJsonBody(request, shiftAssignSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    try {
      const [shift] = await db
        .select()
        .from(shifts)
        .where(eq(shifts.id, body.shiftId))
        .limit(1);
      if (!shift) return apiNotFound("Shift not found");

      // Filter out users who are already on this shift — keeps the call
      // idempotent so the same userIds[] can be retried safely.
      const existing = await db
        .select({ userId: shiftAssignments.userId })
        .from(shiftAssignments)
        .where(
          and(
            eq(shiftAssignments.shiftId, body.shiftId),
            inArray(shiftAssignments.userId, body.userIds)
          )
        );
      const existingSet = new Set(existing.map((e) => e.userId));
      const toInsert = body.userIds.filter((u) => !existingSet.has(u));

      const approverId = session.user.id ? Number(session.user.id) : null;
      if (toInsert.length > 0) {
        await db.insert(shiftAssignments).values(
          toInsert.map((userId) => ({
            shiftId: body.shiftId,
            userId,
            status: "assigned" as const,
            payRateCentsOverride: body.payRateCentsOverride ?? null,
            bonusCents: body.bonusCents ?? 0,
            assignedBy: approverId && !isNaN(approverId) ? approverId : null,
            notes: body.notes ?? null,
          }))
        );
      }

      // Return the canonical post-upsert list so the UI doesn't have
      // to re-fetch separately.
      const all = await db
        .select({
          id: shiftAssignments.id,
          shiftId: shiftAssignments.shiftId,
          userId: shiftAssignments.userId,
          name: users.name,
          email: users.email,
          status: shiftAssignments.status,
          payRateCentsOverride: shiftAssignments.payRateCentsOverride,
          bonusCents: shiftAssignments.bonusCents,
          assignedAt: shiftAssignments.assignedAt,
        })
        .from(shiftAssignments)
        .leftJoin(users, eq(users.id, shiftAssignments.userId))
        .where(eq(shiftAssignments.shiftId, body.shiftId));

      await recordAudit({
        session,
        request,
        action: "shift.assigned",
        entityType: "shift",
        entityId: body.shiftId,
        before: null,
        after: {
          newAssignments: toInsert,
          alreadyAssigned: body.userIds.filter((u) => existingSet.has(u)),
        },
      });

      return NextResponse.json(
        { shiftId: body.shiftId, added: toInsert, assignments: all },
        { status: 201 }
      );
    } catch (err) {
      logger.error("Failed to assign shift", { error: String(err) });
      return apiError("Failed to assign shift", 500);
    }
  }
);

// PATCH /api/admin/shifts/assign — admin-side edit of a single
// assignment (status change, rate override, bonus).
export const PATCH = withTiming(
  "admin.shifts.assignment_patch",
  async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
      return apiError("Unauthorized", 401);
    }

    const parsed = await parseJsonBody(request, shiftAssignmentPatchSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    try {
      const [before] = await db
        .select()
        .from(shiftAssignments)
        .where(eq(shiftAssignments.id, body.assignmentId))
        .limit(1);
      if (!before) return apiNotFound("Assignment not found");

      const updates: Record<string, unknown> = {};
      if (body.status !== undefined) {
        updates.status = body.status;
        if (body.status === "confirmed" || body.status === "declined") {
          updates.respondedAt = new Date().toISOString();
        }
      }
      if (body.payRateCentsOverride !== undefined)
        updates.payRateCentsOverride = body.payRateCentsOverride;
      if (body.bonusCents !== undefined) updates.bonusCents = body.bonusCents;
      if (body.notes !== undefined) updates.notes = body.notes;

      const [updated] = await db
        .update(shiftAssignments)
        .set(updates)
        .where(eq(shiftAssignments.id, body.assignmentId))
        .returning();

      await recordAudit({
        session,
        request,
        action: `shift_assignment.${body.status ?? "edited"}`,
        entityType: "shift_assignment",
        entityId: body.assignmentId,
        before: {
          status: before.status,
          payRateCentsOverride: before.payRateCentsOverride,
          bonusCents: before.bonusCents,
        },
        after: updates,
      });

      return NextResponse.json(updated);
    } catch (err) {
      logger.error("Failed to patch assignment", { error: String(err) });
      return apiError("Failed to update assignment", 500);
    }
  }
);

// DELETE /api/admin/shifts/assign?id=123 — remove an assignment
// outright. Different from a status=declined in that the worker's
// history loses the record; used when the admin made a mistake.
export const DELETE = withTiming(
  "admin.shifts.assignment_delete",
  async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
      return apiError("Unauthorized", 401);
    }

    const idRaw = request.nextUrl.searchParams.get("id");
    const id = Number(idRaw);
    if (!idRaw || !Number.isInteger(id) || id <= 0)
      return apiError("Valid id required", 400);

    try {
      const [before] = await db
        .select()
        .from(shiftAssignments)
        .where(eq(shiftAssignments.id, id))
        .limit(1);
      if (!before) return apiNotFound("Assignment not found");

      await db.delete(shiftAssignments).where(eq(shiftAssignments.id, id));

      await recordAudit({
        session,
        request,
        action: "shift_assignment.removed",
        entityType: "shift_assignment",
        entityId: id,
        before: {
          shiftId: before.shiftId,
          userId: before.userId,
          status: before.status,
        },
        after: null,
      });

      return NextResponse.json({ ok: true });
    } catch (err) {
      logger.error("Failed to delete assignment", { error: String(err) });
      return apiError("Failed to delete assignment", 500);
    }
  }
);

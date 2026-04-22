import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeOffRequests, users } from "@/lib/db/schema";
import { and, desc, eq, gte, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import {
  timeOffRequestCreateSchema,
  timeOffRequestPatchSchema,
} from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/time-off
//   ?status=pending|approved|denied|cancelled  (default: pending)
//   ?userId=X
//   ?upcoming=true — only requests whose start is in the future
export const GET = withTiming("admin.time_off.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "time_off")) {
    return apiError("Unauthorized", 401);
  }
  const sp = request.nextUrl.searchParams;
  const statusFilter = sp.get("status") || "pending";
  const userIdRaw = sp.get("userId");
  const upcomingOnly = sp.get("upcoming") === "true";

  const filters: SQL[] = [];
  if (["pending", "approved", "denied", "cancelled"].includes(statusFilter)) {
    filters.push(eq(timeOffRequests.status, statusFilter as "pending" | "approved" | "denied" | "cancelled"));
  }
  const userId = Number(userIdRaw);
  if (userIdRaw && Number.isInteger(userId) && userId > 0) {
    filters.push(eq(timeOffRequests.userId, userId));
  }
  if (upcomingOnly) {
    filters.push(gte(timeOffRequests.startDate, new Date().toISOString().slice(0, 10)));
  }

  try {
    const rows = await db
      .select({
        id: timeOffRequests.id,
        userId: timeOffRequests.userId,
        name: users.name,
        email: users.email,
        startDate: timeOffRequests.startDate,
        endDate: timeOffRequests.endDate,
        type: timeOffRequests.type,
        status: timeOffRequests.status,
        reason: timeOffRequests.reason,
        approvedBy: timeOffRequests.approvedBy,
        approvedAt: timeOffRequests.approvedAt,
        denialReason: timeOffRequests.denialReason,
        createdAt: timeOffRequests.createdAt,
      })
      .from(timeOffRequests)
      .leftJoin(users, eq(users.id, timeOffRequests.userId))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(timeOffRequests.startDate));
    return NextResponse.json({ data: rows, total: rows.length });
  } catch (err) {
    logger.error("Failed to fetch time-off", { error: String(err) });
    return apiError("Failed to fetch requests", 500);
  }
});

// POST — admin can file a request on behalf of a worker, or the
// /api/portal/time-off route (not built yet) can forward here with
// userId set to the session owner.
export const POST = withTiming("admin.time_off.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "time_off")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, timeOffRequestCreateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  const sessionUserId = session.user.id ? Number(session.user.id) : null;
  const userId = b.userId ?? (sessionUserId && !isNaN(sessionUserId) ? sessionUserId : null);
  if (!userId) return apiError("userId required", 400);
  try {
    const [created] = await db.insert(timeOffRequests).values({
      userId,
      startDate: b.startDate,
      endDate: b.endDate,
      type: b.type ?? "pto",
      status: "pending",
      reason: b.reason ?? null,
    }).returning();
    await recordAudit({
      session, request, action: "time_off.requested",
      entityType: "time_off_request", entityId: created.id, before: null,
      after: { userId, startDate: b.startDate, endDate: b.endDate, type: created.type },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create time-off", { error: String(err) });
    return apiError("Failed to create request", 500);
  }
});

// PATCH — approve / deny. Stamps approvedBy + approvedAt on the
// transition so the audit surface answers "who approved Jake's PTO".
export const PATCH = withTiming("admin.time_off.decide", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "time_off")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, timeOffRequestPatchSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const [before] = await db.select().from(timeOffRequests).where(eq(timeOffRequests.id, b.id)).limit(1);
    if (!before) return apiNotFound("Request not found");
    const approver = session.user.id ? Number(session.user.id) : null;
    const updates: Record<string, unknown> = {
      status: b.status,
      updatedAt: new Date().toISOString(),
    };
    if (b.status === "approved" || b.status === "denied") {
      updates.approvedBy = approver && !isNaN(approver) ? approver : null;
      updates.approvedAt = new Date().toISOString();
    }
    if (b.status === "denied" && b.denialReason) {
      updates.denialReason = b.denialReason;
    }
    const [updated] = await db.update(timeOffRequests).set(updates).where(eq(timeOffRequests.id, b.id)).returning();
    await recordAudit({
      session, request, action: `time_off.${b.status}`,
      entityType: "time_off_request", entityId: b.id,
      before: { status: before.status }, after: updates,
    });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to decide time-off", { error: String(err) });
    return apiError("Failed to update request", 500);
  }
});

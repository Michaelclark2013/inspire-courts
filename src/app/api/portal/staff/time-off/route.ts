import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeOffRequests } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { timeOffRequestCreateSchema } from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// Portal-side: workers view + file their own time-off requests.
// Admin approves via /api/admin/time-off.

export const GET = withTiming("portal.time_off.list", async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) return apiError("Unauthorized", 401);
  try {
    const rows = await db
      .select()
      .from(timeOffRequests)
      .where(eq(timeOffRequests.userId, userId))
      .orderBy(desc(timeOffRequests.startDate));
    return NextResponse.json({ data: rows, total: rows.length });
  } catch (err) {
    logger.error("Portal time-off list failed", { error: String(err) });
    return apiError("Failed to load", 500);
  }
});

export const POST = withTiming("portal.time_off.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) return apiError("Unauthorized", 401);
  const parsed = await parseJsonBody(request, timeOffRequestCreateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const [created] = await db
      .insert(timeOffRequests)
      .values({
        userId, // Always the session owner — portal can't submit for others.
        startDate: b.startDate,
        endDate: b.endDate,
        type: b.type ?? "pto",
        status: "pending",
        reason: b.reason ?? null,
      })
      .returning();
    await recordAudit({
      session, request, action: "time_off.requested",
      entityType: "time_off_request", entityId: created.id, before: null,
      after: { userId, startDate: b.startDate, endDate: b.endDate, type: created.type },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Portal time-off create failed", { error: String(err) });
    return apiError("Failed to submit", 500);
  }
});

// DELETE cancel your own pending request.
export const DELETE = withTiming("portal.time_off.cancel", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) return apiError("Unauthorized", 401);
  const idRaw = request.nextUrl.searchParams.get("id");
  const id = Number(idRaw);
  if (!idRaw || !Number.isInteger(id) || id <= 0) return apiError("Valid id required", 400);
  try {
    const [before] = await db.select().from(timeOffRequests).where(eq(timeOffRequests.id, id)).limit(1);
    if (!before) return apiNotFound("Request not found");
    if (before.userId !== userId) return apiError("Can only cancel your own requests", 403);
    if (before.status !== "pending") return apiError("Only pending requests can be cancelled from the portal", 409);
    await db.update(timeOffRequests).set({ status: "cancelled", updatedAt: new Date().toISOString() }).where(eq(timeOffRequests.id, id));
    await recordAudit({
      session, request, action: "time_off.cancelled",
      entityType: "time_off_request", entityId: id,
      before: { status: before.status }, after: { status: "cancelled" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Portal time-off cancel failed", { error: String(err) });
    return apiError("Failed to cancel", 500);
  }
});

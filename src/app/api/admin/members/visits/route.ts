import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberVisits, members, users } from "@/lib/db/schema";
import { and, desc, eq, gte, sql, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import { memberVisitCreateSchema } from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/members/visits — list visits for one member OR a feed
// of today's visits across all members (front-desk live board).
//   ?memberId=123 — per-member history
//   no param — today's feed (visitedAt >= midnight UTC)
export const GET = withTiming("admin.member_visits.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "members")) {
    return apiError("Unauthorized", 401);
  }
  const sp = request.nextUrl.searchParams;
  const memberIdRaw = sp.get("memberId");

  const filters: SQL[] = [];
  const memberId = Number(memberIdRaw);
  if (memberIdRaw && Number.isInteger(memberId) && memberId > 0) {
    filters.push(eq(memberVisits.memberId, memberId));
  } else {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    filters.push(gte(memberVisits.visitedAt, today.toISOString()));
  }

  try {
    const rows = await db
      .select({
        id: memberVisits.id,
        memberId: memberVisits.memberId,
        firstName: members.firstName,
        lastName: members.lastName,
        type: memberVisits.type,
        visitedAt: memberVisits.visitedAt,
        checkedInBy: memberVisits.checkedInBy,
        checkedInByName: users.name,
        notes: memberVisits.notes,
      })
      .from(memberVisits)
      .leftJoin(members, eq(members.id, memberVisits.memberId))
      .leftJoin(users, eq(users.id, memberVisits.checkedInBy))
      .where(and(...filters))
      .orderBy(desc(memberVisits.visitedAt))
      .limit(200);
    return NextResponse.json({ data: rows, total: rows.length });
  } catch (err) {
    logger.error("Failed to fetch visits", { error: String(err) });
    return apiError("Failed to fetch visits", 500);
  }
});

// POST /api/admin/members/visits — log a member check-in. Validates the
// member is in a visit-eligible status (active or trial); rejects
// cancelled/past_due with an actionable 409 so front desk can resolve
// the billing issue before letting them in.
export const POST = withTiming("admin.member_visits.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "members")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, memberVisitCreateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const [member] = await db
      .select({ id: members.id, status: members.status })
      .from(members)
      .where(eq(members.id, b.memberId))
      .limit(1);
    if (!member) return apiNotFound("Member not found");
    if (member.status === "cancelled" || member.status === "past_due") {
      return apiError(
        `Member status is ${member.status} — resolve billing before check-in`,
        409,
        { extras: { memberId: member.id, status: member.status } }
      );
    }
    const checkedInBy = session.user.id ? Number(session.user.id) : null;
    const [created] = await db
      .insert(memberVisits)
      .values({
        memberId: b.memberId,
        type: b.type ?? "open_gym",
        visitedAt: b.visitedAt ?? new Date().toISOString(),
        checkedInBy: checkedInBy && !isNaN(checkedInBy) ? checkedInBy : null,
        notes: b.notes ?? null,
      })
      .returning();
    await recordAudit({
      session, request, action: "member_visit.logged",
      entityType: "member_visit", entityId: created.id, before: null,
      after: { memberId: b.memberId, type: created.type },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to log visit", { error: String(err) });
    return apiError("Failed to log visit", 500);
  }
});

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { members, membershipPlans, memberVisits } from "@/lib/db/schema";
import { and, asc, desc, eq, gte, like, lt, or, sql, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import {
  memberCreateSchema,
  memberUpdateSchema,
} from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// GET /api/admin/members — list members with joined plan name + last
// visit timestamp. Supports status/plan filter, search across
// name/email/phone, and pagination.
export const GET = withTiming("admin.members.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "members")) {
    return apiError("Unauthorized", 401);
  }

  const sp = request.nextUrl.searchParams;
  const statusFilter = sp.get("status");
  const planIdRaw = sp.get("planId");
  const q = (sp.get("q") || "").trim().slice(0, 100);
  const renewingSoon = sp.get("renewingSoon") === "true";

  const filters: SQL[] = [];
  if (statusFilter && ["active", "paused", "past_due", "cancelled", "trial"].includes(statusFilter)) {
    filters.push(eq(members.status, statusFilter as "active" | "paused" | "past_due" | "cancelled" | "trial"));
  }
  const planId = Number(planIdRaw);
  if (planIdRaw && Number.isInteger(planId) && planId > 0) {
    filters.push(eq(members.membershipPlanId, planId));
  }
  if (q.length >= 2) {
    const needle = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    const searchClause = or(
      like(members.firstName, needle),
      like(members.lastName, needle),
      like(members.email, needle),
      like(members.phone, needle),
    );
    if (searchClause) filters.push(searchClause);
  }
  if (renewingSoon) {
    // "Renewing this week" — next_renewal_at within 7 days.
    const nowIso = new Date().toISOString();
    const weekOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    filters.push(gte(members.nextRenewalAt, nowIso));
    filters.push(lt(members.nextRenewalAt, weekOut));
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const MAX = 200;
  const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
  const rawLimit = Math.floor(Number(sp.get("limit")) || 50);
  const limit = Math.min(Math.max(1, rawLimit || 50), MAX);
  const offset = (page - 1) * limit;

  const sortKey = sp.get("sort") || "lastName";
  const sortDir = sp.get("dir") === "desc" ? desc : asc;
  const sortCol =
    sortKey === "joinedAt" ? members.joinedAt
    : sortKey === "nextRenewalAt" ? members.nextRenewalAt
    : sortKey === "status" ? members.status
    : members.lastName;

  try {
    // lastVisitAt is computed via a correlated subquery so the entire
    // page of rows comes back in one round-trip (paired in parallel with
    // the count query). The previous implementation issued a third
    // serial query against member_visits — the hottest write table in
    // the schema — to attach this column, which was the dominant cost
    // on this endpoint.
    const lastVisitSubquery = sql<string | null>`(
      SELECT MAX(${memberVisits.visitedAt})
      FROM ${memberVisits}
      WHERE ${memberVisits.memberId} = ${members.id}
    )`;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id: members.id,
          userId: members.userId,
          firstName: members.firstName,
          lastName: members.lastName,
          email: members.email,
          phone: members.phone,
          status: members.status,
          source: members.source,
          joinedAt: members.joinedAt,
          nextRenewalAt: members.nextRenewalAt,
          autoRenew: members.autoRenew,
          planId: members.membershipPlanId,
          planName: membershipPlans.name,
          planType: membershipPlans.type,
          lastVisitAt: lastVisitSubquery,
        })
        .from(members)
        .leftJoin(membershipPlans, eq(membershipPlans.id, members.membershipPlanId))
        .where(whereClause)
        .orderBy(sortDir(sortCol))
        .limit(limit)
        .offset(offset),
      db.select({ total: sql<number>`count(*)` }).from(members).where(whereClause),
    ]);

    return NextResponse.json({
      data: rows,
      total: Number(total) || 0,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil((Number(total) || 0) / limit)),
    });
  } catch (err) {
    logger.error("Failed to fetch members", { error: String(err) });
    return apiError("Failed to fetch members", 500);
  }
});

export const POST = withTiming("admin.members.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "members")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, memberCreateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  try {
    const createdBy = session.user.id ? Number(session.user.id) : null;
    // Auto-link to a matching user account by email so the member
    // sees their gym membership in /portal without an admin
    // re-typing it. Only fires when caller didn't supply userId.
    let autoLinkedUserId: number | null = null;
    const memberEmail = b.email ? b.email.trim().toLowerCase() : null;
    if (!b.userId && memberEmail) {
      try {
        const { users } = await import("@/lib/db/schema");
        const { sql } = await import("drizzle-orm");
        const [u] = await db
          .select({ id: users.id })
          .from(users)
          .where(sql`lower(${users.email}) = ${memberEmail}`)
          .limit(1);
        if (u) autoLinkedUserId = u.id;
      } catch (err) {
        logger.warn("member auto-link to user failed", { error: String(err) });
      }
    }
    const [created] = await db
      .insert(members)
      .values({
        userId: b.userId ?? autoLinkedUserId,
        firstName: b.firstName.trim(),
        lastName: b.lastName.trim(),
        email: b.email ? b.email.trim().toLowerCase() : null,
        phone: b.phone ?? null,
        birthDate: b.birthDate ?? null,
        membershipPlanId: b.membershipPlanId ?? null,
        status: b.status ?? "active",
        source: b.source ?? "walk_in",
        joinedAt: b.joinedAt,
        nextRenewalAt: b.nextRenewalAt ?? null,
        autoRenew: b.autoRenew ?? true,
        paymentMethod: b.paymentMethod ?? null,
        emergencyContactJson: b.emergencyContactJson ?? null,
        primaryMemberId: b.primaryMemberId ?? null,
        notes: b.notes ?? null,
        createdBy: createdBy && !isNaN(createdBy) ? createdBy : null,
      })
      .returning();
    await recordAudit({
      session, request, action: "member.created",
      entityType: "member", entityId: created.id, before: null,
      after: { name: `${created.firstName} ${created.lastName}`, status: created.status, planId: created.membershipPlanId },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create member", { error: String(err) });
    return apiError("Failed to create member", 500);
  }
});

export const PUT = withTiming("admin.members.update", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "members")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, memberUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { id, ...rest } = parsed.data;
  try {
    const [before] = await db.select().from(members).where(eq(members.id, id)).limit(1);
    if (!before) return apiNotFound("Member not found");
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) updates[k] = v;
    const [updated] = await db.update(members).set(updates).where(eq(members.id, id)).returning();
    const statusChanged = rest.status !== undefined && rest.status !== before.status;
    await recordAudit({
      session, request,
      action: statusChanged ? `member.${rest.status}` : "member.updated",
      entityType: "member", entityId: id,
      before: { status: before.status, planId: before.membershipPlanId, nextRenewalAt: before.nextRenewalAt },
      after: updates,
    });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update member", { error: String(err) });
    return apiError("Failed to update member", 500);
  }
});

export const DELETE = withTiming("admin.members.delete", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return apiError("Unauthorized", 401);
  }
  const idRaw = request.nextUrl.searchParams.get("id");
  const id = Number(idRaw);
  if (!idRaw || !Number.isInteger(id) || id <= 0) return apiError("Valid id required", 400);
  try {
    const [before] = await db.select().from(members).where(eq(members.id, id)).limit(1);
    if (!before) return apiNotFound("Member not found");
    // Soft-cancel — visits + family links stay intact.
    await db.update(members).set({ status: "cancelled", autoRenew: false, updatedAt: new Date().toISOString() }).where(eq(members.id, id));
    await recordAudit({
      session, request, action: "member.cancelled",
      entityType: "member", entityId: id,
      before: { status: before.status }, after: { status: "cancelled" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Failed to cancel member", { error: String(err) });
    return apiError("Failed to cancel member", 500);
  }
});

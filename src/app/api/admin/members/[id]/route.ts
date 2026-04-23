import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { members, membershipPlans, memberVisits, users } from "@/lib/db/schema";
import { desc, eq , sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { canAccess } from "@/lib/permissions";
import { apiError, apiNotFound, azMonthStartIso } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/members/[id] — full member detail: profile + plan
// + recent 50 visits + month-to-date visit count.
export const GET = withTiming("admin.members.detail", async (_request: NextRequest, { params }: Params) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "members")) {
    return apiError("Unauthorized", 401);
  }
  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId) || memberId <= 0) return apiError("Invalid id", 400);

  try {
    const [member] = await db
      .select({
        id: members.id,
        userId: members.userId,
        firstName: members.firstName,
        lastName: members.lastName,
        email: members.email,
        phone: members.phone,
        birthDate: members.birthDate,
        status: members.status,
        source: members.source,
        joinedAt: members.joinedAt,
        nextRenewalAt: members.nextRenewalAt,
        autoRenew: members.autoRenew,
        pausedUntil: members.pausedUntil,
        paymentMethod: members.paymentMethod,
        emergencyContactJson: members.emergencyContactJson,
        primaryMemberId: members.primaryMemberId,
        notes: members.notes,
        renewalReminderSentAt: members.renewalReminderSentAt,
        createdAt: members.createdAt,
        planId: members.membershipPlanId,
        planName: membershipPlans.name,
        planType: membershipPlans.type,
        planMonthlyCents: membershipPlans.priceMonthlyCents,
        planAnnualCents: membershipPlans.priceAnnualCents,
        maxVisitsPerMonth: membershipPlans.maxVisitsPerMonth,
        maxVisitsPerWeek: membershipPlans.maxVisitsPerWeek,
      })
      .from(members)
      .leftJoin(membershipPlans, eq(membershipPlans.id, members.membershipPlanId))
      .where(eq(members.id, memberId))
      .limit(1);
    if (!member) return apiNotFound("Member not found");

    // "This month" rolls over at midnight Arizona time, not UTC.
    const monthStart = azMonthStartIso();

    const [visits, [{ monthTotal }], dependents] = await Promise.all([
      db
        .select({
          id: memberVisits.id,
          type: memberVisits.type,
          visitedAt: memberVisits.visitedAt,
          checkedInByName: users.name,
          notes: memberVisits.notes,
        })
        .from(memberVisits)
        .leftJoin(users, eq(users.id, memberVisits.checkedInBy))
        .where(eq(memberVisits.memberId, memberId))
        .orderBy(desc(memberVisits.visitedAt))
        .limit(50),
      db
        .select({ monthTotal: sql<number>`count(*)` })
        .from(memberVisits)
        .where(
          sql`${memberVisits.memberId} = ${memberId} AND ${memberVisits.visitedAt} >= ${monthStart}`
        ),
      // Family plan dependents linked to this member.
      db
        .select({
          id: members.id,
          firstName: members.firstName,
          lastName: members.lastName,
          status: members.status,
        })
        .from(members)
        .where(eq(members.primaryMemberId, memberId)),
    ]);

    return NextResponse.json(
      {
        member,
        visits,
        monthVisitCount: Number(monthTotal) || 0,
        dependents,
      },
      { headers: { "Cache-Control": "private, max-age=5" } }
    );
  } catch (err) {
    logger.error("Failed to load member detail", { error: String(err) });
    return apiError("Failed to load member", 500);
  }
});

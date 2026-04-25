import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions, invoices, members } from "@/lib/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/billing/snapshot — overview dashboard data.
function startOfMonth(): string {
  const x = new Date();
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const monthStart = startOfMonth();

    const [
      mrrRow,
      activeRow,
      pastDueRow,
      trialingRow,
      pausedRow,
      revThisMonthRow,
      failedThisMonthRow,
      pastDueList,
      recentFailures,
      upcomingRenewals,
    ] = await Promise.all([
      db
        .select({ cents: sql<number>`COALESCE(SUM(${subscriptions.priceCents}), 0)` })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active")),
      db.select({ n: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, "active")),
      db.select({ n: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, "past_due")),
      db.select({ n: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, "trialing")),
      db.select({ n: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, "paused")),
      db
        .select({ cents: sql<number>`COALESCE(SUM(${invoices.amountCents}), 0)` })
        .from(invoices)
        .where(and(eq(invoices.status, "paid"), gte(invoices.paidAt, monthStart))),
      db
        .select({ n: sql<number>`count(*)`, cents: sql<number>`COALESCE(SUM(${invoices.amountCents}), 0)` })
        .from(invoices)
        .where(and(eq(invoices.status, "failed"), gte(invoices.attemptedAt, monthStart))),
      db
        .select({
          id: subscriptions.id,
          memberId: subscriptions.memberId,
          firstName: members.firstName,
          lastName: members.lastName,
          email: members.email,
          priceCents: subscriptions.priceCents,
          failedAttempts: subscriptions.failedAttempts,
          nextRetryAt: subscriptions.nextRetryAt,
        })
        .from(subscriptions)
        .leftJoin(members, eq(subscriptions.memberId, members.id))
        .where(eq(subscriptions.status, "past_due"))
        .orderBy(desc(subscriptions.failedAttempts))
        .limit(20),
      db
        .select({
          id: invoices.id,
          memberId: invoices.memberId,
          firstName: members.firstName,
          lastName: members.lastName,
          amountCents: invoices.amountCents,
          failureCode: invoices.failureCode,
          attemptedAt: invoices.attemptedAt,
        })
        .from(invoices)
        .leftJoin(members, eq(invoices.memberId, members.id))
        .where(and(eq(invoices.status, "failed"), gte(invoices.attemptedAt, monthStart)))
        .orderBy(desc(invoices.attemptedAt))
        .limit(10),
      db
        .select({
          id: subscriptions.id,
          firstName: members.firstName,
          lastName: members.lastName,
          priceCents: subscriptions.priceCents,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
        })
        .from(subscriptions)
        .leftJoin(members, eq(subscriptions.memberId, members.id))
        .where(eq(subscriptions.status, "active"))
        .orderBy(subscriptions.currentPeriodEnd)
        .limit(10),
    ]);

    return NextResponse.json(
      {
        mrr: { cents: Number(mrrRow[0]?.cents) || 0 },
        counts: {
          active: Number(activeRow[0]?.n) || 0,
          pastDue: Number(pastDueRow[0]?.n) || 0,
          trialing: Number(trialingRow[0]?.n) || 0,
          paused: Number(pausedRow[0]?.n) || 0,
        },
        revenueThisMonth: { cents: Number(revThisMonthRow[0]?.cents) || 0 },
        failedThisMonth: {
          count: Number(failedThisMonthRow[0]?.n) || 0,
          cents: Number(failedThisMonthRow[0]?.cents) || 0,
        },
        pastDueSubscriptions: pastDueList,
        recentFailures,
        upcomingRenewals,
      },
      { headers: { "Cache-Control": "private, max-age=60" } }
    );
  } catch (err) {
    logger.error("billing snapshot failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

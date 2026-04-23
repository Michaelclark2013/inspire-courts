import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  members,
  membershipPlans,
  memberVisits,
  resourceBookings,
  programRegistrations,
  tournamentRegistrations,
  payPeriods} from "@/lib/db/schema";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { canAccess } from "@/lib/permissions";
import { withTiming } from "@/lib/timing";
import { computePayrollRollup } from "@/lib/payroll";

// GET /api/admin/reports — one-shot business KPIs for the reports
// hub. Intentionally not paginated (all counts + aggregates).
//
// Returns:
//   members: active, trial, past_due, churn30, newThisMonth, visitsThisMonth
//   revenue: mrr (sum of active-plan monthly prices), programRevMonth,
//            rentalRevMonth, tournamentFeesMonth, totalMonth
//   payroll: lockedGrossThisMonth, openPeriodEstimate, openPeriodId
//   tournaments: pendingRegistrations, paidThisMonth
//   rentals: activeBookingsCount, hoursRentedMonth
export const GET = withTiming("admin.reports", async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "analytics")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monthStartIso = monthStart.toISOString();
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();
  const nowIso = now.toISOString();

  try {
    // Parallel fan-out — every KPI is its own aggregate query so they
    // can run concurrently. Faster than a monster join-everything.
    const [
      activeMembers,
      trialMembers,
      pastDueMembers,
      newThisMonth,
      cancelledLast30,
      visitsThisMonth,
      activePlans,
      programRevRows,
      rentalRevRows,
      rentalActiveCount,
      rentalHoursRows,
      tournamentPendingCount,
      tournamentPaidMonthRows,
      activeOpenPeriodRows,
    ] = await Promise.all([
      db.select({ c: sql<number>`count(*)` }).from(members).where(eq(members.status, "active")),
      db.select({ c: sql<number>`count(*)` }).from(members).where(eq(members.status, "trial")),
      db.select({ c: sql<number>`count(*)` }).from(members).where(eq(members.status, "past_due")),
      db.select({ c: sql<number>`count(*)` }).from(members).where(gte(members.joinedAt, monthStartIso)),
      db.select({ c: sql<number>`count(*)` }).from(members).where(
        and(eq(members.status, "cancelled"), gte(members.updatedAt, thirtyDaysAgoIso))
      ),
      db.select({ c: sql<number>`count(*)` }).from(memberVisits).where(gte(memberVisits.visitedAt, monthStartIso)),
      // Active-plan monthly price sum = MRR. Joins members → plans,
      // counts monthly price only (annual plans are divided by 12).
      db
        .select({
          monthly: sql<number>`coalesce(sum(${membershipPlans.priceMonthlyCents}), 0)`,
          annualAsMonthly: sql<number>`coalesce(sum(case when ${membershipPlans.priceMonthlyCents} is null then ${membershipPlans.priceAnnualCents} / 12.0 else 0 end), 0)`,
        })
        .from(members)
        .leftJoin(membershipPlans, eq(membershipPlans.id, members.membershipPlanId))
        .where(eq(members.status, "active")),
      db
        .select({ total: sql<number>`coalesce(sum(${programRegistrations.amountCents}), 0)` })
        .from(programRegistrations)
        .where(
          and(
            eq(programRegistrations.paid, true),
            gte(programRegistrations.registeredAt, monthStartIso)
          )
        ),
      db
        .select({ total: sql<number>`coalesce(sum(${resourceBookings.amountCents}), 0)` })
        .from(resourceBookings)
        .where(
          and(
            eq(resourceBookings.paid, true),
            gte(resourceBookings.createdAt, monthStartIso)
          )
        ),
      db
        .select({ c: sql<number>`count(*)` })
        .from(resourceBookings)
        .where(
          and(
            lt(resourceBookings.startAt, nowIso),
            sql`${resourceBookings.endAt} > ${nowIso}`,
            sql`${resourceBookings.status} in ('confirmed','in_use','tentative')`
          )
        ),
      // Total hours rented this month (sum duration across bookings
      // whose end falls in this month).
      db
        .select({
          minutes: sql<number>`coalesce(sum(
            (CAST(strftime('%s', ${resourceBookings.endAt}) AS INTEGER) - CAST(strftime('%s', ${resourceBookings.startAt}) AS INTEGER)) / 60
          ), 0)`,
        })
        .from(resourceBookings)
        .where(
          and(
            gte(resourceBookings.startAt, monthStartIso),
            sql`${resourceBookings.status} in ('confirmed','in_use','returned')`
          )
        ),
      db
        .select({ c: sql<number>`count(*)` })
        .from(tournamentRegistrations)
        .where(eq(tournamentRegistrations.status, "pending")),
      // Tournament fee revenue — entryFee × paid registrations this month.
      db
        .select({
          total: sql<number>`coalesce(sum(${tournamentRegistrations.entryFee}), 0)`,
        })
        .from(tournamentRegistrations)
        .where(
          and(
            eq(tournamentRegistrations.paymentStatus, "paid"),
            gte(tournamentRegistrations.updatedAt, monthStartIso)
          )
        ),
      // Most recent open period for the payroll estimate.
      db
        .select()
        .from(payPeriods)
        .where(eq(payPeriods.status, "open"))
        .orderBy(sql`${payPeriods.startsAt} DESC`)
        .limit(1),
    ]);

    const mrrCents =
      (Number(activePlans[0]?.monthly) || 0) +
      Math.round(Number(activePlans[0]?.annualAsMonthly) || 0);

    // Payroll locked-this-month: sum of gross across all locked or
    // paid periods whose endsAt falls inside this month.
    const lockedPeriods = await db
      .select()
      .from(payPeriods)
      .where(
        and(
          sql`${payPeriods.status} in ('locked','paid')`,
          gte(payPeriods.endsAt, monthStartIso)
        )
      );
    let lockedGrossThisMonth = 0;
    for (const p of lockedPeriods) {
      const lines = await computePayrollRollup(p.startsAt, p.endsAt);
      for (const l of lines) lockedGrossThisMonth += l.grossCents;
    }

    // Open-period estimate — gross if we locked right now.
    let openPeriodEstimateCents = 0;
    let openPeriodId: number | null = null;
    let openPeriodLabel: string | null = null;
    if (activeOpenPeriodRows.length > 0) {
      const p = activeOpenPeriodRows[0];
      openPeriodId = p.id;
      openPeriodLabel = p.label;
      const lines = await computePayrollRollup(p.startsAt, p.endsAt);
      openPeriodEstimateCents = lines.reduce((sum, l) => sum + l.grossCents, 0);
    }

    const programRev = Number(programRevRows[0]?.total) || 0;
    const rentalRev = Number(rentalRevRows[0]?.total) || 0;
    const tournamentRev = Number(tournamentPaidMonthRows[0]?.total) || 0;

    const active = Number(activeMembers[0]?.c) || 0;
    const cancelled30 = Number(cancelledLast30[0]?.c) || 0;
    // Churn rate: cancels-in-last-30d ÷ (active + cancelled-last-30d)
    const churnRate = active + cancelled30 > 0
      ? cancelled30 / (active + cancelled30)
      : 0;

    return NextResponse.json(
      {
        asOf: nowIso,
        monthStart: monthStartIso,
        members: {
          active,
          trial: Number(trialMembers[0]?.c) || 0,
          pastDue: Number(pastDueMembers[0]?.c) || 0,
          newThisMonth: Number(newThisMonth[0]?.c) || 0,
          cancelledLast30: cancelled30,
          churnRate,
          visitsThisMonth: Number(visitsThisMonth[0]?.c) || 0,
        },
        revenue: {
          mrrCents,
          programRevCentsMonth: programRev,
          rentalRevCentsMonth: rentalRev,
          tournamentRevCentsMonth: tournamentRev,
          totalRevCentsMonth: mrrCents + programRev + rentalRev + tournamentRev,
        },
        payroll: {
          lockedGrossCentsMonth: lockedGrossThisMonth,
          openPeriodId,
          openPeriodLabel,
          openPeriodEstimateCents,
        },
        tournaments: {
          pendingRegistrations: Number(tournamentPendingCount[0]?.c) || 0,
          paidRevCentsMonth: tournamentRev,
        },
        rentals: {
          activeCount: Number(rentalActiveCount[0]?.c) || 0,
          hoursRentedMonth: Math.round((Number(rentalHoursRows[0]?.minutes) || 0) / 60),
          revCentsMonth: rentalRev,
        },
      },
      { headers: { "Cache-Control": "private, max-age=60" } }
    );
  } catch (err) {
    logger.error("Failed to build reports", { error: String(err) });
    return NextResponse.json({ error: "Failed to build reports" }, { status: 500 });
  }
});

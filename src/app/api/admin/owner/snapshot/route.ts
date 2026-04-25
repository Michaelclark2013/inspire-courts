import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  members,
  membershipPlans,
  memberVisits,
  maintenanceTickets,
  equipment,
  staffCertifications,
  tournamentRegistrations,
} from "@/lib/db/schema";
import { and, eq, gte, lte, sql, ne } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/owner/snapshot
// Owner-mode single-screen dashboard. Returns the 5 numbers that matter
// + open red flags. Admin-only. Cached for 60s server-side because
// every query here is aggregate-heavy and the owner only checks every
// few minutes anyway.

function startOfDay(d = new Date()): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function startOfMonth(d = new Date()): string {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}
function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = startOfDay();
    const thirtyDaysAgo = daysAgo(30);
    const monthStart = startOfMonth();
    const sevenDaysOut = daysFromNow(7);

    const [
      mrrRow,
      activeRow,
      pastDueRow,
      pausedRow,
      newThisMonthRow,
      churnedThisMonthRow,
      todayCheckinsRow,
      avgCheckinsRow,
      renewalsExpiringRow,
      openTicketsRow,
      lowStockRow,
      expiredCertsRow,
      pendingRegsRow,
      visitsByDayRows,
    ] = await Promise.all([
      // MRR — sum of monthly plan price for every active member with a plan.
      db
        .select({
          mrrCents: sql<number>`COALESCE(SUM(${membershipPlans.priceMonthlyCents}), 0)`,
        })
        .from(members)
        .leftJoin(membershipPlans, eq(members.membershipPlanId, membershipPlans.id))
        .where(eq(members.status, "active")),
      db.select({ n: sql<number>`count(*)` }).from(members).where(eq(members.status, "active")),
      db.select({ n: sql<number>`count(*)` }).from(members).where(eq(members.status, "past_due")),
      db.select({ n: sql<number>`count(*)` }).from(members).where(eq(members.status, "paused")),
      db.select({ n: sql<number>`count(*)` }).from(members).where(gte(members.joinedAt, monthStart)),
      // Churn this month — members whose status flipped to cancelled
      // in the current month. We use updatedAt as a proxy for "when
      // they cancelled" since we don't have a dedicated cancelledAt.
      db
        .select({ n: sql<number>`count(*)` })
        .from(members)
        .where(and(eq(members.status, "cancelled"), gte(members.updatedAt, monthStart))),
      db
        .select({ n: sql<number>`count(*)` })
        .from(memberVisits)
        .where(gte(memberVisits.visitedAt, today)),
      // Average daily visits over last 14d (excluding today, which is partial)
      db
        .select({
          avg: sql<number>`CAST(COUNT(*) AS REAL) / 14.0`,
        })
        .from(memberVisits)
        .where(and(gte(memberVisits.visitedAt, daysAgo(14)), lte(memberVisits.visitedAt, today))),
      // Renewals due in the next 7 days
      db
        .select({ n: sql<number>`count(*)` })
        .from(members)
        .where(
          and(
            eq(members.status, "active"),
            gte(members.nextRenewalAt, today),
            lte(members.nextRenewalAt, sevenDaysOut)
          )
        ),
      db
        .select({ n: sql<number>`count(*)` })
        .from(maintenanceTickets)
        .where(ne(maintenanceTickets.status, "closed")),
      // Equipment at or below reorder threshold
      db
        .select({ n: sql<number>`count(*)` })
        .from(equipment)
        .where(and(eq(equipment.active, true), sql`${equipment.onHand} <= ${equipment.minQuantity}`)),
      db
        .select({ n: sql<number>`count(*)` })
        .from(staffCertifications)
        .where(and(sql`${staffCertifications.expiresAt} IS NOT NULL`, lte(staffCertifications.expiresAt, today))),
      db
        .select({ n: sql<number>`count(*)` })
        .from(tournamentRegistrations)
        .where(eq(tournamentRegistrations.status, "pending")),
      // Sparkline data — visits per day for last 30 days
      db
        .select({
          day: sql<string>`date(${memberVisits.visitedAt})`,
          n: sql<number>`count(*)`,
        })
        .from(memberVisits)
        .where(gte(memberVisits.visitedAt, thirtyDaysAgo))
        .groupBy(sql`date(${memberVisits.visitedAt})`),
    ]);

    const mrrCents = Number(mrrRow[0]?.mrrCents) || 0;
    const activeMembers = Number(activeRow[0]?.n) || 0;
    const pastDue = Number(pastDueRow[0]?.n) || 0;
    const paused = Number(pausedRow[0]?.n) || 0;
    const newThisMonth = Number(newThisMonthRow[0]?.n) || 0;
    const churnedThisMonth = Number(churnedThisMonthRow[0]?.n) || 0;
    const todayCheckins = Number(todayCheckinsRow[0]?.n) || 0;
    const avgCheckins = Number(avgCheckinsRow[0]?.avg) || 0;
    const renewalsExpiring = Number(renewalsExpiringRow[0]?.n) || 0;
    const openTickets = Number(openTicketsRow[0]?.n) || 0;
    const lowStock = Number(lowStockRow[0]?.n) || 0;
    const expiredCerts = Number(expiredCertsRow[0]?.n) || 0;
    const pendingRegs = Number(pendingRegsRow[0]?.n) || 0;

    // Build a 30-day sparkline. Fill missing days with 0.
    const visitsByDay = new Map<string, number>();
    for (const r of visitsByDayRows) visitsByDay.set(String(r.day), Number(r.n) || 0);
    const sparkline: Array<{ day: string; n: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      sparkline.push({ day: key, n: visitsByDay.get(key) ?? 0 });
    }

    // Churn rate this month = churned / (active at start of month)
    // (active at start ≈ active + churned, since active flipped to cancelled.)
    const startActive = activeMembers + churnedThisMonth;
    const churnRate = startActive > 0 ? churnedThisMonth / startActive : 0;
    const netDelta = newThisMonth - churnedThisMonth;

    // Red flags — anything the owner needs to act on. Ordered by urgency.
    const redFlags = [
      pastDue > 0 && {
        kind: "payment",
        severity: "high",
        label: `${pastDue} member${pastDue === 1 ? "" : "s"} past due`,
        href: "/admin/members?status=past_due",
      },
      expiredCerts > 0 && {
        kind: "compliance",
        severity: "high",
        label: `${expiredCerts} staff cert${expiredCerts === 1 ? "" : "s"} expired`,
        href: "/admin/certifications",
      },
      pendingRegs > 0 && {
        kind: "approval",
        severity: "medium",
        label: `${pendingRegs} pending tournament registration${pendingRegs === 1 ? "" : "s"}`,
        href: "/admin/approvals",
      },
      openTickets > 0 && {
        kind: "facility",
        severity: "medium",
        label: `${openTickets} open maintenance ticket${openTickets === 1 ? "" : "s"}`,
        href: "/admin/maintenance",
      },
      lowStock > 0 && {
        kind: "inventory",
        severity: "low",
        label: `${lowStock} item${lowStock === 1 ? "" : "s"} low on stock`,
        href: "/admin/equipment",
      },
      renewalsExpiring > 0 && {
        kind: "renewal",
        severity: "low",
        label: `${renewalsExpiring} renewal${renewalsExpiring === 1 ? "" : "s"} due in 7 days`,
        href: "/admin/members?renewing=7d",
      },
    ].filter(Boolean);

    return NextResponse.json(
      {
        mrr: { cents: mrrCents, dollars: Math.round(mrrCents / 100) },
        members: {
          active: activeMembers,
          paused,
          pastDue,
          newThisMonth,
          churnedThisMonth,
          churnRate,
          netDelta,
        },
        checkins: {
          today: todayCheckins,
          avgDaily: Math.round(avgCheckins * 10) / 10,
          sparkline,
        },
        redFlags,
        generatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } }
    );
  } catch (err) {
    logger.error("owner snapshot failed", { error: String(err) });
    return NextResponse.json({ error: "Snapshot failed" }, { status: 500 });
  }
}

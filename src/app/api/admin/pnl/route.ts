import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { expenses, resourceBookings, tournamentRegistrations } from "@/lib/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/pnl — lightweight profit-and-loss rollup for the
// main dashboard widget. Windows: this month + last 30 days.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString();

    const [rentalMonth, rentalThirty, regsMonth, expensesMonth, expensesThirty] = await Promise.all([
      db
        .select({ n: sql<number>`coalesce(sum(${resourceBookings.totalCents}), 0)` })
        .from(resourceBookings)
        .where(and(eq(resourceBookings.status, "returned"), gte(resourceBookings.checkinAt, monthStart))),
      db
        .select({ n: sql<number>`coalesce(sum(${resourceBookings.totalCents}), 0)` })
        .from(resourceBookings)
        .where(and(eq(resourceBookings.status, "returned"), gte(resourceBookings.checkinAt, thirtyDaysAgo))),
      db
        .select({ n: sql<number>`coalesce(sum(${tournamentRegistrations.entryFee}), 0)` })
        .from(tournamentRegistrations)
        .where(and(eq(tournamentRegistrations.paymentStatus, "paid"), gte(tournamentRegistrations.updatedAt, monthStart))),
      db
        .select({ n: sql<number>`coalesce(sum(${expenses.amountCents}), 0)` })
        .from(expenses)
        .where(gte(expenses.incurredAt, monthStart)),
      db
        .select({ n: sql<number>`coalesce(sum(${expenses.amountCents}), 0)` })
        .from(expenses)
        .where(gte(expenses.incurredAt, thirtyDaysAgo)),
    ]);

    const monthRevenueCents = Number(rentalMonth[0]?.n || 0) + Number(regsMonth[0]?.n || 0);
    const monthExpenseCents = Number(expensesMonth[0]?.n || 0);
    const thirtyRevenueCents = Number(rentalThirty[0]?.n || 0); // Rentals only in 30d for simplicity
    const thirtyExpenseCents = Number(expensesThirty[0]?.n || 0);

    return NextResponse.json(
      {
        month: {
          revenueCents: monthRevenueCents,
          expenseCents: monthExpenseCents,
          profitCents: monthRevenueCents - monthExpenseCents,
          marginPercent: monthRevenueCents > 0 ? Math.round(((monthRevenueCents - monthExpenseCents) / monthRevenueCents) * 100) : 0,
        },
        thirtyDay: {
          revenueCents: thirtyRevenueCents,
          expenseCents: thirtyExpenseCents,
          profitCents: thirtyRevenueCents - thirtyExpenseCents,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("pnl failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

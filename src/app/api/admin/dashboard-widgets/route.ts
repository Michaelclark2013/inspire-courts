import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  resourceBookings,
  tournaments,
  tournamentRegistrations,
  games,
  tournamentGames,
  users,
} from "@/lib/db/schema";
import { and, asc, eq, gte, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/dashboard-widgets
// Lightweight combined endpoint for the mini-widgets that sit next to
// the main hero: this-week revenue, active tournament progress, weekly
// signup chart, waiver-pending count. One request feeds several cards.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);
    const weekStartIso = weekStart.toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString();

    const [rentalRevenue, activeTournament, signupsByDay, pendingApprovals] = await Promise.all([
      db
        .select({ n: sql<number>`coalesce(sum(${resourceBookings.totalCents}), 0)` })
        .from(resourceBookings)
        .where(and(eq(resourceBookings.status, "returned"), gte(resourceBookings.checkinAt, weekStartIso))),
      db
        .select()
        .from(tournaments)
        .where(eq(tournaments.status, "active"))
        .orderBy(asc(tournaments.startDate))
        .limit(1),
      db
        .select({
          day: sql<string>`substr(${users.createdAt}, 1, 10)`,
          count: sql<number>`count(*)`,
        })
        .from(users)
        .where(gte(users.createdAt, sevenDaysAgo))
        .groupBy(sql`substr(${users.createdAt}, 1, 10)`)
        .orderBy(sql`substr(${users.createdAt}, 1, 10)`),
      db
        .select({ n: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.approved, false)),
    ]);

    // Tournament progress — count registered vs completed games.
    let tournamentProgress: null | {
      id: number;
      name: string;
      startDate: string;
      endDate: string | null;
      teamsRegistered: number;
      gamesTotal: number;
      gamesCompleted: number;
      percentComplete: number;
    } = null;

    if (activeTournament[0]) {
      const t = activeTournament[0];
      const [regs, tGames] = await Promise.all([
        db
          .select({ n: sql<number>`count(*)` })
          .from(tournamentRegistrations)
          .where(eq(tournamentRegistrations.tournamentId, t.id)),
        db
          .select({
            total: sql<number>`count(*)`,
            complete: sql<number>`sum(case when ${games.status} = 'final' then 1 else 0 end)`,
          })
          .from(tournamentGames)
          .leftJoin(games, eq(games.id, tournamentGames.gameId))
          .where(eq(tournamentGames.tournamentId, t.id)),
      ]);

      const gamesTotal = Number(tGames[0]?.total) || 0;
      const gamesCompleted = Number(tGames[0]?.complete) || 0;
      tournamentProgress = {
        id: t.id,
        name: t.name,
        startDate: t.startDate,
        endDate: t.endDate,
        teamsRegistered: Number(regs[0]?.n) || 0,
        gamesTotal,
        gamesCompleted,
        percentComplete: gamesTotal > 0 ? Math.round((gamesCompleted / gamesTotal) * 100) : 0,
      };
    }

    return NextResponse.json(
      {
        rentalRevenueThisWeekCents: Number(rentalRevenue[0]?.n) || 0,
        activeTournament: tournamentProgress,
        signupsByDay: signupsByDay.map((r) => ({ day: r.day, count: Number(r.count) || 0 })),
        pendingApprovals: Number(pendingApprovals[0]?.n) || 0,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("dashboard-widgets failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

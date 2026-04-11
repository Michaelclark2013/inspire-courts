import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentRegistrations,
  games,
  announcements,
} from "@/lib/db/schema";
import { eq, sql, inArray, or, isNull, gte } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    const [
      regStats,
      allTournaments,
      upcomingGames,
      announcementCount,
      liveGameCount,
    ] = await Promise.all([
      // Registration aggregate stats
      db
        .select({
          total: sql<number>`count(*)`,
          pendingPayments: sql<number>`sum(case when ${tournamentRegistrations.paymentStatus} = 'pending' then 1 else 0 end)`,
          paidRevenueCents: sql<number>`sum(case when ${tournamentRegistrations.paymentStatus} = 'paid' then ${tournamentRegistrations.entryFee} else 0 end)`,
          approved: sql<number>`sum(case when ${tournamentRegistrations.status} = 'approved' then 1 else 0 end)`,
        })
        .from(tournamentRegistrations),

      // Active/published tournaments with registration counts
      db
        .select()
        .from(tournaments)
        .where(inArray(tournaments.status, ["published", "active"])),

      // Upcoming scheduled games (next 10)
      db
        .select({
          id: games.id,
          homeTeam: games.homeTeam,
          awayTeam: games.awayTeam,
          court: games.court,
          scheduledTime: games.scheduledTime,
          division: games.division,
          status: games.status,
        })
        .from(games)
        .where(eq(games.status, "scheduled"))
        .limit(10),

      // Active announcements count
      db
        .select({ count: sql<number>`count(*)` })
        .from(announcements)
        .where(or(isNull(announcements.expiresAt), gte(announcements.expiresAt, now))),

      // Live games count
      db
        .select({ count: sql<number>`count(*)` })
        .from(games)
        .where(eq(games.status, "live")),
    ]);

    // Get registration counts per tournament
    const tournamentIds = allTournaments.map((t) => t.id);
    let regCountsByTournament: Record<number, number> = {};
    if (tournamentIds.length > 0) {
      const regCounts = await db
        .select({
          tournamentId: tournamentRegistrations.tournamentId,
          count: sql<number>`count(*)`,
        })
        .from(tournamentRegistrations)
        .where(inArray(tournamentRegistrations.tournamentId, tournamentIds))
        .groupBy(tournamentRegistrations.tournamentId);

      for (const r of regCounts) {
        regCountsByTournament[r.tournamentId] = r.count;
      }
    }

    const stats = regStats[0];
    const total = Number(stats?.total) || 0;
    const approvedCount = Number(stats?.approved) || 0;

    const tournamentStatus = allTournaments.map((t) => {
      const divs: string[] = t.divisions ? JSON.parse(t.divisions) : [];
      const maxCapacity = t.maxTeamsPerDivision
        ? t.maxTeamsPerDivision * divs.length
        : null;
      return {
        id: t.id,
        name: t.name,
        status: t.status,
        registeredCount: regCountsByTournament[t.id] || 0,
        maxCapacity,
        registrationOpen: t.registrationOpen,
        entryFee: t.entryFee,
        startDate: t.startDate,
        divisions: divs,
      };
    });

    return NextResponse.json({
      registrations: {
        total,
        pendingPayments: Number(stats?.pendingPayments) || 0,
        paidRevenueCents: Number(stats?.paidRevenueCents) || 0,
        approvalRate: total > 0 ? Math.round((approvedCount / total) * 100) : 0,
      },
      upcomingGames,
      tournamentStatus,
      activeAnnouncements: Number(announcementCount[0]?.count) || 0,
      liveGames: Number(liveGameCount[0]?.count) || 0,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}

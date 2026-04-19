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
import { logger } from "@/lib/logger";

// DEPRECATED: this route was superseded by /api/admin/dashboard/summary
// in cycle 12. Kept reachable for backwards-compat, but logs a single
// deprecation warning per process so lingering clients show up in logs.
let deprecationWarned = false;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!deprecationWarned) {
    logger.warn(
      "/api/admin/dashboard is deprecated — clients should migrate to /api/admin/dashboard/summary"
    );
    deprecationWarned = true;
  }

  try {
    const now = new Date().toISOString();

    const [
      regRows,
      allTournaments,
      upcomingGames,
      announcementCount,
      liveGameCount,
    ] = await Promise.all([
      // Per-tournament registration breakdown — one query that produces
      // both the global aggregates (via reduce below) AND the per-tournament
      // counts used in tournamentStatus. Was two separate scans before.
      db
        .select({
          tournamentId: tournamentRegistrations.tournamentId,
          count: sql<number>`count(*)`,
          pendingPayments: sql<number>`sum(case when ${tournamentRegistrations.paymentStatus} = 'pending' then 1 else 0 end)`,
          paidRevenueCents: sql<number>`sum(case when ${tournamentRegistrations.paymentStatus} = 'paid' then ${tournamentRegistrations.entryFee} else 0 end)`,
          approved: sql<number>`sum(case when ${tournamentRegistrations.status} = 'approved' then 1 else 0 end)`,
        })
        .from(tournamentRegistrations)
        .groupBy(tournamentRegistrations.tournamentId),

      // Active/published tournaments
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

    // Reduce the grouped rows into both the per-tournament map and the
    // global aggregates used by the top-level KPIs.
    const regCountsByTournament: Record<number, number> = {};
    const stats = { total: 0, pendingPayments: 0, paidRevenueCents: 0, approved: 0 };
    for (const r of regRows) {
      regCountsByTournament[r.tournamentId] = Number(r.count) || 0;
      stats.total += Number(r.count) || 0;
      stats.pendingPayments += Number(r.pendingPayments) || 0;
      stats.paidRevenueCents += Number(r.paidRevenueCents) || 0;
      stats.approved += Number(r.approved) || 0;
    }

    const total = stats.total;
    const approvedCount = stats.approved;

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
        pendingPayments: stats.pendingPayments,
        paidRevenueCents: stats.paidRevenueCents,
        approvalRate: total > 0 ? Math.round((approvedCount / total) * 100) : 0,
      },
      upcomingGames,
      tournamentStatus,
      activeAnnouncements: Number(announcementCount[0]?.count) || 0,
      liveGames: Number(liveGameCount[0]?.count) || 0,
    }, {
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        // RFC 8594: signal deprecation to well-behaved clients so they
        // can log / surface the migration path.
        Deprecation: "true",
        Link: '</api/admin/dashboard/summary>; rel="successor-version"',
        Sunset: "Mon, 01 Jan 2027 00:00:00 GMT",
      },
    });
  } catch (error) {
    logger.error("Dashboard API error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentRegistrations,
  games,
  gameScores,
  announcements,
} from "@/lib/db/schema";
import { eq, sql, inArray, or, isNull, gte, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";

// GET /api/admin/dashboard/summary — consolidated admin dashboard payload.
// Replaces separate fetches to /api/admin/dashboard, /api/scores/live,
// /api/admin/tournaments, /api/admin/leads and per-tournament registration
// counts with a single request.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    // First pass: cheap existence check for tournaments + per-table
    // counts in parallel. We can skip the expensive registration aggregate
    // when there are zero tournaments (common for a fresh deployment or
    // after an archive pass).
    const [
      allTournaments,
      [tournamentRegMeta],
      upcomingGames,
      announcementCount,
      liveGamesRaw,
    ] = await Promise.all([
      db.select().from(tournaments),
      db
        .select({ count: sql<number>`count(*)` })
        .from(tournamentRegistrations),

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

      db
        .select({ count: sql<number>`count(*)` })
        .from(announcements)
        .where(or(isNull(announcements.expiresAt), gte(announcements.expiresAt, now))),

      db
        .select()
        .from(games)
        .where(inArray(games.status, ["live", "final", "scheduled"]))
        .orderBy(desc(games.createdAt))
        .limit(30),
    ]);

    // Only run the registration aggregate if any registrations exist —
    // previously we scanned the full table unconditionally even on empty
    // or freshly-archived deployments. Combined with the per-tournament
    // count below (which was already gated), both registrations queries
    // now short-circuit when there's nothing to sum.
    const hasRegistrations = Number(tournamentRegMeta?.count) > 0;
    const stats = hasRegistrations
      ? (
          await db
            .select({
              total: sql<number>`count(*)`,
              pendingPayments: sql<number>`sum(case when ${tournamentRegistrations.paymentStatus} = 'pending' then 1 else 0 end)`,
              paidRevenueCents: sql<number>`sum(case when ${tournamentRegistrations.paymentStatus} = 'paid' then ${tournamentRegistrations.entryFee} else 0 end)`,
              approved: sql<number>`sum(case when ${tournamentRegistrations.status} = 'approved' then 1 else 0 end)`,
            })
            .from(tournamentRegistrations)
        )[0]
      : { total: 0, pendingPayments: 0, paidRevenueCents: 0, approved: 0 };

    // Registration counts per tournament
    const publishedOrActive = allTournaments.filter((t) =>
      ["published", "active"].includes(t.status)
    );
    const tournamentIds = publishedOrActive.map((t) => t.id);
    const regCountsByTournament: Record<number, number> = {};
    if (hasRegistrations && tournamentIds.length > 0) {
      const regCounts = await db
        .select({
          tournamentId: tournamentRegistrations.tournamentId,
          count: sql<number>`count(*)`,
        })
        .from(tournamentRegistrations)
        .where(inArray(tournamentRegistrations.tournamentId, tournamentIds))
        .groupBy(tournamentRegistrations.tournamentId);

      for (const r of regCounts) {
        regCountsByTournament[r.tournamentId] = Number(r.count);
      }
    }

    const total = Number(stats?.total) || 0;
    const approvedCount = Number(stats?.approved) || 0;

    const tournamentStatus = publishedOrActive.map((t) => {
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

    // Build live games detail with latest score
    const liveGameIds = liveGamesRaw.map((g) => g.id);
    const scoreMap = new Map<
      number,
      { homeScore: number; awayScore: number; quarter: string | null }
    >();
    if (liveGameIds.length > 0) {
      const allScores = await db
        .select()
        .from(gameScores)
        .where(inArray(gameScores.gameId, liveGameIds))
        .orderBy(desc(gameScores.updatedAt));
      for (const s of allScores) {
        if (!scoreMap.has(s.gameId)) {
          scoreMap.set(s.gameId, {
            homeScore: s.homeScore,
            awayScore: s.awayScore,
            quarter: s.quarter,
          });
        }
      }
    }

    const liveGamesDetail = liveGamesRaw.map((g) => {
      const s = scoreMap.get(g.id);
      return {
        id: g.id,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        homeScore: s?.homeScore ?? 0,
        awayScore: s?.awayScore ?? 0,
        division: g.division ?? null,
        court: g.court ?? null,
        status: g.status as "scheduled" | "live" | "final",
        scheduledTime: g.scheduledTime ?? null,
        quarter: s?.quarter ?? null,
      };
    });

    const liveGamesCount = liveGamesDetail.filter((g) => g.status === "live").length;

    const alerts = {
      pendingRegistrations: Number(stats?.pendingPayments) || 0,
      activeTournaments: allTournaments.filter((t) => t.status === "active").length,
      upcomingGames: liveGamesDetail.filter((g) => g.status === "scheduled").length,
      draftTournaments: allTournaments.filter((t) => t.status === "draft").length,
    };

    // Leads (best-effort; never fails the whole payload)
    let leads: { hot: number; warm: number; cold: number; total: number } | null = null;
    if (canAccess(session.user.role, "prospects") && isGoogleConfigured()) {
      try {
        const { rows } = await fetchSheetWithHeaders(SHEETS.prospectPipeline);
        const items = rows.filter((r) => Object.values(r).some((v) => v !== ""));
        const statusOf = (r: Record<string, string>) =>
          getCol(r, "Status", "Lead Status", "Urgency") || "";
        leads = {
          hot: items.filter((r) => /hot/i.test(statusOf(r))).length,
          warm: items.filter((r) => /warm/i.test(statusOf(r))).length,
          cold: items.filter((r) => /cold/i.test(statusOf(r))).length,
          total: items.length,
        };
      } catch {
        leads = null;
      }
    }

    return NextResponse.json(
      {
        registrations: {
          total,
          pendingPayments: Number(stats?.pendingPayments) || 0,
          paidRevenueCents: Number(stats?.paidRevenueCents) || 0,
          approvalRate: total > 0 ? Math.round((approvedCount / total) * 100) : 0,
        },
        upcomingGames,
        tournamentStatus,
        activeAnnouncements: Number(announcementCount[0]?.count) || 0,
        liveGames: liveGamesCount,
        liveGamesDetail,
        alerts,
        leads,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    logger.error("Admin dashboard summary API error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}

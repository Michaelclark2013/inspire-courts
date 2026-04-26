import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  announcements,
  games,
  gameScores,
  players,
  teams,
  tournamentRegistrations,
  tournaments,
  waivers,
} from "@/lib/db/schema";
import { and, desc, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";

// GET /api/portal/summary — consolidated dashboard payload.
// Returns liveGames, announcements, registrations, rosterCount, waiverSubmitted
// in ONE request, replacing four separate fetches from the portal page.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role || "parent";
  const userId = session.user.id ? Number(session.user.id) : null;
  const email = session.user.email;

  // ── Live games (same shape as /api/scores/live, simplified) ───────────────
  let liveGames: Array<{
    id: number;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    status: string;
    quarter: string | null;
    division: string | null;
  }> = [];
  try {
    const allGames = await db
      .select()
      .from(games)
      .where(inArray(games.status, ["live", "final", "scheduled"]))
      .orderBy(desc(games.createdAt))
      .limit(50);

    if (allGames.length > 0) {
      const gameIds = allGames.map((g) => g.id);
      // Narrow projection — only the three fields we actually display.
      // Avoids pulling notes/replay/blob columns we never read.
      const allScores = await db
        .select({
          gameId: gameScores.gameId,
          homeScore: gameScores.homeScore,
          awayScore: gameScores.awayScore,
          quarter: gameScores.quarter,
          updatedAt: gameScores.updatedAt,
        })
        .from(gameScores)
        .where(inArray(gameScores.gameId, gameIds))
        .orderBy(desc(gameScores.updatedAt));

      const latestScore = new Map<
        number,
        { homeScore: number; awayScore: number; quarter: string | null }
      >();
      for (const s of allScores) {
        if (!latestScore.has(s.gameId)) {
          latestScore.set(s.gameId, {
            homeScore: s.homeScore,
            awayScore: s.awayScore,
            quarter: s.quarter,
          });
        }
      }

      liveGames = allGames.map((g) => {
        const s = latestScore.get(g.id);
        return {
          id: g.id,
          homeTeam: g.homeTeam,
          awayTeam: g.awayTeam,
          homeScore: s?.homeScore ?? 0,
          awayScore: s?.awayScore ?? 0,
          status: g.status,
          quarter: s?.quarter ?? null,
          division: g.division ?? null,
        };
      });
    }
  } catch {
    // leave liveGames empty on failure
  }

  // ── Announcements (filtered by audience/expiry) ───────────────────────────
  let filteredAnnouncements: Array<{
    id: number;
    title: string;
    body: string;
    audience: string;
    createdAt: string;
  }> = [];
  try {
    const nowIso = new Date().toISOString();
    // Filter in SQL: drop expired posts and exclude the role-scoped
    // audience the current user doesn't belong to. Division-style
    // audiences fall through (mirrors /api/portal/announcements).
    const excludedRoleAudience = role === "coach" ? "parents" : "coaches";
    const rows = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        body: announcements.body,
        audience: announcements.audience,
        createdAt: announcements.createdAt,
      })
      .from(announcements)
      .where(
        and(
          or(isNull(announcements.expiresAt), gt(announcements.expiresAt, nowIso)),
          ne(announcements.audience, excludedRoleAudience)
        )
      )
      .orderBy(desc(announcements.createdAt));
    filteredAnnouncements = rows;
  } catch {
    // leave empty
  }

  // ── Registrations ─────────────────────────────────────────────────────────
  let enrichedRegs: Array<{
    id: number;
    tournamentId: number;
    tournamentName: string;
    tournamentDate: string;
    teamName: string;
    division: string | null;
    paymentStatus: string;
    status: string;
  }> = [];
  try {
    // Single LEFT JOIN replaces the previous "fetch regs, collect ids,
    // fetch tournaments, build a map" two-roundtrip dance.
    const rows = await db
      .select({
        id: tournamentRegistrations.id,
        tournamentId: tournamentRegistrations.tournamentId,
        teamName: tournamentRegistrations.teamName,
        division: tournamentRegistrations.division,
        paymentStatus: tournamentRegistrations.paymentStatus,
        status: tournamentRegistrations.status,
        tournamentName: tournaments.name,
        tournamentDate: tournaments.startDate,
      })
      .from(tournamentRegistrations)
      .leftJoin(tournaments, eq(tournamentRegistrations.tournamentId, tournaments.id))
      .where(eq(tournamentRegistrations.coachEmail, email));
    enrichedRegs = rows.map((r) => ({
      id: r.id,
      tournamentId: r.tournamentId,
      tournamentName: r.tournamentName ?? "Unknown",
      tournamentDate: r.tournamentDate ?? "",
      teamName: r.teamName,
      division: r.division,
      paymentStatus: r.paymentStatus,
      status: r.status,
    }));
  } catch {
    // leave empty
  }

  // ── Roster count (coaches only) ───────────────────────────────────────────
  let rosterCount: number | null = null;
  if (role === "coach" && userId !== null && Number.isInteger(userId) && userId > 0) {
    try {
      // Single query: get team + player count via COUNT subquery.
      const [row] = await db
        .select({
          teamId: teams.id,
          playerCount: sql<number>`(SELECT COUNT(*) FROM ${players} WHERE ${players.teamId} = ${teams.id})`,
        })
        .from(teams)
        .where(eq(teams.coachUserId, userId))
        .limit(1);
      rosterCount = row ? Number(row.playerCount) : 0;
    } catch {
      rosterCount = null;
    }
  }

  // ── Waiver submitted? ─────────────────────────────────────────────────────
  let waiverSubmitted = false;
  try {
    const rows = await db
      .select({ id: waivers.id })
      .from(waivers)
      .where(eq(waivers.email, email))
      .limit(1);
    waiverSubmitted = rows.length > 0;
  } catch {
    waiverSubmitted = false;
  }

  return NextResponse.json(
    {
      liveGames,
      announcements: filteredAnnouncements,
      registrations: enrichedRegs,
      rosterCount,
      waiverSubmitted,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
      },
    }
  );
}

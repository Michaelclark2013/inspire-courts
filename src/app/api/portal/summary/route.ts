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
import { desc, eq, inArray } from "drizzle-orm";

// GET /api/portal/summary — consolidated dashboard payload.
// Returns liveGames, announcements, registrations, rosterCount, waiverSubmitted
// in ONE request, replacing four separate fetches from the portal page.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role || "parent";
  const userId = session.user.id ? Number(session.user.id) : NaN;
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
      const allScores = await db
        .select()
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
    const allA = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
    filteredAnnouncements = allA
      .filter((a) => {
        if (a.expiresAt && a.expiresAt < nowIso) return false;
        if (a.audience === "all") return true;
        if (a.audience === "coaches" && role === "coach") return true;
        if (a.audience === "parents" && role === "parent") return true;
        return true;
      })
      .map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        audience: a.audience,
        createdAt: a.createdAt,
      }));
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
    const regs = await db
      .select()
      .from(tournamentRegistrations)
      .where(eq(tournamentRegistrations.coachEmail, email));
    if (regs.length > 0) {
      const tIds = [...new Set(regs.map((r) => r.tournamentId))];
      const tRows = await db
        .select({
          id: tournaments.id,
          name: tournaments.name,
          startDate: tournaments.startDate,
        })
        .from(tournaments)
        .where(inArray(tournaments.id, tIds));
      const tMap = new Map(tRows.map((t) => [t.id, t]));
      enrichedRegs = regs.map((r) => {
        const t = tMap.get(r.tournamentId);
        return {
          id: r.id,
          tournamentId: r.tournamentId,
          tournamentName: t?.name ?? "Unknown",
          tournamentDate: t?.startDate ?? "",
          teamName: r.teamName,
          division: r.division,
          paymentStatus: r.paymentStatus,
          status: r.status,
        };
      });
    }
  } catch {
    // leave empty
  }

  // ── Roster count (coaches only) ───────────────────────────────────────────
  let rosterCount: number | null = null;
  if (role === "coach" && !isNaN(userId)) {
    try {
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.coachUserId, userId))
        .limit(1);
      if (team) {
        const roster = await db
          .select({ id: players.id })
          .from(players)
          .where(eq(players.teamId, team.id));
        rosterCount = roster.length;
      } else {
        rosterCount = 0;
      }
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

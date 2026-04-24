import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  players,
  teams,
  tournaments,
  tournamentGames,
  games,
  gameScores,
  waivers,
} from "@/lib/db/schema";
import { and, desc, eq, inArray, gte } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/portal/player/dashboard
//
// Player-facing hub data. Returns:
//   - player profile + linked team (if any)
//   - current/upcoming tournament the player's team is registered for
//   - next game scheduled for their team
//   - recent results (last 5 games)
//   - waiver status
//   - merch placeholders (kept simple — real merch sales hook comes later)
//
// A "player" in Inspire Courts is really a Parent account with a linked
// players row. We resolve via players.parentUserId → user.id, and fall
// back to name matching when the parent's account hasn't been linked
// to a player row yet.

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Player linked to this parent account (may be multiple — pick first).
    const linked = await db
      .select({
        id: players.id,
        name: players.name,
        jerseyNumber: players.jerseyNumber,
        division: players.division,
        teamId: players.teamId,
      })
      .from(players)
      .where(eq(players.parentUserId, userId))
      .limit(5);

    let team: { id: number; name: string; division: string | null } | null = null;
    if (linked.length > 0 && linked[0].teamId) {
      const [t] = await db
        .select({
          id: teams.id,
          name: teams.name,
          division: teams.division,
        })
        .from(teams)
        .where(eq(teams.id, linked[0].teamId))
        .limit(1);
      if (t) team = t;
    }

    // Team's next game + recent results.
    let nextGame: {
      id: number;
      opponent: string;
      scheduledTime: string;
      court: string | null;
      homeOrAway: "home" | "away";
    } | null = null;
    let recentResults: Array<{
      id: number;
      opponent: string;
      myScore: number;
      oppScore: number;
      result: "W" | "L" | "T";
      date: string;
    }> = [];

    if (team) {
      const teamName = team.name;
      const nowIso = new Date().toISOString();

      const upcomingGames = await db
        .select({
          id: games.id,
          homeTeam: games.homeTeam,
          awayTeam: games.awayTeam,
          court: games.court,
          scheduledTime: games.scheduledTime,
        })
        .from(games)
        .where(
          and(
            eq(games.status, "scheduled"),
            gte(games.scheduledTime, nowIso)
          )
        )
        .orderBy(games.scheduledTime)
        .limit(20);

      const nextMine = upcomingGames.find(
        (g) => g.homeTeam === teamName || g.awayTeam === teamName
      );
      if (nextMine) {
        const isHome = nextMine.homeTeam === teamName;
        nextGame = {
          id: nextMine.id,
          opponent: isHome ? nextMine.awayTeam : nextMine.homeTeam,
          scheduledTime: nextMine.scheduledTime ?? "",
          court: nextMine.court,
          homeOrAway: isHome ? "home" : "away",
        };
      }

      // Recent finals for this team — limit 5.
      const recentFinals = await db
        .select({
          id: games.id,
          homeTeam: games.homeTeam,
          awayTeam: games.awayTeam,
          scheduledTime: games.scheduledTime,
          createdAt: games.createdAt,
        })
        .from(games)
        .where(eq(games.status, "final"))
        .orderBy(desc(games.createdAt))
        .limit(30);
      const mineFinals = recentFinals
        .filter((g) => g.homeTeam === teamName || g.awayTeam === teamName)
        .slice(0, 5);

      if (mineFinals.length > 0) {
        const gameIds = mineFinals.map((g) => g.id);
        const scores = await db
          .select({
            gameId: gameScores.gameId,
            homeScore: gameScores.homeScore,
            awayScore: gameScores.awayScore,
            updatedAt: gameScores.updatedAt,
          })
          .from(gameScores)
          .where(inArray(gameScores.gameId, gameIds))
          .orderBy(desc(gameScores.updatedAt));
        const latestByGame = new Map<number, typeof scores[number]>();
        for (const s of scores) {
          if (!latestByGame.has(s.gameId)) latestByGame.set(s.gameId, s);
        }
        recentResults = mineFinals.map((g) => {
          const isHome = g.homeTeam === teamName;
          const s = latestByGame.get(g.id);
          const myScore = isHome ? s?.homeScore ?? 0 : s?.awayScore ?? 0;
          const oppScore = isHome ? s?.awayScore ?? 0 : s?.homeScore ?? 0;
          const result: "W" | "L" | "T" =
            myScore > oppScore ? "W" : myScore < oppScore ? "L" : "T";
          return {
            id: g.id,
            opponent: isHome ? g.awayTeam : g.homeTeam,
            myScore,
            oppScore,
            result,
            date: (g.scheduledTime || g.createdAt || "").slice(0, 10),
          };
        });
      }
    }

    // Tournament this team is part of (bracket_games → tournament).
    let currentTournament: {
      id: number;
      name: string;
      startDate: string;
      location: string | null;
    } | null = null;
    if (team) {
      const [bracketRow] = await db
        .select({
          tournamentId: tournamentGames.tournamentId,
        })
        .from(tournamentGames)
        .innerJoin(games, eq(games.id, tournamentGames.gameId))
        .where(
          and(
            inArray(games.status, ["scheduled", "live"]),
            eq(games.homeTeam, team.name)
          )
        )
        .limit(1);
      if (bracketRow) {
        const [t] = await db
          .select({
            id: tournaments.id,
            name: tournaments.name,
            startDate: tournaments.startDate,
            location: tournaments.location,
          })
          .from(tournaments)
          .where(eq(tournaments.id, bracketRow.tournamentId))
          .limit(1);
        if (t) currentTournament = t;
      }
    }

    // Waiver status — has this parent signed a waiver for any linked player?
    let waiverSigned = false;
    if (linked.length > 0) {
      const names = linked.map((p) => p.name);
      const [w] = await db
        .select({ id: waivers.id })
        .from(waivers)
        .where(inArray(waivers.playerName, names))
        .limit(1);
      waiverSigned = !!w;
    }

    return NextResponse.json(
      {
        user: {
          name: user.name,
          email: user.email,
          emailVerified: !!user.emailVerifiedAt,
        },
        players: linked,
        team,
        currentTournament,
        nextGame,
        recentResults,
        waiverSigned,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("player dashboard failed", { error: String(err) });
    return NextResponse.json(
      { error: "Could not load dashboard" },
      { status: 500 }
    );
  }
}

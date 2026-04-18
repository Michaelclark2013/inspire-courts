import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tournaments, tournamentTeams, tournamentGames, games, gameScores } from "@/lib/db/schema";
import { desc, inArray } from "drizzle-orm";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// GET /api/scores/tournaments — public list of active/published tournaments
export async function GET(request: Request) {
  // Rate limit: 30 requests per minute per IP
  const ip = getClientIp(request);
  if (isRateLimited(`score-tournaments:${ip}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": "15" } }
    );
  }

  try {
    const activeTournaments = await db
      .select()
      .from(tournaments)
      .where(inArray(tournaments.status, ["published", "active"]))
      .orderBy(desc(tournaments.startDate));

    const tournamentIds = activeTournaments.map((t) => t.id);

    // Batch: all teams for all active tournaments
    const allTeams = tournamentIds.length > 0
      ? await db
          .select({ tournamentId: tournamentTeams.tournamentId, teamName: tournamentTeams.teamName })
          .from(tournamentTeams)
          .where(inArray(tournamentTeams.tournamentId, tournamentIds))
      : [];

    // Batch: all bracket entries for all active tournaments
    const allBracketEntries = tournamentIds.length > 0
      ? await db
          .select({ tournamentId: tournamentGames.tournamentId, gameId: tournamentGames.gameId })
          .from(tournamentGames)
          .where(inArray(tournamentGames.tournamentId, tournamentIds))
      : [];

    // Batch: all game statuses in one query
    const allGameIds = allBracketEntries.map((bg) => bg.gameId);
    const allBracketGames = allGameIds.length > 0
      ? await db
          .select({ id: games.id, status: games.status })
          .from(games)
          .where(inArray(games.id, allGameIds))
      : [];
    const gameStatusMap = new Map(allBracketGames.map((g) => [g.id, g.status]));

    const result = activeTournaments.map((t) => {
      const teams = allTeams
        .filter((tt) => tt.tournamentId === t.id)
        .map((tt) => ({ teamName: tt.teamName }));

      const bracket = allBracketEntries
        .filter((bg) => bg.tournamentId === t.id)
        .map((bg) => ({ status: gameStatusMap.get(bg.gameId) || "scheduled" }));

      return {
        id: t.id,
        name: t.name,
        startDate: t.startDate,
        location: t.location,
        format: t.format,
        status: t.status,
        teams,
        bracket,
      };
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    logger.error("Failed to fetch score tournaments", { error: String(err) });
    return NextResponse.json([], {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

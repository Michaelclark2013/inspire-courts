import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentTeams,
  tournamentGames,
  games,
  gameScores,
} from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// GET /api/tournaments/[id] — public tournament detail
export async function GET(_request: NextRequest, { params }: Params) {
  // Rate limit: 30 requests per minute per IP
  const ip = getClientIp(_request);
  if (isRateLimited(`tourney-detail:${ip}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": "15" } }
    );
  }

  const { id } = await params;
  const tournamentId = Number(id);

  if (isNaN(tournamentId) || tournamentId <= 0 || !Number.isInteger(tournamentId)) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }

  try {
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId));

    if (!tournament) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only show published/active/completed
    if (tournament.status === "draft") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const teams = await db
      .select()
      .from(tournamentTeams)
      .where(eq(tournamentTeams.tournamentId, tournamentId))
      .orderBy(tournamentTeams.seed);

    const bracketEntries = await db
      .select()
      .from(tournamentGames)
      .where(eq(tournamentGames.tournamentId, tournamentId));

    // Batch-fetch game details + scores (avoids N+1 queries)
    const gameIds = bracketEntries.map((bg) => bg.gameId);
    const [allGames, allScores] = gameIds.length > 0
      ? await Promise.all([
          db.select().from(games).where(inArray(games.id, gameIds)),
          db.select().from(gameScores).where(inArray(gameScores.gameId, gameIds)).orderBy(desc(gameScores.updatedAt)),
        ])
      : [[], []];

    const gamesMap = new Map(allGames.map((g) => [g.id, g]));
    // Latest score per game (first occurrence since ordered by updatedAt desc)
    const scoresMap = new Map<number, typeof allScores[0]>();
    for (const s of allScores) {
      if (!scoresMap.has(s.gameId)) scoresMap.set(s.gameId, s);
    }

    const bracket = bracketEntries.map((bg) => {
      const game = gamesMap.get(bg.gameId);
      const score = scoresMap.get(bg.gameId);
      return {
        bracketPosition: bg.bracketPosition,
        round: bg.round,
        poolGroup: bg.poolGroup,
        winnerAdvancesTo: bg.winnerAdvancesTo,
        loserDropsTo: bg.loserDropsTo,
        gameId: bg.gameId,
        homeTeam: game?.homeTeam ?? "TBD",
        awayTeam: game?.awayTeam ?? "TBD",
        homeScore: score?.homeScore ?? 0,
        awayScore: score?.awayScore ?? 0,
        status: game?.status ?? "scheduled",
        court: game?.court ?? null,
        scheduledTime: game?.scheduledTime ?? null,
        lastQuarter: score?.quarter ?? null,
      };
    });

    return NextResponse.json(
      {
        id: tournament.id,
        name: tournament.name,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        location: tournament.location,
        format: tournament.format,
        status: tournament.status,
        divisions: tournament.divisions ? JSON.parse(tournament.divisions) : [],
        entryFee: tournament.entryFee,
        registrationOpen: tournament.registrationOpen,
        registrationDeadline: tournament.registrationDeadline,
        maxTeamsPerDivision: tournament.maxTeamsPerDivision,
        requirePayment: tournament.requirePayment,
        requireWaivers: tournament.requireWaivers,
        description: tournament.description,
        teams: teams.map((t) => ({
          teamName: t.teamName,
          seed: t.seed,
          division: t.division,
          poolGroup: t.poolGroup,
          eliminated: t.eliminated,
        })),
        bracket,
      },
      { headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=30" } }
    );
  } catch (err) {
    logger.error("Tournament detail fetch failed", { error: String(err), tournamentId });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

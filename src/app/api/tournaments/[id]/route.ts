import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentTeams,
  tournamentGames,
  games,
  gameScores,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// GET /api/tournaments/[id] — public tournament detail
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const tournamentId = Number(id);

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

    // Get game details with scores
    const bracket = await Promise.all(
      bracketEntries.map(async (bg) => {
        const [game] = await db
          .select()
          .from(games)
          .where(eq(games.id, bg.gameId));
        const [score] = await db
          .select()
          .from(gameScores)
          .where(eq(gameScores.gameId, bg.gameId))
          .orderBy(desc(gameScores.updatedAt))
          .limit(1);

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
      })
    );

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
      { headers: { "Cache-Control": "public, max-age=15" } }
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  tournamentGames,
  games,
  gameScores,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { computeAdvancement, type BracketGame } from "@/lib/tournament-engine";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/tournaments/[id]/advance — advance winner after game final
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);
  const body = await request.json();
  const { gameId } = body;

  if (!gameId) {
    return NextResponse.json({ error: "gameId required" }, { status: 400 });
  }

  // Get all bracket games for this tournament
  const bracketEntries = await db
    .select()
    .from(tournamentGames)
    .where(eq(tournamentGames.tournamentId, tournamentId));

  // Build BracketGame array with scores
  const allBracketGames: BracketGame[] = await Promise.all(
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
        id: bg.id,
        gameId: bg.gameId,
        bracketPosition: bg.bracketPosition ?? 0,
        homeTeam: game?.homeTeam ?? "TBD",
        awayTeam: game?.awayTeam ?? "TBD",
        homeScore: score?.homeScore ?? 0,
        awayScore: score?.awayScore ?? 0,
        status: game?.status ?? "scheduled",
        winnerAdvancesTo: bg.winnerAdvancesTo,
        loserDropsTo: bg.loserDropsTo,
      };
    })
  );

  const result = computeAdvancement(allBracketGames, gameId);

  if (!result) {
    return NextResponse.json(
      { error: "No advancement possible (game not final or no next slot)" },
      { status: 400 }
    );
  }

  // Find the next game's actual game ID from bracket position
  const nextBracket = bracketEntries.find(
    (bg) => bg.bracketPosition === result.nextBracketPosition
  );

  if (nextBracket) {
    // Update the game row with the winner's team name
    const updateField =
      result.side === "home"
        ? { homeTeam: result.winnerTeam }
        : { awayTeam: result.winnerTeam };

    await db
      .update(games)
      .set(updateField)
      .where(eq(games.id, nextBracket.gameId));
  }

  // Handle loser advancement (double-elim)
  if (result.loserBracketPosition && result.loserTeam) {
    const loserBracket = bracketEntries.find(
      (bg) => bg.bracketPosition === result.loserBracketPosition
    );
    if (loserBracket) {
      const updateField =
        result.loserSide === "home"
          ? { homeTeam: result.loserTeam }
          : { awayTeam: result.loserTeam };

      await db
        .update(games)
        .set(updateField)
        .where(eq(games.id, loserBracket.gameId));
    }
  }

  return NextResponse.json({
    success: true,
    winner: result.winnerTeam,
    advancedTo: result.nextBracketPosition,
    side: result.side,
  });
}

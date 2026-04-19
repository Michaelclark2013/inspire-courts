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
import { eq, desc, inArray } from "drizzle-orm";
import { computeAdvancement, type BracketGame } from "@/lib/tournament-engine";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/tournaments/[id]/advance — advance winner after game final
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }

  try {
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

    // Batch-fetch games + scores for all bracket entries in 2 queries instead
    // of 2 queries per entry. A 16-team bracket now does 2 round-trips
    // instead of 32 (was the N+1 bottleneck on the advance endpoint).
    const gameIds = bracketEntries.map((bg) => bg.gameId);
    const [gameRows, scoreRows] = gameIds.length
      ? await Promise.all([
          db.select().from(games).where(inArray(games.id, gameIds)),
          db
            .select()
            .from(gameScores)
            .where(inArray(gameScores.gameId, gameIds))
            .orderBy(desc(gameScores.updatedAt)),
        ])
      : [[], []];

    const gameById = new Map(gameRows.map((g) => [g.id, g]));
    // scoreRows is ordered newest-first per gameId; keep only the first
    // (= latest) score we see for each gameId.
    const latestScoreByGame = new Map<number, typeof scoreRows[0]>();
    for (const s of scoreRows) {
      if (!latestScoreByGame.has(s.gameId)) latestScoreByGame.set(s.gameId, s);
    }

    const allBracketGames: BracketGame[] = bracketEntries.map((bg) => {
      const game = gameById.get(bg.gameId);
      const score = latestScoreByGame.get(bg.gameId);
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
    });

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

    revalidatePath(`/admin/tournaments/${id}`);
    revalidatePath(`/tournaments/${id}`);

    return NextResponse.json({
      success: true,
      winner: result.winnerTeam,
      advancedTo: result.nextBracketPosition,
      side: result.side,
    });
  } catch (err) {
    logger.error("Failed to advance bracket", { tournamentId, error: String(err) });
    return NextResponse.json({ error: "Failed to advance bracket" }, { status: 500 });
  }
}

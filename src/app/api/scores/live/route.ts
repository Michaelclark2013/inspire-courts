import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, gameScores } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

// GET /api/scores/live — public endpoint for live scores and recent finals
export async function GET() {
  try {
    // Get all live games and recent final games
    const allGames = await db
      .select()
      .from(games)
      .where(inArray(games.status, ["live", "final", "scheduled"]))
      .orderBy(desc(games.createdAt));

    const gamesWithScores = await Promise.all(
      allGames.map(async (game) => {
        const [latestScore] = await db
          .select()
          .from(gameScores)
          .where(eq(gameScores.gameId, game.id))
          .orderBy(desc(gameScores.updatedAt))
          .limit(1);

        return {
          id: game.id,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeScore: latestScore?.homeScore ?? 0,
          awayScore: latestScore?.awayScore ?? 0,
          quarter: latestScore?.quarter ?? null,
          division: game.division,
          court: game.court,
          eventName: game.eventName,
          scheduledTime: game.scheduledTime,
          status: game.status,
        };
      })
    );

    return NextResponse.json(gamesWithScores, {
      headers: { "Cache-Control": "public, max-age=15" },
    });
  } catch {
    // DB not configured — return empty
    return NextResponse.json([]);
  }
}

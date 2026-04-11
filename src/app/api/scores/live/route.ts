import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, gameScores } from "@/lib/db/schema";
import { desc, inArray, sql, eq } from "drizzle-orm";

// GET /api/scores/live — public endpoint for live scores and recent finals
export async function GET() {
  try {
    // Query 1: Get all relevant games
    const allGames = await db
      .select()
      .from(games)
      .where(inArray(games.status, ["live", "final", "scheduled"]))
      .orderBy(desc(games.createdAt));

    if (allGames.length === 0) {
      return NextResponse.json([], {
        headers: { "Cache-Control": "public, max-age=15" },
      });
    }

    // Query 2: Get all scores in one query, then pick latest per game in JS
    const allScores = await db
      .select()
      .from(gameScores)
      .orderBy(desc(gameScores.updatedAt));

    // Build a map of gameId → latest score
    const latestScoreMap = new Map<
      number,
      { homeScore: number; awayScore: number; quarter: string | null }
    >();
    for (const score of allScores) {
      if (!latestScoreMap.has(score.gameId)) {
        latestScoreMap.set(score.gameId, {
          homeScore: score.homeScore,
          awayScore: score.awayScore,
          quarter: score.quarter,
        });
      }
    }

    const gamesWithScores = allGames.map((game) => {
      const score = latestScoreMap.get(game.id);
      return {
        id: game.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeScore: score?.homeScore ?? 0,
        awayScore: score?.awayScore ?? 0,
        quarter: score?.quarter ?? null,
        division: game.division,
        court: game.court,
        eventName: game.eventName,
        scheduledTime: game.scheduledTime,
        status: game.status,
      };
    });

    return NextResponse.json(gamesWithScores, {
      headers: { "Cache-Control": "public, max-age=15" },
    });
  } catch {
    // DB not configured — return empty
    return NextResponse.json([]);
  }
}

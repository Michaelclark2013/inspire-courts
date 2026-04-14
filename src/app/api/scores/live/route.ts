import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, gameScores } from "@/lib/db/schema";
import { desc, inArray } from "drizzle-orm";

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

    // Query 2: Get all scores in one query
    const allScores = await db
      .select()
      .from(gameScores)
      .orderBy(desc(gameScores.updatedAt));

    // Build maps: latest score per game + all quarter scores per game
    const latestScoreMap = new Map<
      number,
      { homeScore: number; awayScore: number; quarter: string | null }
    >();
    const quarterScoresMap = new Map<
      number,
      { quarter: string | null; homeScore: number; awayScore: number }[]
    >();

    for (const score of allScores) {
      // Latest score (first entry per gameId since sorted desc)
      if (!latestScoreMap.has(score.gameId)) {
        latestScoreMap.set(score.gameId, {
          homeScore: score.homeScore,
          awayScore: score.awayScore,
          quarter: score.quarter,
        });
      }

      // All quarter scores
      if (!quarterScoresMap.has(score.gameId)) {
        quarterScoresMap.set(score.gameId, []);
      }
      quarterScoresMap.get(score.gameId)!.push({
        quarter: score.quarter,
        homeScore: score.homeScore,
        awayScore: score.awayScore,
      });
    }

    // Sort quarter scores chronologically (Q1, Q2, Q3, Q4, OT, final)
    const quarterOrder: Record<string, number> = { "1": 1, "2": 2, "3": 3, "4": 4, "OT": 5, "final": 6 };
    for (const [, scores] of quarterScoresMap) {
      scores.sort((a, b) => (quarterOrder[a.quarter || ""] || 99) - (quarterOrder[b.quarter || ""] || 99));
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
        scores: quarterScoresMap.get(game.id) || [],
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

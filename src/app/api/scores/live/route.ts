import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, gameScores } from "@/lib/db/schema";
import { desc, inArray } from "drizzle-orm";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// GET /api/scores/live — public endpoint for live scores and recent finals
export async function GET(request: Request) {
  // Rate limit: 60 requests per minute per IP
  const ip = getClientIp(request);
  if (isRateLimited(ip + ":scores", 60, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": "10" } }
    );
  }

  try {
    // Query 1: Get relevant games (limit to 100 most recent to prevent
    // unbounded responses). Narrow projection to fields actually shipped
    // back — saves payload + DB IO on a public 60/min endpoint.
    const allGames = await db
      .select({
        id: games.id,
        homeTeam: games.homeTeam,
        awayTeam: games.awayTeam,
        division: games.division,
        court: games.court,
        eventName: games.eventName,
        scheduledTime: games.scheduledTime,
        status: games.status,
        createdAt: games.createdAt,
      })
      .from(games)
      .where(inArray(games.status, ["live", "final", "scheduled"]))
      .orderBy(desc(games.createdAt))
      .limit(100);

    if (allGames.length === 0) {
      return NextResponse.json([], {
        headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=30" },
      });
    }

    // Query 2: Get scores only for the games we fetched (not all scores in DB)
    const gameIds = allGames.map((g) => g.id);
    const allScores = await db
      .select({
        gameId: gameScores.gameId,
        homeScore: gameScores.homeScore,
        awayScore: gameScores.awayScore,
        quarter: gameScores.quarter,
      })
      .from(gameScores)
      .where(inArray(gameScores.gameId, gameIds))
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
      headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=20" },
    });
  } catch (err) {
    logger.error("Failed to fetch live scores", { error: String(err) });
    // Don't let a CDN cache the empty error payload — clients should
    // retry against fresh data on the next poll.
    return NextResponse.json([], {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

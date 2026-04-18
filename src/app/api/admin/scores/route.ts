import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { games, gameScores } from "@/lib/db/schema";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

// GET /api/admin/scores — list all games with latest scores
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "score_entry")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allGames = await db.select().from(games).orderBy(desc(games.createdAt));

    if (allGames.length === 0) return NextResponse.json([]);

    // Batch: get latest score per game in 1 query instead of N
    const ids = allGames.map((g) => g.id);
    const latestScores = await db
      .select({
        gameId: gameScores.gameId,
        homeScore: gameScores.homeScore,
        awayScore: gameScores.awayScore,
        quarter: gameScores.quarter,
        updatedAt: gameScores.updatedAt,
      })
      .from(gameScores)
      .where(inArray(gameScores.gameId, ids))
      .orderBy(desc(gameScores.updatedAt));

    // Build map: gameId → latest score (first occurrence since ordered by updatedAt desc)
    const scoreMap = new Map<number, (typeof latestScores)[0]>();
    for (const s of latestScores) {
      if (!scoreMap.has(s.gameId)) scoreMap.set(s.gameId, s);
    }

    const gamesWithScores = allGames.map((game) => {
      const latest = scoreMap.get(game.id);
      return {
        ...game,
        homeScore: latest?.homeScore ?? 0,
        awayScore: latest?.awayScore ?? 0,
        lastQuarter: latest?.quarter ?? null,
      };
    });

    return NextResponse.json(gamesWithScores, {
      headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=10" },
    });
  } catch (err) {
    logger.error("Failed to fetch admin scores", { error: String(err) });
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}

// POST /api/admin/scores — create a game
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "score_entry")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { homeTeam, awayTeam, division, court, eventName, scheduledTime } = body;

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: "Home and away teams are required" },
        { status: 400 }
      );
    }

    const [game] = await db
      .insert(games)
      .values({
        homeTeam,
        awayTeam,
        division: division || null,
        court: court || null,
        eventName: eventName || null,
        scheduledTime: scheduledTime || null,
        status: "scheduled",
      })
      .returning();

    revalidatePath("/scores");
    return NextResponse.json(game, { status: 201 });
  } catch (err) {
    logger.error("Failed to create game", { error: String(err) });
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
  }
}

// PUT /api/admin/scores — update a game score
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "score_entry")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { gameId, homeScore, awayScore, quarter, status } = body;

    if (!gameId) {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 });
    }

    // Update game status
    if (status) {
      const validStatuses = ["scheduled", "live", "final"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      await db.update(games).set({ status }).where(eq(games.id, gameId));
    }

    // Insert new score entry
    if (homeScore !== undefined && awayScore !== undefined) {
      if (typeof homeScore !== "number" || typeof awayScore !== "number" || homeScore < 0 || awayScore < 0) {
        return NextResponse.json({ error: "Scores must be non-negative numbers" }, { status: 400 });
      }
      const userId = session.user.id ? Number(session.user.id) : null;
      await db.insert(gameScores).values({
        gameId,
        homeScore,
        awayScore,
        quarter: quarter || null,
        updatedBy: userId && !isNaN(userId) ? userId : null,
      });
    }

    revalidatePath("/scores");
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Failed to update game score", { error: String(err) });
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { games, gameScores } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/admin/scores — list all games with latest scores
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allGames = await db.select().from(games).orderBy(desc(games.createdAt));

  // Get latest score for each game
  const gamesWithScores = await Promise.all(
    allGames.map(async (game) => {
      const [latestScore] = await db
        .select()
        .from(gameScores)
        .where(eq(gameScores.gameId, game.id))
        .orderBy(desc(gameScores.updatedAt))
        .limit(1);

      return {
        ...game,
        homeScore: latestScore?.homeScore ?? 0,
        awayScore: latestScore?.awayScore ?? 0,
        lastQuarter: latestScore?.quarter ?? null,
      };
    })
  );

  return NextResponse.json(gamesWithScores);
}

// POST /api/admin/scores — create a game
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { homeTeam, awayTeam, division, court, eventName, scheduledTime } =
    body;

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

  return NextResponse.json(game, { status: 201 });
}

// PUT /api/admin/scores — update a game score
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { gameId, homeScore, awayScore, quarter, status } = body;

  if (!gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  }

  // Update game status
  if (status) {
    await db.update(games).set({ status }).where(eq(games.id, gameId));
  }

  // Insert new score entry
  if (homeScore !== undefined && awayScore !== undefined) {
    const userId = session.user.id ? Number(session.user.id) : null;
    await db.insert(gameScores).values({
      gameId,
      homeScore,
      awayScore,
      quarter: quarter || null,
      updatedBy: userId && !isNaN(userId) ? userId : null,
    });
  }

  return NextResponse.json({ success: true });
}

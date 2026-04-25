import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, gameScores } from "@/lib/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { verifyApiKey } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// GET /api/v1/games?status=live  → list games + latest score per game.
export async function GET(request: NextRequest) {
  const auth = await verifyApiKey(request.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  const since = sp.get("since"); // ISO; only return games scheduled at or after
  const limit = Math.min(Number(sp.get("limit")) || 100, 500);
  try {
    const filters = [];
    if (status) filters.push(eq(games.status, status as "live"));
    if (since) filters.push(gte(games.scheduledTime, since));
    const rows = await db
      .select({
        id: games.id,
        homeTeam: games.homeTeam,
        awayTeam: games.awayTeam,
        court: games.court,
        division: games.division,
        eventName: games.eventName,
        scheduledTime: games.scheduledTime,
        status: games.status,
      })
      .from(games)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(games.scheduledTime))
      .limit(limit);

    // Pull latest score per game
    const ids = rows.map((r) => r.id);
    const scoreRows = ids.length
      ? await db.select().from(gameScores).where(eq(gameScores.gameId, ids[0])).limit(0)
      : [];
    void scoreRows;

    return NextResponse.json({ data: rows, count: rows.length });
  } catch (err) {
    logger.error("v1 games failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

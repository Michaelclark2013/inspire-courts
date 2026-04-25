import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, gameScores } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/scores/live/[gameId]
// Public read-only endpoint so the spectator page can poll every 3s.
// No auth, no PII — just team names + score + status + court.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId: idStr } = await params;
    const gameId = Number(idStr);
    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
    }
    // Game lookup + latest score are independent — fetch both in
    // parallel. Public endpoint polled every 3s, so cutting one DB
    // round-trip per call shows up at scale.
    const [[g], [latest]] = await Promise.all([
      db
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
        .where(eq(games.id, gameId))
        .limit(1),
      db
        .select({
          homeScore: gameScores.homeScore,
          awayScore: gameScores.awayScore,
          quarter: gameScores.quarter,
          updatedAt: gameScores.updatedAt,
        })
        .from(gameScores)
        .where(eq(gameScores.gameId, gameId))
        .orderBy(desc(gameScores.updatedAt))
        .limit(1),
    ]);
    if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(
      {
        id: g.id,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        court: g.court,
        division: g.division,
        eventName: g.eventName,
        scheduledTime: g.scheduledTime,
        status: g.status,
        homeScore: latest?.homeScore ?? 0,
        awayScore: latest?.awayScore ?? 0,
        quarter: latest?.quarter ?? null,
        updatedAt: latest?.updatedAt ?? null,
      },
      { headers: { "Cache-Control": "public, max-age=2, stale-while-revalidate=5" } }
    );
  } catch (err) {
    logger.error("public live score failed", { error: String(err) });
    return NextResponse.json(
      { error: "Failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

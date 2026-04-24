import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { games, gameScores, shifts, shiftAssignments, users } from "@/lib/db/schema";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/portal/staff/my-games
// Returns games the caller is working today — matched by shift
// assignments whose shift overlaps a scheduled game's court + time
// window. Plus any games they've already scored. Used by the staff
// portal score-entry screen.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = Number(session.user.id);
  if (!Number.isInteger(uid) || uid <= 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = session.user.role;

  try {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    // Staff + admin only — refs don't score-keep and coach/parent
    // accounts don't belong here.
    if (!["admin", "staff"].includes(role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const todaysGames = await db
      .select()
      .from(games)
      .where(
        and(
          gte(games.scheduledTime, dayStart.toISOString()),
          lte(games.scheduledTime, dayEnd.toISOString())
        )
      )
      .orderBy(asc(games.scheduledTime));

    if (todaysGames.length === 0) {
      return NextResponse.json({ games: [], myShifts: [] });
    }

    // Latest score per game.
    const gameIds = todaysGames.map((g) => g.id);
    const latestScores = await db
      .select({
        gameId: gameScores.gameId,
        homeScore: gameScores.homeScore,
        awayScore: gameScores.awayScore,
        quarter: gameScores.quarter,
        updatedAt: gameScores.updatedAt,
        updatedBy: gameScores.updatedBy,
        updatedByName: users.name,
      })
      .from(gameScores)
      .leftJoin(users, eq(users.id, gameScores.updatedBy))
      .where(inArray(gameScores.gameId, gameIds))
      .orderBy(desc(gameScores.updatedAt));
    const scoreMap = new Map<number, (typeof latestScores)[0]>();
    for (const s of latestScores) {
      if (!scoreMap.has(s.gameId)) scoreMap.set(s.gameId, s);
    }

    // My shifts today — determines which games are "mine" (highlighted).
    const myShifts = await db
      .select({
        shift: shifts,
        status: shiftAssignments.status,
      })
      .from(shiftAssignments)
      .leftJoin(shifts, eq(shifts.id, shiftAssignments.shiftId))
      .where(
        and(
          eq(shiftAssignments.userId, uid),
          inArray(shiftAssignments.status, ["assigned", "confirmed", "completed"])
        )
      );
    const todaysShifts = myShifts.filter((row) => {
      const s = row.shift;
      if (!s) return false;
      const start = new Date(s.startAt).getTime();
      const end = new Date(s.endAt).getTime();
      return end >= dayStart.getTime() && start <= dayEnd.getTime();
    });

    // A game is "mine" if I have a shift today whose courts text
    // contains the game's court. Cheap substring match — court names
    // are short strings like "Court 1".
    const enriched = todaysGames.map((g) => {
      const latest = scoreMap.get(g.id);
      const mine = g.court
        ? todaysShifts.some((row) =>
            (row.shift?.courts || "").toLowerCase().includes(g.court!.toLowerCase())
          )
        : false;
      return {
        ...g,
        homeScore: latest?.homeScore ?? 0,
        awayScore: latest?.awayScore ?? 0,
        lastQuarter: latest?.quarter ?? null,
        enteredByName: latest?.updatedByName ?? null,
        enteredAt: latest?.updatedAt ?? null,
        isMine: mine,
      };
    });

    return NextResponse.json(
      {
        games: enriched,
        myShifts: todaysShifts.map((r) => r.shift).filter(Boolean),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("my-games fetch failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

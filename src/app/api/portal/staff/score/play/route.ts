import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { playEvents, gameScores, games, PLAY_TYPES } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// POST /api/portal/staff/score/play
// Body: { gameId, team ("home"|"away"), playType, points,
//         playerId?, playerJersey?, playerName?, quarter? }
// Records one play event and updates the rolling totals. Every tap
// autosaves without a Save button. Team totals are re-summed from
// non-voided play_events so an undo flips the number back cleanly.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["admin", "staff"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = Number(session.user.id);

  try {
    const body = await request.json();
    const gameId = Number(body?.gameId);
    const team = body?.team;
    const playType = body?.playType;
    const points = Number(body?.points ?? 0);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }
    if (!["home", "away"].includes(team)) {
      return NextResponse.json({ error: "Invalid team" }, { status: 400 });
    }
    if (!(PLAY_TYPES as readonly string[]).includes(playType)) {
      return NextResponse.json({ error: "Invalid playType" }, { status: 400 });
    }
    if (!Number.isInteger(points) || points < 0 || points > 9) {
      return NextResponse.json({ error: "Invalid points" }, { status: 400 });
    }

    const [game] = await db
      .select({ id: games.id, status: games.status })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const [play] = await db
      .insert(playEvents)
      .values({
        gameId,
        team,
        playType,
        points,
        playerId: body?.playerId ? Number(body.playerId) : null,
        playerJersey: body?.playerJersey ? Number(body.playerJersey) : null,
        playerName: typeof body?.playerName === "string" ? body.playerName.trim() || null : null,
        quarter: typeof body?.quarter === "string" ? body.quarter.slice(0, 20) : null,
        recordedBy: uid,
      })
      .returning();

    // Re-sum team totals from non-voided events.
    const [{ homeTotal, awayTotal }] = await db
      .select({
        homeTotal: sql<number>`coalesce(sum(case when team = 'home' and voided = 0 then points else 0 end), 0)`,
        awayTotal: sql<number>`coalesce(sum(case when team = 'away' and voided = 0 then points else 0 end), 0)`,
      })
      .from(playEvents)
      .where(eq(playEvents.gameId, gameId));

    // Persist rolling totals + flip to live if we were scheduled.
    const statusUpdate = game.status === "scheduled" ? { status: "live" as const } : {};
    if (Object.keys(statusUpdate).length > 0) {
      await db.update(games).set(statusUpdate).where(eq(games.id, gameId));
    }
    await db.insert(gameScores).values({
      gameId,
      homeScore: Number(homeTotal) || 0,
      awayScore: Number(awayTotal) || 0,
      quarter: typeof body?.quarter === "string" ? body.quarter.slice(0, 20) : null,
      updatedBy: uid,
    });

    revalidatePath("/scores");
    revalidatePath(`/scores/live/${gameId}`);

    return NextResponse.json({
      ok: true,
      playId: play.id,
      homeScore: Number(homeTotal) || 0,
      awayScore: Number(awayTotal) || 0,
    });
  } catch (err) {
    logger.error("play event failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE /api/portal/staff/score/play?id=N
// Void an event (undo). We don't hard-delete so the audit trail
// survives; we flip `voided=true` and recompute totals.
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["admin", "staff"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = Number(session.user.id);

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const [play] = await db
      .select({
        id: playEvents.id,
        gameId: playEvents.gameId,
        quarter: playEvents.quarter,
        points: playEvents.points,
        team: playEvents.team,
        playType: playEvents.playType,
      })
      .from(playEvents)
      .where(eq(playEvents.id, id))
      .limit(1);
    if (!play) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db
      .update(playEvents)
      .set({ voided: true, voidedAt: new Date().toISOString() })
      .where(eq(playEvents.id, id));

    const [{ homeTotal, awayTotal }] = await db
      .select({
        homeTotal: sql<number>`coalesce(sum(case when team = 'home' and voided = 0 then points else 0 end), 0)`,
        awayTotal: sql<number>`coalesce(sum(case when team = 'away' and voided = 0 then points else 0 end), 0)`,
      })
      .from(playEvents)
      .where(eq(playEvents.gameId, play.gameId));

    await db.insert(gameScores).values({
      gameId: play.gameId,
      homeScore: Number(homeTotal) || 0,
      awayScore: Number(awayTotal) || 0,
      quarter: play.quarter,
      updatedBy: uid,
    });

    await recordAudit({
      session,
      request,
      action: "game.play_voided",
      entityType: "game",
      entityId: play.gameId,
      before: { points: play.points, team: play.team, playType: play.playType },
      after: null,
    });

    return NextResponse.json({ ok: true, homeScore: Number(homeTotal) || 0, awayScore: Number(awayTotal) || 0 });
  } catch (err) {
    logger.error("play undo failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// GET /api/portal/staff/score/play?gameId=N
// Last 30 non-voided events for undo stack + box-score rendering.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["admin", "staff"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const gameId = Number(searchParams.get("gameId"));
    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
    }
    const events = await db
      .select()
      .from(playEvents)
      .where(and(eq(playEvents.gameId, gameId), eq(playEvents.voided, false)))
      .orderBy(sql`${playEvents.recordedAt} desc`)
      .limit(100);
    return NextResponse.json({ events });
  } catch (err) {
    logger.error("play list failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { activeScoringSessions, users } from "@/lib/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Any session older than this is considered stale / the scorer left.
const STALE_MS = 30_000;

// POST /api/portal/staff/score/heartbeat  { gameId }
// Upsert this user's active-scoring session for the given game. Call
// every 10 seconds from the scoring client so admin + other scorers
// know who's actively editing.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["admin", "staff"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = Number(session.user.id);

  try {
    const body = await request.json();
    const gameId = Number(body?.gameId);
    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }
    const nowIso = new Date().toISOString();

    const [existing] = await db
      .select()
      .from(activeScoringSessions)
      .where(and(eq(activeScoringSessions.gameId, gameId), eq(activeScoringSessions.userId, uid)))
      .limit(1);

    if (existing) {
      await db
        .update(activeScoringSessions)
        .set({ lastHeartbeatAt: nowIso })
        .where(eq(activeScoringSessions.id, existing.id));
    } else {
      await db.insert(activeScoringSessions).values({
        gameId,
        userId: uid,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("heartbeat failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// GET /api/portal/staff/score/heartbeat?gameId=N
// Return list of active scorers (non-stale) for a game. Client polls
// this every 8s to render "Sarah is also scoring" chips.
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
    const cutoff = new Date(Date.now() - STALE_MS).toISOString();
    const rows = await db
      .select({
        userId: activeScoringSessions.userId,
        startedAt: activeScoringSessions.startedAt,
        lastHeartbeatAt: activeScoringSessions.lastHeartbeatAt,
        name: users.name,
        photoUrl: users.photoUrl,
      })
      .from(activeScoringSessions)
      .leftJoin(users, eq(users.id, activeScoringSessions.userId))
      .where(
        and(
          eq(activeScoringSessions.gameId, gameId),
          gte(activeScoringSessions.lastHeartbeatAt, cutoff)
        )
      );
    return NextResponse.json({ scorers: rows });
  } catch (err) {
    logger.error("heartbeat list failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE — explicit exit (user closed the sheet). Best-effort; the
// stale-cutoff cleans up anyway.
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = Number(session.user.id);
  try {
    const { searchParams } = new URL(request.url);
    const gameId = Number(searchParams.get("gameId"));
    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
    }
    await db
      .delete(activeScoringSessions)
      .where(and(eq(activeScoringSessions.gameId, gameId), eq(activeScoringSessions.userId, uid)));
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ ok: true }); }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { games, gameScores } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// POST /api/portal/staff/score
// Body: { gameId, homeScore, awayScore, quarter?, status? }
// Staff-self-serve score entry — writes an attributed gameScores row
// and optionally flips games.status. Always records the actor via
// updatedBy so admin can verify who submitted the score.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["admin", "staff"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = Number(session.user.id);
  if (!Number.isInteger(uid) || uid <= 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const gameId = Number(body?.gameId);
    const homeScore = Number(body?.homeScore);
    const awayScore = Number(body?.awayScore);
    const quarter = typeof body?.quarter === "string" ? body.quarter.slice(0, 20) : null;
    const status = body?.status;

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }
    if (!Number.isFinite(homeScore) || homeScore < 0 || homeScore > 999) {
      return NextResponse.json({ error: "Invalid home score" }, { status: 400 });
    }
    if (!Number.isFinite(awayScore) || awayScore < 0 || awayScore > 999) {
      return NextResponse.json({ error: "Invalid away score" }, { status: 400 });
    }
    const validStatus = ["scheduled", "live", "final"].includes(status) ? status : null;

    const [before] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
    if (!before) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    await db.transaction(async (tx) => {
      if (validStatus && validStatus !== before.status) {
        await tx.update(games).set({ status: validStatus }).where(eq(games.id, gameId));
      }
      await tx.insert(gameScores).values({
        gameId,
        homeScore: Math.round(homeScore),
        awayScore: Math.round(awayScore),
        quarter,
        updatedBy: uid,
      });
    });

    await recordAudit({
      session,
      request,
      action: "game.score_entered",
      entityType: "game",
      entityId: gameId,
      before: null,
      after: {
        source: "portal",
        homeTeam: before.homeTeam,
        awayTeam: before.awayTeam,
        homeScore,
        awayScore,
        quarter,
        status: validStatus ?? before.status,
      },
    });

    revalidatePath("/scores");
    revalidatePath("/admin/scores");

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("portal staff score submit failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { games, gameScores } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-helpers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const staffScoreSchema = z.object({
  gameId: z.coerce.number().int().positive(),
  homeScore: z.coerce.number().int().min(0).max(999),
  awayScore: z.coerce.number().int().min(0).max(999),
  quarter: z.string().max(20).optional().nullable(),
  status: z.enum(["scheduled", "live", "final"]).optional().nullable(),
});

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
  // Score rows must carry a named human as the scorekeeper-of-record.
  if (!session.user?.name || !String(session.user.name).trim()) {
    return NextResponse.json(
      { error: "Your account is missing a name. Update your profile before scoring." },
      { status: 400 }
    );
  }

  const parsed = await parseJsonBody(request, staffScoreSchema);
  if (!parsed.ok) return parsed.response;
  const { gameId, homeScore, awayScore } = parsed.data;
  const quarter = parsed.data.quarter ?? null;
  const validStatus = parsed.data.status ?? null;

  try {
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

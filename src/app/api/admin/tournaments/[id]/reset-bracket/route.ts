import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentGames,
  games,
  gameScores,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { lookupIdempotent, storeIdempotent } from "@/lib/idempotency";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/tournaments/[id]/reset-bracket
// Undo a bracket generation: delete every game + tournament_games row
// created for this tournament and move the tournament back to "draft"
// so it can be regenerated with corrected seedings.
//
// Gated by status — refuses to reset a tournament that is "active" or
// "completed" (live games being played, or games already finalized). Use
// admin support for those.
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }

  // Idempotency replay — a retry after a DB wipe partially committed
  // would otherwise try to wipe an already-empty bracket.
  const idemKey = request.headers.get("idempotency-key");
  const cached = lookupIdempotent(session.user.id, idemKey);
  if (cached) {
    return NextResponse.json(cached.body, {
      status: cached.status,
      headers: { "Idempotent-Replay": "true" },
    });
  }

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);

  if (!tournament) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (tournament.status === "active" || tournament.status === "completed") {
    return NextResponse.json(
      {
        error:
          "Cannot reset a bracket that has active or completed games. Contact support.",
      },
      { status: 400 }
    );
  }

  try {
    // Collect every games.id tied to this tournament via tournament_games,
    // then atomically wipe gameScores, games, tournament_games, and reset
    // tournament.status to "draft". All-or-nothing so a partial wipe can't
    // leave orphaned score rows pointing at deleted games.
    const bracketRows = await db
      .select({ gameId: tournamentGames.gameId })
      .from(tournamentGames)
      .where(eq(tournamentGames.tournamentId, tournamentId));

    const gameIds = bracketRows.map((r) => r.gameId);

    await db.transaction(async (tx) => {
      if (gameIds.length > 0) {
        await tx.delete(gameScores).where(inArray(gameScores.gameId, gameIds));
        await tx
          .delete(tournamentGames)
          .where(eq(tournamentGames.tournamentId, tournamentId));
        await tx.delete(games).where(inArray(games.id, gameIds));
      }
      await tx
        .update(tournaments)
        .set({ status: "draft", updatedAt: new Date().toISOString() })
        .where(eq(tournaments.id, tournamentId));
    });

    await recordAudit({
      session,
      action: "tournament.bracket_reset",
      entityType: "tournament",
      entityId: tournamentId,
      before: { status: tournament.status, deletedGameCount: gameIds.length },
      after: { status: "draft" },
    });

    revalidatePath(`/admin/tournaments/${id}`);
    revalidatePath(`/tournaments/${id}`);
    revalidatePath("/tournaments");

    const responseBody = { success: true, deletedGameCount: gameIds.length };
    storeIdempotent(session.user.id, idemKey, responseBody, 200);
    return NextResponse.json(responseBody);
  } catch (err) {
    logger.error("Failed to reset bracket", { tournamentId, error: String(err) });
    return NextResponse.json({ error: "Failed to reset bracket" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { games, gameScores } from "@/lib/db/schema";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";

// Pagination cap — no single page can be larger than this regardless of
// ?limit, so a misbehaving client can't dump the entire games table.
const SCORES_MAX_LIMIT = 200;
const SCORES_DEFAULT_LIMIT = 50;

// GET /api/admin/scores — list games with latest scores (paginated).
//   ?page=                 1-indexed page (default 1)
//   ?limit=                page size (default 50, max 200)
//   ?include=tournaments   bundle distinct tournament names into response
// Response:
//   { data: Game[], total, page, limit, totalPages, tournaments? }
// Backwards note: was returning a bare array. Now returns the wrapped shape
// above so clients can reliably paginate. Legacy clients that consumed the
// array should migrate to reading `.data`.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "score_entry")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
  const rawLimit = Math.floor(Number(sp.get("limit")) || SCORES_DEFAULT_LIMIT);
  const limit = Math.min(Math.max(1, rawLimit || SCORES_DEFAULT_LIMIT), SCORES_MAX_LIMIT);
  const offset = (page - 1) * limit;

  try {
    // Count first so we can return total / totalPages without fetching
    // everything just to .length it.
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(games);
    const totalCount = Number(total) || 0;

    const pagedGames = await db
      .select()
      .from(games)
      .orderBy(desc(games.createdAt))
      .limit(limit)
      .offset(offset);

    if (pagedGames.length === 0) {
      return NextResponse.json({
        data: [],
        total: totalCount,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      });
    }

    // Batch: get latest score per game on the current page in 1 query.
    const ids = pagedGames.map((g) => g.id);
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

    const scoreMap = new Map<number, (typeof latestScores)[0]>();
    for (const s of latestScores) {
      if (!scoreMap.has(s.gameId)) scoreMap.set(s.gameId, s);
    }

    const gamesWithScores = pagedGames.map((game) => {
      const latest = scoreMap.get(game.id);
      return {
        ...game,
        homeScore: latest?.homeScore ?? 0,
        awayScore: latest?.awayScore ?? 0,
        lastQuarter: latest?.quarter ?? null,
      };
    });

    const response: Record<string, unknown> = {
      data: gamesWithScores,
      total: totalCount,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    };

    // Optional bundle: distinct tournament/event names so the score-entry
    // page doesn't have to fire a separate /api/admin/tournaments request
    // on mount just to populate a filter dropdown.
    if (sp.get("include") === "tournaments") {
      const tournamentRows = await db
        .selectDistinct({ eventName: games.eventName })
        .from(games);
      response.tournaments = tournamentRows
        .map((r) => r.eventName)
        .filter((n): n is string => typeof n === "string" && n.length > 0)
        .sort();
    }

    return NextResponse.json(response, {
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

    await recordAudit({
      session,
      action: "game.created",
      entityType: "game",
      entityId: game.id,
      before: null,
      after: {
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        division: game.division,
        court: game.court,
        eventName: game.eventName,
        scheduledTime: game.scheduledTime,
      },
    });

    revalidatePath("/scores");
    revalidatePath("/admin/scores");
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

    // Snapshot the game row before any changes so the audit log can
    // capture before/after state for disputes.
    const [beforeGame] = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!beforeGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Update game status (with audit if it actually changed)
    if (status) {
      const validStatuses = ["scheduled", "live", "final"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      if (status !== beforeGame.status) {
        await db.update(games).set({ status }).where(eq(games.id, gameId));
        await recordAudit({
          session,
          action: "game.status_changed",
          entityType: "game",
          entityId: gameId,
          before: {
            status: beforeGame.status,
            homeTeam: beforeGame.homeTeam,
            awayTeam: beforeGame.awayTeam,
          },
          after: { status },
        });
      }
    }

    // Insert new score entry (with audit of the new entry)
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
      await recordAudit({
        session,
        action: "game.score_entered",
        entityType: "game",
        entityId: gameId,
        before: null,
        after: {
          homeTeam: beforeGame.homeTeam,
          awayTeam: beforeGame.awayTeam,
          homeScore,
          awayScore,
          quarter: quarter || null,
        },
      });
    }

    revalidatePath("/scores");
    revalidatePath("/admin/scores");
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Failed to update game score", { error: String(err) });
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}

// DELETE /api/admin/scores?gameId=123
// Remove a game that was created in error. Cascades to gameScores so
// we don't leave orphaned score history. Refuses to delete games that
// are already part of a tournament bracket (tournamentGames row exists) —
// use POST /tournaments/[id]/reset-bracket for that path instead.
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "score_entry")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gameIdRaw = request.nextUrl.searchParams.get("gameId");
  const gameId = Number(gameIdRaw);
  if (!gameIdRaw || !Number.isInteger(gameId) || gameId <= 0) {
    return NextResponse.json({ error: "Valid gameId required" }, { status: 400 });
  }

  try {
    const [existing] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Protect against orphaning a bracket slot: if this game is part of
    // a tournament_games row, the admin should use reset-bracket instead.
    const { tournamentGames } = await import("@/lib/db/schema");
    const [linked] = await db
      .select({ id: tournamentGames.id })
      .from(tournamentGames)
      .where(eq(tournamentGames.gameId, gameId))
      .limit(1);
    if (linked) {
      return NextResponse.json(
        { error: "Game is part of a tournament bracket. Use reset-bracket instead." },
        { status: 400 }
      );
    }

    // All-or-nothing: gameScores children first, then the game itself.
    await db.transaction(async (tx) => {
      await tx.delete(gameScores).where(eq(gameScores.gameId, gameId));
      await tx.delete(games).where(eq(games.id, gameId));
    });

    await recordAudit({
      session,
      action: "game.deleted",
      entityType: "game",
      entityId: gameId,
      before: {
        homeTeam: existing.homeTeam,
        awayTeam: existing.awayTeam,
        status: existing.status,
        eventName: existing.eventName,
      },
      after: null,
    });

    revalidatePath("/scores");
    revalidatePath("/admin/scores");
    return NextResponse.json({ success: true, id: gameId });
  } catch (err) {
    logger.error("Failed to delete game", { gameId, error: String(err) });
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
  }
}

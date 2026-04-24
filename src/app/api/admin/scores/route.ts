import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { games, gameScores, tournaments, users } from "@/lib/db/schema";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { lookupIdempotent, storeIdempotent } from "@/lib/idempotency";
import { withTiming } from "@/lib/timing";
import { gameCreateSchema, scoreUpdateSchema } from "@/lib/schemas";
import { parseJsonBody, apiNotFound, apiError } from "@/lib/api-helpers";

// Pagination cap — no single page can be larger than this regardless of
// ?limit, so a misbehaving client can't dump the entire games table.
const SCORES_MAX_LIMIT = 200;
const SCORES_DEFAULT_LIMIT = 50;

// Games are stored with an `eventName` string that matches a tournament's
// `name`. When a score/status changes, the public /tournaments/[id] page
// shows the updated result — so we need to bust that ISR cache too.
// Returns the revalidated path if a match was found, else null.
//
// Caches eventName → tournamentId lookups for 60s per process because the
// same handler is called on every score update for the same event and
// most real traffic clusters by event.
const eventToTournamentCache = new Map<string, { id: number | null; expiresAt: number }>();
const EVENT_CACHE_TTL_MS = 60_000;

async function revalidateTournamentForEvent(eventName: string | null): Promise<string | null> {
  if (!eventName) return null;
  try {
    const cached = eventToTournamentCache.get(eventName);
    const now = Date.now();
    let tournamentId: number | null;
    if (cached && cached.expiresAt > now) {
      tournamentId = cached.id;
    } else {
      const [t] = await db
        .select({ id: tournaments.id })
        .from(tournaments)
        .where(eq(tournaments.name, eventName))
        .limit(1);
      tournamentId = t?.id ?? null;
      eventToTournamentCache.set(eventName, { id: tournamentId, expiresAt: now + EVENT_CACHE_TTL_MS });
      // Cap the cache at ~200 entries.
      if (eventToTournamentCache.size > 200) {
        const firstKey = eventToTournamentCache.keys().next().value;
        if (firstKey) eventToTournamentCache.delete(firstKey);
      }
    }
    if (tournamentId != null) {
      revalidatePath(`/tournaments/${tournamentId}`);
      return `/tournaments/${tournamentId}`;
    }
  } catch {
    // Non-fatal — revalidation is a best-effort cache bust.
  }
  return null;
}

// GET /api/admin/scores — list games with latest scores (paginated).
//   ?page=                 1-indexed page (default 1)
//   ?limit=                page size (default 50, max 200)
//   ?include=tournaments   bundle distinct tournament names into response
// Response:
//   { data: Game[], total, page, limit, totalPages, tournaments? }
// Backwards note: was returning a bare array. Now returns the wrapped shape
// above so clients can reliably paginate. Legacy clients that consumed the
// array should migrate to reading `.data`.
export const GET = withTiming("admin.scores.list", async (request: NextRequest) => {
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

    // Batch: get latest score per game on the current page in 1 query,
    // joined with the entering user for attribution.
    const ids = pagedGames.map((g) => g.id);
    const latestScores = await db
      .select({
        gameId: gameScores.gameId,
        homeScore: gameScores.homeScore,
        awayScore: gameScores.awayScore,
        quarter: gameScores.quarter,
        updatedAt: gameScores.updatedAt,
        updatedBy: gameScores.updatedBy,
        updatedByName: users.name,
        updatedByRole: users.role,
        updatedByPhotoUrl: users.photoUrl,
      })
      .from(gameScores)
      .leftJoin(users, eq(users.id, gameScores.updatedBy))
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
        // Who entered the latest score — shown on the game card so
        // admin can see which scorekeeper captured the result.
        enteredBy: latest?.updatedBy ?? null,
        enteredByName: latest?.updatedByName ?? null,
        enteredByRole: latest?.updatedByRole ?? null,
        enteredByPhotoUrl: latest?.updatedByPhotoUrl ?? null,
        enteredAt: latest?.updatedAt ?? null,
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
});

// POST /api/admin/scores — create a game
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "score_entry")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate-limit game creation to keep a scripted loop from flooding games.
  const ip = getClientIp(request);
  if (isRateLimited(`admin-create-game:${ip}`, 60, 60_000)) {
    return NextResponse.json(
      { error: "Too many game-create requests. Slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // Idempotency guard: replay same response if the client retries with
  // the same Idempotency-Key (e.g. flaky network after a POST).
  const idemKey = request.headers.get("idempotency-key");
  const cached = lookupIdempotent(session.user.id, idemKey);
  if (cached) {
    return NextResponse.json(cached.body, {
      status: cached.status,
      headers: { "Idempotent-Replay": "true" },
    });
  }

  const parsed = await parseJsonBody(request, gameCreateSchema);
  if (!parsed.ok) return parsed.response;
  const { homeTeam, awayTeam, division, court, eventName, scheduledTime } = parsed.data;

  try {

    const [game] = await db
      .insert(games)
      .values({
        homeTeam: homeTeam.trim().slice(0, 200),
        awayTeam: awayTeam.trim().slice(0, 200),
        division: division ? division.trim().slice(0, 50) : null,
        court: court ? court.trim().slice(0, 50) : null,
        eventName: eventName ? eventName.trim().slice(0, 200) : null,
        scheduledTime: scheduledTime ? scheduledTime.slice(0, 40) : null,
        status: "scheduled",
      })
      .returning();

    await recordAudit({
      session,
      request,
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
    await revalidateTournamentForEvent(game.eventName);
    storeIdempotent(session.user.id, idemKey, game, 201);
    return NextResponse.json(game, { status: 201 });
  } catch (err) {
    logger.error("Failed to create game", { error: String(err) });
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
  }
}

// PUT /api/admin/scores — update a game score (legacy path; see PATCH below)
export async function PUT(request: NextRequest) {
  return updateGameScore(request);
}

// PATCH /api/admin/scores — idiomatic partial-update alias for PUT.
// A game-score update only mutates a subset of fields (scores, quarter,
// and/or status), which matches PATCH semantics better than PUT.
export async function PATCH(request: NextRequest) {
  return updateGameScore(request);
}

async function updateGameScore(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "score_entry")) {
    return apiError("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, scoreUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { gameId, homeScore, awayScore, quarter, status } = parsed.data;

  try {
    // Snapshot the game row before any changes so the audit log can
    // capture before/after state for disputes.
    const [beforeGame] = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (!beforeGame) {
      return apiNotFound("Game not found");
    }

    // A "go final" submission typically sets BOTH status=final AND the
    // final homeScore/awayScore in one call. Previously those two writes
    // happened outside a transaction, so a failure between them could
    // leave a game marked `final` with no final-score row recorded.
    const statusChanged = status && status !== beforeGame.status;
    const hasScore = homeScore !== undefined && awayScore !== undefined;
    const rawUserId = session.user.id ? Number(session.user.id) : null;
    const scorerUserId =
      rawUserId !== null && Number.isInteger(rawUserId) && rawUserId > 0
        ? rawUserId
        : null;

    if (statusChanged || hasScore) {
      await db.transaction(async (tx) => {
        if (statusChanged) {
          await tx.update(games).set({ status }).where(eq(games.id, gameId));
        }
        if (hasScore) {
          await tx.insert(gameScores).values({
            gameId,
            homeScore,
            awayScore,
            quarter: quarter || null,
            updatedBy: scorerUserId,
          });
        }
      });
    }

    // Audit entries outside the transaction — audit writes are append-only
    // and a failure here shouldn't roll back the score. If audit fails,
    // the game/score rows are still the source of truth.
    if (statusChanged) {
      await recordAudit({
        session,
        request,
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
    if (hasScore) {
      await recordAudit({
        session,
        request,
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
    // If this game belongs to a tournament, bust that tournament's ISR page
    // too so the public bracket view updates.
    await revalidateTournamentForEvent(beforeGame.eventName);
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
      request,
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
    await revalidateTournamentForEvent(existing.eventName);
    return NextResponse.json({ success: true, id: gameId });
  } catch (err) {
    logger.error("Failed to delete game", { gameId, error: String(err) });
    return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
  }
}

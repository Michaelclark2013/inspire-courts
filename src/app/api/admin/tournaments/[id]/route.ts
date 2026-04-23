import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentTeams,
  tournamentGames,
  games,
  gameScores,
} from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";
import { withTiming } from "@/lib/timing";
import { apiNotFound, apiError, parseJsonBody, safeJsonParse } from "@/lib/api-helpers";
import { tournamentUpdateSchema } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/tournaments/[id] — full tournament detail
export const GET = withTiming(
  "admin.tournament.detail",
  async (_request: NextRequest, { params }: Params) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await params;
    const tournamentId = Number(id);
    if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
      return apiError("Invalid tournament id", 400);
    }

    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId));

    if (!tournament) {
      return apiNotFound("Tournament not found");
    }

  // Get teams
  const teams = await db
    .select()
    .from(tournamentTeams)
    .where(eq(tournamentTeams.tournamentId, tournamentId))
    .orderBy(tournamentTeams.seed);

  // Get bracket games with scores
  const bracketGames = await db
    .select()
    .from(tournamentGames)
    .where(eq(tournamentGames.tournamentId, tournamentId));

  const gameIds = bracketGames.map((bg) => bg.gameId);

  // Fetch all game details and scores in two batched queries (no N+1)
  const [allGames, allScores] = gameIds.length
    ? await Promise.all([
        db.select().from(games).where(inArray(games.id, gameIds)),
        db.select().from(gameScores).where(inArray(gameScores.gameId, gameIds)).orderBy(desc(gameScores.updatedAt)),
      ])
    : [[], []];

  // Build a map of latest score per game
  const latestScoreByGame = new Map<number, typeof allScores[0]>();
  for (const score of allScores) {
    if (!latestScoreByGame.has(score.gameId)) {
      latestScoreByGame.set(score.gameId, score);
    }
  }

  const allGameDetails = allGames.map((g) => {
    const score = latestScoreByGame.get(g.id);
    return {
      id: g.id,
      homeTeam: g.homeTeam,
      awayTeam: g.awayTeam,
      division: g.division,
      court: g.court,
      scheduledTime: g.scheduledTime,
      status: g.status,
      homeScore: score?.homeScore ?? 0,
      awayScore: score?.awayScore ?? 0,
      lastQuarter: score?.quarter ?? null,
    };
  });

  // Merge bracket info with game details
  const bracketWithScores = bracketGames.map((bg) => {
    const detail = allGameDetails.find((g) => g.id === bg.gameId);
    return {
      ...bg,
      homeTeam: detail?.homeTeam ?? "TBD",
      awayTeam: detail?.awayTeam ?? "TBD",
      homeScore: detail?.homeScore ?? 0,
      awayScore: detail?.awayScore ?? 0,
      lastQuarter: detail?.lastQuarter ?? null,
      status: detail?.status ?? "scheduled",
      court: detail?.court ?? null,
      scheduledTime: detail?.scheduledTime ?? null,
      division: detail?.division ?? null,
    };
  });

    return NextResponse.json(
      {
        ...tournament,
        divisions: safeJsonParse<string[]>(tournament.divisions, []),
        courts: safeJsonParse<string[]>(tournament.courts, []),
        teams,
        bracket: bracketWithScores,
      },
      {
        // Expose the row's updatedAt as an ETag so clients can send it back
        // in If-Match on PUT for optimistic concurrency.
        headers: { ETag: `"${tournament.updatedAt}"` },
      }
    );
  }
);

// PUT /api/admin/tournaments/[id] — update tournament settings
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId));

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status !== "draft" && existing.status !== "published") {
    return NextResponse.json(
      { error: "Cannot edit active or completed tournaments" },
      { status: 400 }
    );
  }

  // Optimistic concurrency: if the client sent an If-Match header with the
  // row's updatedAt, 412 when it no longer matches (another admin edited
  // the tournament since the client last loaded it). Clients that don't
  // send the header (legacy / GET-less PUT) still work — this is additive.
  const ifMatch = request.headers.get("if-match");
  if (ifMatch && ifMatch !== existing.updatedAt && ifMatch !== `"${existing.updatedAt}"`) {
    return NextResponse.json(
      {
        error: "Tournament was modified by another admin. Refresh and retry.",
        currentUpdatedAt: existing.updatedAt,
      },
      { status: 412 }
    );
  }

  const parsed = await parseJsonBody(request, tournamentUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.name) updates.name = body.name.slice(0, 200);
  if (body.startDate) updates.startDate = body.startDate;
  if (body.endDate !== undefined) updates.endDate = body.endDate || null;
  if (body.location !== undefined)
    updates.location = body.location ? body.location.slice(0, 200) : null;
  if (body.format) updates.format = body.format;
  if (body.divisions) updates.divisions = JSON.stringify(body.divisions);
  if (body.courts) updates.courts = JSON.stringify(body.courts);
  if (body.gameLength) updates.gameLength = body.gameLength;
  if (body.breakLength !== undefined) updates.breakLength = body.breakLength;
  if (body.status) updates.status = body.status;

  // Return the full updated row via .returning() so the caller can sync
  // state without a round-trip refetch.
  const [updated] = await db
    .update(tournaments)
    .set(updates)
    .where(eq(tournaments.id, tournamentId))
    .returning();

  // Audit if any material field changed. Distinguish status transitions
  // (e.g. draft→published) from other edits so the audit stream is easy
  // to scan.
  const statusChanged = updates.status && updates.status !== existing.status;
  await recordAudit({
    session,
    request,
    action: statusChanged ? "tournament.status_changed" : "tournament.updated",
    entityType: "tournament",
    entityId: tournamentId,
    before: {
      name: existing.name,
      status: existing.status,
      format: existing.format,
      startDate: existing.startDate,
      endDate: existing.endDate,
    },
    after: updates,
  });

  revalidatePath(`/admin/tournaments/${id}`);
  revalidatePath(`/tournaments/${id}`);
  revalidatePath("/tournaments");
  return NextResponse.json({ success: true, tournament: updated });
}

// DELETE /api/admin/tournaments/[id] — delete draft tournament
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId));

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Can only delete draft tournaments" },
      { status: 400 }
    );
  }

  // All-or-nothing: wrap the three deletes in a transaction so a mid-way
  // failure can't leave orphaned tournamentGames/tournamentTeams rows
  // pointing at a missing tournament (or vice versa).
  await db.transaction(async (tx) => {
    await tx
      .delete(tournamentGames)
      .where(eq(tournamentGames.tournamentId, tournamentId));
    await tx
      .delete(tournamentTeams)
      .where(eq(tournamentTeams.tournamentId, tournamentId));
    await tx.delete(tournaments).where(eq(tournaments.id, tournamentId));
  });

  await recordAudit({
    session,
    request,
    action: "tournament.deleted",
    entityType: "tournament",
    entityId: tournamentId,
    before: {
      name: existing.name,
      status: existing.status,
      startDate: existing.startDate,
    },
    after: null,
  });

  revalidatePath("/tournaments");
  revalidatePath("/admin/tournaments");
  return NextResponse.json({ success: true });
}

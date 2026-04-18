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
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/tournaments/[id] — full tournament detail
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId));

  if (!tournament) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  return NextResponse.json({
    ...tournament,
    divisions: tournament.divisions ? JSON.parse(tournament.divisions) : [],
    courts: tournament.courts ? JSON.parse(tournament.courts) : [],
    teams,
    bracket: bracketWithScores,
  });
}

// PUT /api/admin/tournaments/[id] — update tournament settings
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);

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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  const VALID_STATUSES = ["draft", "published", "active", "completed"];
  const VALID_FORMATS = ["single_elimination", "double_elimination", "round_robin", "pool_play", "pool_to_bracket"];

  if (body.name && typeof body.name === "string") updates.name = body.name.slice(0, 200);
  if (body.startDate && typeof body.startDate === "string") updates.startDate = body.startDate;
  if (body.endDate !== undefined) updates.endDate = body.endDate || null;
  if (body.location !== undefined) updates.location = typeof body.location === "string" ? body.location.slice(0, 200) : null;
  if (body.format && typeof body.format === "string" && VALID_FORMATS.includes(body.format)) updates.format = body.format;
  if (body.divisions) updates.divisions = JSON.stringify(body.divisions);
  if (body.courts) updates.courts = JSON.stringify(body.courts);
  if (body.gameLength && typeof body.gameLength === "number" && body.gameLength > 0) updates.gameLength = body.gameLength;
  if (body.breakLength !== undefined && typeof body.breakLength === "number" && body.breakLength >= 0) updates.breakLength = body.breakLength;
  if (body.status && typeof body.status === "string" && VALID_STATUSES.includes(body.status)) updates.status = body.status;

  await db
    .update(tournaments)
    .set(updates)
    .where(eq(tournaments.id, tournamentId));

  revalidatePath(`/admin/tournaments/${id}`);
  revalidatePath(`/tournaments/${id}`);
  revalidatePath("/tournaments");
  return NextResponse.json({ success: true });
}

// DELETE /api/admin/tournaments/[id] — delete draft tournament
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);

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

  // Delete related records first
  await db
    .delete(tournamentGames)
    .where(eq(tournamentGames.tournamentId, tournamentId));
  await db
    .delete(tournamentTeams)
    .where(eq(tournamentTeams.tournamentId, tournamentId));
  await db.delete(tournaments).where(eq(tournaments.id, tournamentId));

  revalidatePath("/tournaments");
  revalidatePath("/admin/tournaments");
  return NextResponse.json({ success: true });
}

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
import { eq, desc } from "drizzle-orm";
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

  // Fetch all game details and scores
  const allGameDetails: Array<{
    id: number;
    homeTeam: string;
    awayTeam: string;
    division: string | null;
    court: string | null;
    scheduledTime: string | null;
    status: string;
    homeScore: number;
    awayScore: number;
    lastQuarter: string | null;
  }> = [];

  for (const gid of gameIds) {
    const [g] = await db.select().from(games).where(eq(games.id, gid));
    if (g) {
      const [score] = await db
        .select()
        .from(gameScores)
        .where(eq(gameScores.gameId, gid))
        .orderBy(desc(gameScores.updatedAt))
        .limit(1);
      allGameDetails.push({
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
      });
    }
  }

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

  const body = await request.json();
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (body.name) updates.name = body.name;
  if (body.startDate) updates.startDate = body.startDate;
  if (body.endDate !== undefined) updates.endDate = body.endDate;
  if (body.location !== undefined) updates.location = body.location;
  if (body.format) updates.format = body.format;
  if (body.divisions) updates.divisions = JSON.stringify(body.divisions);
  if (body.courts) updates.courts = JSON.stringify(body.courts);
  if (body.gameLength) updates.gameLength = body.gameLength;
  if (body.breakLength) updates.breakLength = body.breakLength;
  if (body.status) updates.status = body.status;

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

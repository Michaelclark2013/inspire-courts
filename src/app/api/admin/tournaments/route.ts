import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { tournaments, tournamentTeams, tournamentGames } from "@/lib/db/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";

// GET /api/admin/tournaments — list all tournaments
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allTournaments = await db
    .select()
    .from(tournaments)
    .orderBy(desc(tournaments.createdAt));

  if (allTournaments.length === 0) return NextResponse.json([]);

  const ids = allTournaments.map((t) => t.id);

  // Batch: get all team counts in 1 query (instead of N)
  const teamCounts = await db
    .select({
      tournamentId: tournamentTeams.tournamentId,
      count: sql<number>`count(*)`,
    })
    .from(tournamentTeams)
    .where(inArray(tournamentTeams.tournamentId, ids))
    .groupBy(tournamentTeams.tournamentId);

  // Batch: get all game counts in 1 query (instead of N)
  const gameCounts = await db
    .select({
      tournamentId: tournamentGames.tournamentId,
      count: sql<number>`count(*)`,
    })
    .from(tournamentGames)
    .where(inArray(tournamentGames.tournamentId, ids))
    .groupBy(tournamentGames.tournamentId);

  const teamMap = new Map(teamCounts.map((r) => [r.tournamentId, r.count]));
  const gameMap = new Map(gameCounts.map((r) => [r.tournamentId, r.count]));

  const enriched = allTournaments.map((t) => ({
    ...t,
    divisions: t.divisions ? JSON.parse(t.divisions) : [],
    courts: t.courts ? JSON.parse(t.courts) : [],
    teamCount: teamMap.get(t.id) ?? 0,
    gameCount: gameMap.get(t.id) ?? 0,
  }));

  return NextResponse.json(enriched, {
    headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" },
  });
}

// POST /api/admin/tournaments — create a tournament
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    startDate,
    endDate,
    location,
    format,
    divisions,
    courts,
    gameLength,
    breakLength,
    entryFee,
    maxTeamsPerDivision,
    registrationDeadline,
    registrationOpen,
    description,
  } = body;

  if (!name || !startDate) {
    return NextResponse.json(
      { error: "Name and start date are required" },
      { status: 400 }
    );
  }

  const validFormats = ["single_elim", "double_elim", "round_robin", "pool_play"];
  if (format && !validFormats.includes(format)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  const userId = session.user.id ? Number(session.user.id) : null;

  const [tournament] = await db
    .insert(tournaments)
    .values({
      name,
      startDate,
      endDate: endDate || null,
      location: location || null,
      format: format || "single_elim",
      divisions: divisions ? JSON.stringify(divisions) : null,
      courts: courts ? JSON.stringify(courts) : null,
      gameLength: gameLength || 40,
      breakLength: breakLength || 10,
      entryFee: entryFee ?? null,
      maxTeamsPerDivision: maxTeamsPerDivision ?? null,
      registrationDeadline: registrationDeadline || null,
      registrationOpen: registrationOpen ?? false,
      description: description || null,
      status: "draft",
      createdBy: userId && !isNaN(userId) ? userId : null,
    })
    .returning();

  return NextResponse.json(tournament, { status: 201 });
}

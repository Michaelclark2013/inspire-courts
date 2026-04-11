import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { tournaments, tournamentTeams, tournamentGames } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

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

  // Get team counts and game counts
  const enriched = await Promise.all(
    allTournaments.map(async (t) => {
      const [teamCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tournamentTeams)
        .where(eq(tournamentTeams.tournamentId, t.id));

      const [gameCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tournamentGames)
        .where(eq(tournamentGames.tournamentId, t.id));

      return {
        ...t,
        divisions: t.divisions ? JSON.parse(t.divisions) : [],
        courts: t.courts ? JSON.parse(t.courts) : [],
        teamCount: teamCount?.count ?? 0,
        gameCount: gameCount?.count ?? 0,
      };
    })
  );

  return NextResponse.json(enriched);
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
      status: "draft",
      createdBy: userId && !isNaN(userId) ? userId : null,
    })
    .returning();

  return NextResponse.json(tournament, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentTeams,
  tournamentGames,
  tournamentRegistrations,
  games,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { generateBracket, type TeamEntry, type ScheduleConfig } from "@/lib/tournament-engine";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/tournaments/[id]/generate — generate bracket + schedule
export async function POST(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);

  // Get tournament
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId));

  if (!tournament) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (tournament.status !== "draft") {
    return NextResponse.json(
      { error: "Bracket can only be generated for draft tournaments" },
      { status: 400 }
    );
  }

  // Get teams — only include those with approved+paid registrations (or all if no registrations exist)
  const allTeams = await db
    .select()
    .from(tournamentTeams)
    .where(eq(tournamentTeams.tournamentId, tournamentId))
    .orderBy(tournamentTeams.seed);

  // Check if registrations exist for this tournament
  const regs = await db
    .select()
    .from(tournamentRegistrations)
    .where(eq(tournamentRegistrations.tournamentId, tournamentId));

  let teams = allTeams;

  // If registrations exist, filter to only approved+paid/waived teams
  if (regs.length > 0) {
    const approvedTeamNames = new Set(
      regs
        .filter(
          (r) =>
            r.status === "approved" &&
            (r.paymentStatus === "paid" || r.paymentStatus === "waived")
        )
        .map((r) => r.teamName)
    );
    teams = allTeams.filter((t) => approvedTeamNames.has(t.teamName));
  }

  if (teams.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 approved/paid teams to generate bracket" },
      { status: 400 }
    );
  }

  const courts = tournament.courts ? JSON.parse(tournament.courts) : ["Court 1"];
  const startTime = new Date(tournament.startDate + "T09:00:00").toISOString();

  const teamEntries: TeamEntry[] = teams.map((t) => ({
    id: t.teamId ?? undefined,
    teamName: t.teamName,
    seed: t.seed ?? 999,
    division: t.division ?? undefined,
    poolGroup: t.poolGroup ?? undefined,
  }));

  const config: ScheduleConfig = {
    startTime,
    courts,
    gameLength: tournament.gameLength ?? 40,
    breakLength: tournament.breakLength ?? 10,
    division: undefined,
  };

  // Generate bracket
  const slots = generateBracket(
    tournament.format as "single_elim" | "double_elim" | "round_robin" | "pool_play",
    teamEntries,
    config
  );

  // Filter out byes and create games + tournament_games
  const realGames = slots.filter((s) => !s.isBye && s.awayTeam && s.awayTeam !== "");

  for (const slot of realGames) {
    // Create the game row
    const [game] = await db
      .insert(games)
      .values({
        homeTeam: slot.homeTeam,
        awayTeam: slot.awayTeam,
        division: config.division || null,
        court: slot.court,
        eventName: tournament.name,
        scheduledTime: slot.scheduledTime,
        status: "scheduled",
      })
      .returning();

    // Create the bracket link
    await db.insert(tournamentGames).values({
      tournamentId,
      gameId: game.id,
      round: slot.round,
      bracketPosition: slot.bracketPosition,
      poolGroup: slot.poolGroup || null,
      winnerAdvancesTo: slot.winnerAdvancesTo,
      loserDropsTo: slot.loserDropsTo,
    });
  }

  // Also create placeholder games for TBD matchups (future rounds)
  const tbdGames = slots.filter(
    (s) =>
      !s.isBye &&
      !realGames.includes(s) &&
      (s.homeTeam === "TBD" || s.awayTeam === "TBD")
  );

  for (const slot of tbdGames) {
    const [game] = await db
      .insert(games)
      .values({
        homeTeam: slot.homeTeam,
        awayTeam: slot.awayTeam,
        division: config.division || null,
        court: slot.court,
        eventName: tournament.name,
        scheduledTime: slot.scheduledTime,
        status: "scheduled",
      })
      .returning();

    await db.insert(tournamentGames).values({
      tournamentId,
      gameId: game.id,
      round: slot.round,
      bracketPosition: slot.bracketPosition,
      poolGroup: slot.poolGroup || null,
      winnerAdvancesTo: slot.winnerAdvancesTo,
      loserDropsTo: slot.loserDropsTo,
    });
  }

  // Update tournament status
  await db
    .update(tournaments)
    .set({ status: "published", updatedAt: new Date().toISOString() })
    .where(eq(tournaments.id, tournamentId));

  return NextResponse.json({
    success: true,
    gamesCreated: realGames.length + tbdGames.length,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { tournamentTeams, tournaments, games, tournamentGames } from "@/lib/db/schema";
import { eq, and , inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { teamAddSchema, teamUpdateSchema, teamDeleteSchema } from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/tournaments/[id]/teams
export const GET = withTiming(
  "admin.tournament.teams.list",
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

    try {
      const teams = await db
        .select()
        .from(tournamentTeams)
        .where(eq(tournamentTeams.tournamentId, tournamentId))
        .orderBy(tournamentTeams.seed);

      return NextResponse.json(teams);
    } catch (err) {
      logger.error("Failed to fetch tournament teams", {
        tournamentId,
        error: String(err),
      });
      return apiError("Failed to fetch teams", 500);
    }
  }
);

// POST /api/admin/tournaments/[id]/teams — add a team
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

  const parsed = await parseJsonBody(request, teamAddSchema);
  if (!parsed.ok) return parsed.response;
  const { teamName, teamId, division, seed, poolGroup } = parsed.data;

  try {
    // Sanitize + cap lengths — teamName propagates into every games row
    // via the bracket generator, so unbounded input is a real risk.
    const safeTeamName = teamName.trim().slice(0, 100);
    const safeDivision = division ? division.trim().slice(0, 50) : null;
    const safePoolGroup = poolGroup ? poolGroup.trim().slice(0, 20) : null;
    const safeTeamId = teamId ?? null;
    const safeSeed = seed;

    // Get current team count for auto-seeding
    const existing = await db
      .select()
      .from(tournamentTeams)
      .where(eq(tournamentTeams.tournamentId, tournamentId));

    const [team] = await db
      .insert(tournamentTeams)
      .values({
        tournamentId,
        teamId: safeTeamId,
        teamName: safeTeamName,
        division: safeDivision,
        seed: safeSeed ?? existing.length + 1,
        poolGroup: safePoolGroup,
      })
      .returning();

    revalidatePath(`/admin/tournaments/${id}`);
    return NextResponse.json(team, { status: 201 });
  } catch (err) {
    logger.error("Failed to add tournament team", { tournamentId, error: String(err) });
    return NextResponse.json({ error: "Failed to add team" }, { status: 500 });
  }
}

// PUT /api/admin/tournaments/[id]/teams — update team seed/pool/players
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

  const parsed = await parseJsonBody(request, teamUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { teamEntryId, seed, poolGroup, eliminated, players } = parsed.data;

  try {
    // Pre-flight: return actionable errors instead of a generic 500.
    const [existing] = await db
      .select({ id: tournamentTeams.id, tournamentId: tournamentTeams.tournamentId })
      .from(tournamentTeams)
      .where(eq(tournamentTeams.id, teamEntryId))
      .limit(1);
    if (!existing) {
      return apiNotFound("Team entry not found");
    }
    if (existing.tournamentId !== tournamentId) {
      return apiError("Team entry does not belong to this tournament", 403);
    }

    const updates: Record<string, unknown> = {};
    if (seed !== undefined) updates.seed = seed;
    if (poolGroup !== undefined) {
      updates.poolGroup = poolGroup ? poolGroup.trim().slice(0, 20) : null;
    }
    if (eliminated !== undefined) updates.eliminated = eliminated;
    if (players !== undefined) {
      const sanitized = players.map((p) => ({
        name: p.name.trim().slice(0, 100),
        jersey: p.jersey ? p.jersey.trim().slice(0, 10) : "",
      }));
      updates.players = JSON.stringify(sanitized);
    }

    if (Object.keys(updates).length === 0) {
      return apiError("No fields to update", 400);
    }

    // Snapshot BEFORE the write so the audit log captures what changed.
    const [before] = await db
      .select({
        id: tournamentTeams.id,
        teamName: tournamentTeams.teamName,
        seed: tournamentTeams.seed,
        poolGroup: tournamentTeams.poolGroup,
        eliminated: tournamentTeams.eliminated,
        players: tournamentTeams.players,
      })
      .from(tournamentTeams)
      .where(eq(tournamentTeams.id, teamEntryId))
      .limit(1);

    await db
      .update(tournamentTeams)
      .set(updates)
      .where(eq(tournamentTeams.id, teamEntryId));

    // Distinguish roster edits (players field) from seed/pool shuffling
    // so the audit stream is easy to scan. Roster changes are higher-
    // consequence because they affect who actually plays.
    const rosterChanged = updates.players !== undefined;
    await recordAudit({
      session,
      request,
      action: rosterChanged ? "tournament_team.roster_updated" : "tournament_team.updated",
      entityType: "tournament_team",
      entityId: teamEntryId,
      before,
      after: updates,
    });

    revalidatePath(`/admin/tournaments/${id}`);
    return NextResponse.json({ success: true, id: teamEntryId });
  } catch (err) {
    logger.error("Failed to update tournament team", { error: String(err) });
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

// DELETE /api/admin/tournaments/[id]/teams — remove a team
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

  try {
    // Check tournament status
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId));

    if (tournament && tournament.status !== "draft") {
      return NextResponse.json(
        { error: "Cannot remove teams after bracket is generated" },
        { status: 400 }
      );
    }

    const parsed = await parseJsonBody(request, teamDeleteSchema);
    if (!parsed.ok) return parsed.response;
    const { teamEntryId } = parsed.data;

    // Fetch the team row so we can (a) audit the deletion with a
    // snapshot and (b) clean up any placeholder bracket games that
    // reference it by name.
    const [teamRow] = await db
      .select()
      .from(tournamentTeams)
      .where(
        and(
          eq(tournamentTeams.id, teamEntryId),
          eq(tournamentTeams.tournamentId, tournamentId)
        )
      )
      .limit(1);

    if (!teamRow) {
      return NextResponse.json({ error: "Team not found in this tournament" }, { status: 404 });
    }

    // Downstream cleanup: draft tournaments shouldn't have live bracket games
    // yet (the status check above enforces that), but if placeholder
    // tournament_games rows were created, reset any slots in the games table
    // where this team is referenced so the admin doesn't see stale names.
    const bracketEntries = await db
      .select({ gameId: tournamentGames.gameId })
      .from(tournamentGames)
      .where(eq(tournamentGames.tournamentId, tournamentId));

    if (bracketEntries.length > 0) {
      const bracketGameIds = bracketEntries.map((b) => b.gameId);
      // Reset the team name to "TBD" wherever it appears as home or away.
      await db
        .update(games)
        .set({ homeTeam: "TBD" })
        .where(
          and(
            inArray(games.id, bracketGameIds),
            eq(games.homeTeam, teamRow.teamName)
          )
        );
      await db
        .update(games)
        .set({ awayTeam: "TBD" })
        .where(
          and(
            inArray(games.id, bracketGameIds),
            eq(games.awayTeam, teamRow.teamName)
          )
        );
    }

    await db.delete(tournamentTeams).where(eq(tournamentTeams.id, teamEntryId));

    await recordAudit({
      session,
      request,
      action: "tournament_team.deleted",
      entityType: "tournament_team",
      entityId: teamEntryId,
      before: {
        tournamentId: teamRow.tournamentId,
        teamName: teamRow.teamName,
        division: teamRow.division,
        seed: teamRow.seed,
      },
      after: null,
    });

    revalidatePath(`/admin/tournaments/${id}`);
    return NextResponse.json({ success: true, id: teamEntryId });
  } catch (err) {
    logger.error("Failed to delete tournament team", { tournamentId, error: String(err) });
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}

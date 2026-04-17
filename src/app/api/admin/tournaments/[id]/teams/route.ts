import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { tournamentTeams, tournaments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/tournaments/[id]/teams
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);

  try {
    const teams = await db
      .select()
      .from(tournamentTeams)
      .where(eq(tournamentTeams.tournamentId, tournamentId))
      .orderBy(tournamentTeams.seed);

    return NextResponse.json(teams);
  } catch (err) {
    logger.error("Failed to fetch tournament teams", { tournamentId, error: String(err) });
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

// POST /api/admin/tournaments/[id]/teams — add a team
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);

  try {
    const body = await request.json();
    const { teamName, teamId, division, seed, poolGroup } = body;
    if (!teamName) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    // Get current team count for auto-seeding
    const existing = await db
      .select()
      .from(tournamentTeams)
      .where(eq(tournamentTeams.tournamentId, tournamentId));

    const [team] = await db
      .insert(tournamentTeams)
      .values({
        tournamentId,
        teamId: teamId || null,
        teamName,
        division: division || null,
        seed: seed ?? existing.length + 1,
        poolGroup: poolGroup || null,
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
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { teamEntryId, seed, poolGroup, eliminated, players } = body;

    if (!teamEntryId) {
      return NextResponse.json({ error: "teamEntryId required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (seed !== undefined) updates.seed = seed;
    if (poolGroup !== undefined) updates.poolGroup = poolGroup;
    if (eliminated !== undefined) updates.eliminated = eliminated;
    if (players !== undefined) {
      // players is an array of {name, jersey} — validate and sanitize
      if (!Array.isArray(players)) {
        return NextResponse.json({ error: "players must be an array" }, { status: 400 });
      }
      const sanitized = players
        .filter((p) => p && typeof p.name === "string" && p.name.trim())
        .map((p) => ({
          name: String(p.name).trim().slice(0, 100),
          jersey: p.jersey ? String(p.jersey).trim().slice(0, 10) : "",
        }));
      updates.players = JSON.stringify(sanitized);
    }

    await db
      .update(tournamentTeams)
      .set(updates)
      .where(eq(tournamentTeams.id, teamEntryId));

    revalidatePath(`/admin/tournaments/${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Failed to update tournament team", { error: String(err) });
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

// DELETE /api/admin/tournaments/[id]/teams — remove a team
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);

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

    const body = await request.json();
    const { teamEntryId } = body;

    await db.delete(tournamentTeams).where(eq(tournamentTeams.id, teamEntryId));

    revalidatePath(`/admin/tournaments/${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Failed to delete tournament team", { tournamentId, error: String(err) });
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}

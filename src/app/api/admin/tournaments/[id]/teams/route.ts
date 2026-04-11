import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { tournamentTeams, tournaments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/tournaments/[id]/teams
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);

  const teams = await db
    .select()
    .from(tournamentTeams)
    .where(eq(tournamentTeams.tournamentId, tournamentId))
    .orderBy(tournamentTeams.seed);

  return NextResponse.json(teams);
}

// POST /api/admin/tournaments/[id]/teams — add a team
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);
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

  return NextResponse.json(team, { status: 201 });
}

// PUT /api/admin/tournaments/[id]/teams — update team seed/pool
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { teamEntryId, seed, poolGroup, eliminated } = body;

  if (!teamEntryId) {
    return NextResponse.json({ error: "teamEntryId required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (seed !== undefined) updates.seed = seed;
  if (poolGroup !== undefined) updates.poolGroup = poolGroup;
  if (eliminated !== undefined) updates.eliminated = eliminated;

  await db
    .update(tournamentTeams)
    .set(updates)
    .where(eq(tournamentTeams.id, teamEntryId));

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/tournaments/[id]/teams — remove a team
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);

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

  return NextResponse.json({ success: true });
}

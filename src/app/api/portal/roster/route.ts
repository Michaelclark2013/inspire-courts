import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { players, teams } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";

// GET /api/portal/roster — get roster for coach's team
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ team: null, players: [] });
  }

  try {
    // Find the coach's team — return only display fields (not coachUserId/timestamps/etc).
    const [team] = await db
      .select({
        id: teams.id,
        name: teams.name,
        division: teams.division,
        season: teams.season,
      })
      .from(teams)
      .where(eq(teams.coachUserId, userId))
      .limit(1);

    if (!team) {
      return NextResponse.json({ team: null, players: [] });
    }

    // Get players on this team (scoped columns — no internal timestamps)
    const roster = await db
      .select({
        id: players.id,
        name: players.name,
        jerseyNumber: players.jerseyNumber,
        division: players.division,
      })
      .from(players)
      .where(eq(players.teamId, team.id));

    return NextResponse.json({ team, players: roster }, {
      headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" },
    });
  } catch (err) {
    logger.error("Failed to load roster", { error: String(err) });
    return NextResponse.json({ error: "Failed to load roster" }, { status: 500 });
  }
}

// POST /api/portal/roster — add a player (coach only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "coach") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  const [team] = await db
    .select({ id: teams.id, name: teams.name, division: teams.division })
    .from(teams)
    .where(eq(teams.coachUserId, userId))
    .limit(1);

  if (!team) {
    return NextResponse.json(
      { error: "No team assigned. Contact admin." },
      { status: 404 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name : "";
  const jerseyNumber =
    typeof body.jerseyNumber === "string" || typeof body.jerseyNumber === "number"
      ? body.jerseyNumber
      : null;
  const division = typeof body.division === "string" ? body.division : null;

  if (!name) {
    return NextResponse.json(
      { error: "Player name is required" },
      { status: 400 }
    );
  }

  try {
    const [player] = await db
      .insert(players)
      .values({
        name: String(name).trim().slice(0, 100),
        teamId: team.id,
        jerseyNumber: jerseyNumber ? String(jerseyNumber).slice(0, 10) : null,
        division: division || team.division,
      })
      .returning();

    await recordAudit({
      session,
      request,
      action: "roster.player_added",
      entityType: "player",
      entityId: player.id,
      before: null,
      after: { name: player.name, teamId: team.id, teamName: team.name, jerseyNumber: player.jerseyNumber },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (err) {
    logger.error("Failed to add player", { error: String(err) });
    return NextResponse.json({ error: "Failed to add player" }, { status: 500 });
  }
}

// DELETE /api/portal/roster — remove a player (coach only)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "coach") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }
  const { searchParams } = new URL(request.url);
  const playerId = Number(searchParams.get("id"));

  if (!Number.isInteger(playerId) || playerId <= 0) {
    return NextResponse.json({ error: "Missing or invalid player id" }, { status: 400 });
  }

  // Verify this player belongs to the coach's team
  const [team] = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.coachUserId, userId))
    .limit(1);

  if (!team) {
    return NextResponse.json({ error: "No team assigned" }, { status: 404 });
  }

  try {
    const deleted = await db
      .delete(players)
      .where(and(eq(players.id, playerId), eq(players.teamId, team.id)))
      .returning({ id: players.id, name: players.name, jerseyNumber: players.jerseyNumber });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    await recordAudit({
      session,
      request,
      action: "roster.player_removed",
      entityType: "player",
      entityId: deleted[0].id,
      before: { name: deleted[0].name, teamId: team.id, teamName: team.name, jerseyNumber: deleted[0].jerseyNumber },
      after: null,
    });

    return NextResponse.json({ success: true, id: deleted[0].id });
  } catch (err) {
    logger.error("Failed to remove player", { error: String(err) });
    return NextResponse.json({ error: "Failed to remove player" }, { status: 500 });
  }
}

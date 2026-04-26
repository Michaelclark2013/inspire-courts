import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { players, teams, waivers } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { checkEligibility } from "@/lib/eligibility";
import { findIntraTeamConflicts } from "@/lib/roster-conflicts";

// Sanity caps — coach UI prevents these but the API needs its own
// belt-and-braces in case someone POSTs raw JSON.
const NAME_MAX = 100;
const JERSEY_MAX = 10;
const GRADE_MAX = 20;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

    // Get players on this team — now includes DOB / grade / waiver /
    // photo for the eligibility chips on the coach roster page.
    const roster = await db
      .select({
        id: players.id,
        name: players.name,
        jerseyNumber: players.jerseyNumber,
        division: players.division,
        birthDate: players.birthDate,
        grade: players.grade,
        waiverOnFile: players.waiverOnFile,
        photoUrl: players.photoUrl,
      })
      .from(players)
      .where(eq(players.teamId, team.id));

    // Compute eligibility per player against the team's division so
    // the UI doesn't need to import the helper or know the cutoff
    // convention.
    const enriched = roster.map((p) => ({
      ...p,
      eligibility: checkEligibility({
        birthDate: p.birthDate,
        division: p.division || team.division,
      }),
    }));

    const conflicts = await findIntraTeamConflicts(team.id);

    return NextResponse.json(
      { team, players: enriched, conflicts },
      {
        headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" },
      }
    );
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
  const birthDateRaw = typeof body.birthDate === "string" ? body.birthDate.trim() : "";
  const grade = typeof body.grade === "string" ? body.grade.trim().slice(0, GRADE_MAX) : null;
  const photoUrl = typeof body.photoUrl === "string" ? body.photoUrl : null;

  if (!name) {
    return NextResponse.json(
      { error: "Player name is required" },
      { status: 400 }
    );
  }
  if (birthDateRaw && !ISO_DATE_RE.test(birthDateRaw)) {
    return NextResponse.json(
      { error: "Birth date must be YYYY-MM-DD" },
      { status: 400 }
    );
  }
  const birthDate = birthDateRaw || null;

  // Eligibility check — block obvious mismatches at write time. The
  // coach can still soft-warn-and-save by flipping a query flag if we
  // ever need an override; for now, an inelig add returns a 400 with
  // a clear message so the UI can surface it.
  const targetDivision = division || team.division;
  const elig = checkEligibility({ birthDate, division: targetDivision });
  if (!elig.eligible && body.acceptIneligible !== true) {
    return NextResponse.json(
      {
        error: `Not eligible for ${targetDivision}: ${elig.reason}`,
        eligibility: elig,
      },
      { status: 400 }
    );
  }

  // Pre-fill waiverOnFile if a waiver already exists under this name
  // — coach doesn't have to chase the parent again to re-sign.
  let waiverOnFile = false;
  try {
    const w = await db
      .select({ id: waivers.id })
      .from(waivers)
      .where(sql`lower(${waivers.playerName}) = ${String(name).trim().toLowerCase()}`)
      .limit(1);
    waiverOnFile = w.length > 0;
  } catch {
    /* non-fatal */
  }

  try {
    const [player] = await db
      .insert(players)
      .values({
        name: String(name).trim().slice(0, NAME_MAX),
        teamId: team.id,
        jerseyNumber: jerseyNumber ? String(jerseyNumber).slice(0, JERSEY_MAX) : null,
        division: targetDivision,
        birthDate,
        grade,
        photoUrl,
        waiverOnFile,
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

// PUT /api/portal/roster — update an existing player (coach only).
// Used to backfill DOB / grade / photo on legacy roster entries and
// for general edits.
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "coach") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const playerId = Number(body.id);
  if (!Number.isInteger(playerId) || playerId <= 0) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // Coach can only edit players on their own team.
  const [team] = await db
    .select({ id: teams.id, name: teams.name, division: teams.division })
    .from(teams)
    .where(eq(teams.coachUserId, userId))
    .limit(1);
  if (!team) {
    return NextResponse.json({ error: "No team assigned" }, { status: 404 });
  }

  const [existing] = await db
    .select()
    .from(players)
    .where(and(eq(players.id, playerId), eq(players.teamId, team.id)))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const updates: Partial<typeof existing> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim().slice(0, NAME_MAX);
  }
  if (body.jerseyNumber !== undefined) {
    updates.jerseyNumber = body.jerseyNumber == null
      ? null
      : String(body.jerseyNumber).slice(0, JERSEY_MAX);
  }
  if (typeof body.grade === "string") {
    updates.grade = body.grade.trim().slice(0, GRADE_MAX) || null;
  }
  if (body.birthDate !== undefined) {
    const bd = typeof body.birthDate === "string" ? body.birthDate.trim() : "";
    if (bd && !ISO_DATE_RE.test(bd)) {
      return NextResponse.json({ error: "birthDate must be YYYY-MM-DD" }, { status: 400 });
    }
    updates.birthDate = bd || null;
  }
  if (typeof body.photoUrl === "string") {
    updates.photoUrl = body.photoUrl || null;
  }

  // Re-check eligibility after the edit.
  const targetDivision = existing.division || team.division;
  const elig = checkEligibility({
    birthDate: updates.birthDate ?? existing.birthDate,
    division: targetDivision,
  });
  if (!elig.eligible && body.acceptIneligible !== true) {
    return NextResponse.json(
      {
        error: `Not eligible for ${targetDivision}: ${elig.reason}`,
        eligibility: elig,
      },
      { status: 400 }
    );
  }

  try {
    const [updated] = await db
      .update(players)
      .set(updates)
      .where(eq(players.id, playerId))
      .returning();

    await recordAudit({
      session,
      request,
      action: "roster.player_updated",
      entityType: "player",
      entityId: playerId,
      before: existing,
      after: updated,
    });

    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update player", { error: String(err) });
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
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

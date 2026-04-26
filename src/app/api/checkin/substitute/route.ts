import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  rosterSubstitutes,
  players,
  teams,
} from "@/lib/db/schema";
import { and, desc, eq, like, ne, or, sql } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { resolveCheckinContext, recordCheckin } from "@/lib/checkin";
import { logger } from "@/lib/logger";

// GET /api/checkin/substitute/search?q=NAME&hostTeamId=X
// Search players on OTHER teams the caller could pull as a sub. Coach
// gets eligible candidates only from their own past teams. Admin /
// staff sees all.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userId = Number(session?.user?.id);
  if (!session?.user || !role || !Number.isFinite(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim().slice(0, 80);
  const hostTeamId = Number(sp.get("hostTeamId"));
  if (!Number.isFinite(hostTeamId) || hostTeamId <= 0) {
    return NextResponse.json({ error: "hostTeamId required" }, { status: 400 });
  }

  // Coach can only pull subs from teams they coach (different team
  // from the host). Admin/staff can pull from any team.
  let candidateTeamIds: number[] | null = null;
  if (role === "coach") {
    const own = await db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.coachUserId, userId), ne(teams.id, hostTeamId)));
    candidateTeamIds = own.map((t) => t.id);
    if (candidateTeamIds.length === 0) {
      return NextResponse.json({ candidates: [] });
    }
  }

  const conditions = [ne(players.teamId, hostTeamId)];
  if (candidateTeamIds) {
    conditions.push(
      sql`${players.teamId} IN (${sql.join(candidateTeamIds.map((id) => sql`${id}`), sql`, `)})`,
    );
  }
  if (q.length >= 2) {
    const needle = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    const search = or(like(players.name, needle), like(players.jerseyNumber, needle));
    if (search) conditions.push(search);
  }

  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      jerseyNumber: players.jerseyNumber,
      division: players.division,
      birthDate: players.birthDate,
      teamId: players.teamId,
    })
    .from(players)
    .where(and(...conditions))
    .limit(25);

  // Attach the source team name for the picker.
  const teamIds = [...new Set(rows.map((r) => r.teamId).filter((id): id is number => id != null))];
  const teamRows = teamIds.length
    ? await db
        .select({ id: teams.id, name: teams.name })
        .from(teams)
        .where(sql`${teams.id} IN (${sql.join(teamIds.map((id) => sql`${id}`), sql`, `)})`)
    : [];
  const nameByTeam = new Map(teamRows.map((t) => [t.id, t.name]));

  return NextResponse.json({
    candidates: rows.map((p) => ({
      ...p,
      sourceTeamName: p.teamId ? nameByTeam.get(p.teamId) || null : null,
    })),
  });
}

// POST /api/checkin/substitute
// Body: { sourcePlayerId, hostTeamId, tournamentId?, notes? }
// Records the substitute association, then writes a check-in row
// against the source player. Coaches request (status=pending);
// admin/staff write directly approved.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userId = Number(session?.user?.id);
  if (!session?.user || !role || !Number.isFinite(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const sourcePlayerId = Number(body.sourcePlayerId);
  const hostTeamId = Number(body.hostTeamId);
  const tournamentIdRaw = Number(body.tournamentId);
  const tournamentId =
    Number.isFinite(tournamentIdRaw) && tournamentIdRaw > 0 ? tournamentIdRaw : null;
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 500) : null;
  if (!Number.isFinite(sourcePlayerId) || !Number.isFinite(hostTeamId)) {
    return NextResponse.json({ error: "sourcePlayerId + hostTeamId required" }, { status: 400 });
  }

  // Authorization: coach of the host team, or admin/staff/front_desk.
  if (role === "coach" && tournamentId) {
    const ctx = await resolveCheckinContext({
      tournamentId,
      teamId: hostTeamId,
      userId,
      role,
    });
    if (!ctx.ok) return NextResponse.json({ error: ctx.reason }, { status: 403 });
  } else if (!["admin", "staff", "front_desk"].includes(role) && !(role === "coach" && !tournamentId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Look up the source player + host team.
  const [sourcePlayer] = await db
    .select()
    .from(players)
    .where(eq(players.id, sourcePlayerId))
    .limit(1);
  if (!sourcePlayer) {
    return NextResponse.json({ error: "Source player not found" }, { status: 404 });
  }
  const [hostTeam] = await db
    .select({ id: teams.id, name: teams.name, division: teams.division })
    .from(teams)
    .where(eq(teams.id, hostTeamId))
    .limit(1);
  if (!hostTeam) {
    return NextResponse.json({ error: "Host team not found" }, { status: 404 });
  }

  const isStaff = ["admin", "staff", "front_desk"].includes(role);
  const status = isStaff ? "approved" : "pending";

  try {
    const [sub] = await db
      .insert(rosterSubstitutes)
      .values({
        sourcePlayerId,
        hostTeamId,
        tournamentId,
        addedBy: userId,
        approvedBy: isStaff ? userId : null,
        approvedAt: isStaff ? new Date().toISOString() : null,
        status,
        notes,
      })
      .returning();

    await recordAudit({
      session,
      request: req,
      action: `substitute.${status}`,
      entityType: "roster_substitute",
      entityId: sub.id,
      after: {
        sourcePlayerId,
        sourcePlayerName: sourcePlayer.name,
        hostTeamId,
        hostTeamName: hostTeam.name,
        tournamentId,
      },
    });

    // Auto-check the sub in for staff-initiated subs.
    let checkinId: number | null = null;
    if (isStaff && tournamentId) {
      const result = await recordCheckin({
        playerId: sourcePlayer.id,
        teamName: hostTeam.name,
        division: hostTeam.division,
        tournamentId,
        source: "admin",
        checkedInBy: userId,
        acceptIneligible: true,
      });
      if (result.ok) checkinId = result.checkinId;
    }

    return NextResponse.json({ substitute: sub, checkinId, status });
  } catch (err) {
    logger.error("substitute insert failed", { err: String(err) });
    return NextResponse.json({ error: "Failed to file substitute" }, { status: 500 });
  }
}

// PATCH /api/checkin/substitute  — admin approve/reject pending sub
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || !role || !["admin", "staff", "front_desk"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = Number(body.id);
  const decisionRaw = String(body.decision || "");
  const decision = decisionRaw === "approve" ? "approved" : decisionRaw === "reject" ? "rejected" : null;
  if (!Number.isFinite(id) || !decision) {
    return NextResponse.json({ error: "id + decision required" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(rosterSubstitutes)
    .where(eq(rosterSubstitutes.id, id))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "pending") {
    return NextResponse.json({ error: `Already ${existing.status}` }, { status: 400 });
  }

  const userId = Number(session.user.id);
  const [updated] = await db
    .update(rosterSubstitutes)
    .set({
      status: decision,
      approvedBy: userId,
      approvedAt: new Date().toISOString(),
    })
    .where(eq(rosterSubstitutes.id, id))
    .returning();

  await recordAudit({
    session,
    request: req,
    action: `substitute.${decision}`,
    entityType: "roster_substitute",
    entityId: id,
  });

  return NextResponse.json(updated);
}


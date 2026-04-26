import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { players, teams } from "@/lib/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

// GET /api/portal/roster/import — list candidate prior teams the coach
// has roster from (any team where they're coachUserId, excluding the
// current team), with player counts.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "coach") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) return NextResponse.json({ teams: [] });

  const [currentTeam] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.coachUserId, userId))
    .limit(1);

  // Coach may have past teams (different season/division). Find them
  // and count players per team.
  const allMyTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      division: teams.division,
      season: teams.season,
    })
    .from(teams)
    .where(
      and(
        eq(teams.coachUserId, userId),
        currentTeam ? ne(teams.id, currentTeam.id) : sql`1=1`,
      ),
    );

  const result = [];
  for (const t of allMyTeams) {
    const counts = await db
      .select({ c: sql<number>`count(*)` })
      .from(players)
      .where(eq(players.teamId, t.id));
    result.push({
      ...t,
      playerCount: Number(counts[0]?.c) || 0,
    });
  }
  return NextResponse.json({ teams: result.filter((t) => t.playerCount > 0) });
}

// POST /api/portal/roster/import — clone players from `fromTeamId`
// into the coach's current team. Skips players already on the
// current team (case-insensitive name match).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "coach") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) return NextResponse.json({ error: "Bad session" }, { status: 400 });

  let body: { fromTeamId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const fromTeamId = Number(body.fromTeamId);
  if (!Number.isFinite(fromTeamId) || fromTeamId <= 0) {
    return NextResponse.json({ error: "fromTeamId required" }, { status: 400 });
  }

  // Verify both teams belong to this coach.
  const [currentTeam] = await db
    .select()
    .from(teams)
    .where(eq(teams.coachUserId, userId))
    .limit(1);
  if (!currentTeam) {
    return NextResponse.json({ error: "No current team" }, { status: 404 });
  }
  const [fromTeam] = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, fromTeamId), eq(teams.coachUserId, userId)))
    .limit(1);
  if (!fromTeam) {
    return NextResponse.json({ error: "Source team not found / not yours" }, { status: 404 });
  }

  const sourceRoster = await db
    .select()
    .from(players)
    .where(eq(players.teamId, fromTeamId));
  if (sourceRoster.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0 });
  }

  const existing = await db
    .select({ name: players.name })
    .from(players)
    .where(eq(players.teamId, currentTeam.id));
  const existingLower = new Set(existing.map((p) => p.name.toLowerCase()));

  let imported = 0;
  let skipped = 0;
  for (const p of sourceRoster) {
    if (existingLower.has(p.name.toLowerCase())) {
      skipped++;
      continue;
    }
    try {
      await db.insert(players).values({
        name: p.name,
        teamId: currentTeam.id,
        jerseyNumber: p.jerseyNumber,
        division: currentTeam.division,
        birthDate: p.birthDate,
        grade: p.grade,
        photoUrl: p.photoUrl,
        waiverOnFile: p.waiverOnFile,
        memberSince: p.memberSince,
        parentUserId: p.parentUserId,
      });
      imported++;
    } catch (err) {
      logger.warn("import player failed", { err: String(err), name: p.name });
    }
  }

  await recordAudit({
    session,
    request: req,
    action: "roster.imported",
    entityType: "team",
    entityId: currentTeam.id,
    after: { fromTeamId, imported, skipped },
  });

  return NextResponse.json({ imported, skipped });
}

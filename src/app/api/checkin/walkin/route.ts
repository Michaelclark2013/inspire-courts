import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { players, teams } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { recordCheckin } from "@/lib/checkin";
import { recordAudit } from "@/lib/audit";

// POST /api/checkin/walkin
// Admin/front-desk shortcut: parent shows up with a kid not on the
// roster. Creates a player row + a check-in row in one call so staff
// don't have to bounce between admin pages.
//
// Body: { teamName, playerName, jerseyNumber?, birthDate?, grade?,
//   tournamentId?, division?, acceptIneligible? }
export async function POST(req: NextRequest) {
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

  const teamName = (typeof body.teamName === "string" ? body.teamName : "").trim();
  const playerName = (typeof body.playerName === "string" ? body.playerName : "").trim();
  if (!teamName || !playerName) {
    return NextResponse.json({ error: "teamName + playerName required" }, { status: 400 });
  }
  const jerseyNumber =
    typeof body.jerseyNumber === "string" || typeof body.jerseyNumber === "number"
      ? String(body.jerseyNumber).slice(0, 10)
      : null;
  const birthDate = typeof body.birthDate === "string" ? body.birthDate.trim() : null;
  const grade = typeof body.grade === "string" ? body.grade.trim() : null;
  const division = typeof body.division === "string" ? body.division : null;
  const tournamentIdRaw = Number(body.tournamentId);
  const tournamentId = Number.isFinite(tournamentIdRaw) && tournamentIdRaw > 0 ? tournamentIdRaw : null;

  // Find or create the team row by name. Walk-in flow uses team name
  // as the source of truth — coach assignment can happen later.
  let [team] = await db
    .select({ id: teams.id, name: teams.name, division: teams.division })
    .from(teams)
    .where(sql`lower(${teams.name}) = ${teamName.toLowerCase()}`)
    .limit(1);
  if (!team) {
    const [created] = await db
      .insert(teams)
      .values({ name: teamName, division: division || null })
      .returning();
    team = created;
  }

  // Insert player.
  const [player] = await db
    .insert(players)
    .values({
      name: playerName.slice(0, 100),
      teamId: team.id,
      jerseyNumber,
      division: division || team.division,
      birthDate: birthDate || null,
      grade,
    })
    .returning();

  await recordAudit({
    session,
    request: req,
    action: "roster.walkin_added",
    entityType: "player",
    entityId: player.id,
    after: { name: player.name, teamId: team.id, teamName: team.name, jerseyNumber, birthDate, grade },
  });

  // Now check them in.
  const userId = Number(session.user.id);
  const result = await recordCheckin({
    playerId: player.id,
    teamName: team.name,
    division: division || team.division,
    tournamentId,
    source: "admin",
    checkedInBy: Number.isFinite(userId) ? userId : null,
    acceptIneligible: body.acceptIneligible === true,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ...result, player, team },
      { status: result.code === "ineligible" ? 409 : 400 },
    );
  }
  return NextResponse.json({ ...result, player, team });
}

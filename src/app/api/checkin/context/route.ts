import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { players, teams, checkins, games, tournamentRegistrations } from "@/lib/db/schema";
import { and, eq, gte, lte, sql, inArray } from "drizzle-orm";
import { resolveCheckinContext, getGymGeo } from "@/lib/checkin";
import { checkEligibility } from "@/lib/eligibility";

// GET /api/checkin/context?t=TOURNAMENTID&team=TEAMID
//
// Returns everything the /checkin page needs to render: tournament,
// team, full roster with eligibility + waiver status + already-checked-in
// flag, the next game (for wayfinding), and the gym geofence config.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userId = Number(session?.user?.id);
  if (!session?.user || !role || !Number.isFinite(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const tournamentId = Number(sp.get("t"));
  const teamIdParam = Number(sp.get("team"));
  const teamNameParam = sp.get("teamName") || undefined;
  if (!Number.isFinite(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: "tournament id required" }, { status: 400 });
  }

  const ctx = await resolveCheckinContext({
    tournamentId,
    teamId: Number.isFinite(teamIdParam) && teamIdParam > 0 ? teamIdParam : null,
    teamName: teamNameParam,
    userId,
    role,
  });
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.reason }, { status: 403 });
  }

  // Roster scoped to this team. Parents see only their own children;
  // coaches + staff see the full roster.
  let rosterRows = await db
    .select({
      id: players.id,
      name: players.name,
      jerseyNumber: players.jerseyNumber,
      division: players.division,
      birthDate: players.birthDate,
      grade: players.grade,
      waiverOnFile: players.waiverOnFile,
      photoUrl: players.photoUrl,
      parentUserId: players.parentUserId,
    })
    .from(players)
    .where(eq(players.teamId, ctx.team.id));
  if (role === "parent") {
    rosterRows = rosterRows.filter((p) => p.parentUserId === userId);
  }

  // Already checked in for this tournament — we mark green chips per
  // player so the bulk action knows what to skip.
  const playerIds = rosterRows.map((p) => p.id).filter((id) => id != null);
  let alreadyCheckedIn = new Set<number>();
  if (playerIds.length > 0) {
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const rows = await db
      .select({ playerId: checkins.playerId })
      .from(checkins)
      .where(
        and(
          eq(checkins.tournamentId, tournamentId),
          inArray(checkins.playerId, playerIds),
          gte(checkins.timestamp, since),
        ),
      );
    alreadyCheckedIn = new Set(rows.map((r) => r.playerId).filter((id): id is number => id != null));
  }

  const enrichedRoster = rosterRows.map((p) => ({
    ...p,
    eligibility: checkEligibility({
      birthDate: p.birthDate,
      division: p.division || ctx.team.division,
      seasonStart: ctx.tournament.startDate,
    }),
    checkedIn: p.id != null && alreadyCheckedIn.has(p.id),
  }));

  // Wayfinding — find the team's next game today.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  let nextGame: {
    id: number;
    scheduledTime: string | null;
    court: string | null;
    opponent: string;
    homeOrAway: "home" | "away";
  } | null = null;
  try {
    const gameRows = await db
      .select({
        id: games.id,
        homeTeam: games.homeTeam,
        awayTeam: games.awayTeam,
        court: games.court,
        scheduledTime: games.scheduledTime,
      })
      .from(games)
      .where(
        and(
          gte(games.scheduledTime, startOfDay.toISOString()),
          lte(games.scheduledTime, endOfDay.toISOString()),
        ),
      );
    const teamLower = ctx.team.name.toLowerCase();
    const ours = gameRows
      .filter(
        (g) =>
          (g.homeTeam || "").toLowerCase() === teamLower ||
          (g.awayTeam || "").toLowerCase() === teamLower,
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledTime || "").getTime() -
          new Date(b.scheduledTime || "").getTime(),
      );
    const nowMs = Date.now();
    const upcoming = ours.find(
      (g) => new Date(g.scheduledTime || "").getTime() >= nowMs,
    );
    const candidate = upcoming || ours[0] || null;
    if (candidate) {
      const isHome = (candidate.homeTeam || "").toLowerCase() === teamLower;
      nextGame = {
        id: candidate.id,
        scheduledTime: candidate.scheduledTime,
        court: candidate.court,
        opponent: isHome ? candidate.awayTeam : candidate.homeTeam,
        homeOrAway: isHome ? "home" : "away",
      };
    }
  } catch {
    /* games not critical for the page to render */
  }

  // Roster-lock context for coaches.
  const [reg] = await db
    .select({
      rosterSubmitted: tournamentRegistrations.rosterSubmitted,
      paymentStatus: tournamentRegistrations.paymentStatus,
    })
    .from(tournamentRegistrations)
    .where(
      and(
        eq(tournamentRegistrations.tournamentId, tournamentId),
        sql`lower(${tournamentRegistrations.teamName}) = ${ctx.team.name.toLowerCase()}`,
      ),
    )
    .limit(1);

  return NextResponse.json({
    tournament: ctx.tournament,
    team: ctx.team,
    roster: enrichedRoster,
    nextGame,
    geofence: getGymGeo(),
    registration: reg ?? null,
    role,
  });
}

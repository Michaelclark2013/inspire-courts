import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { players, teams, checkins, tournaments, games, gameScores } from "@/lib/db/schema";
import { and, desc, eq, sql, or } from "drizzle-orm";

// GET /api/portal/players/[id]/history
// Returns the player's record + every check-in across every event,
// grouped by tournament. Plus totals.
//
// Authorization:
//   - parent: only if parentUserId === session.user.id
//   - coach:  only if the player is on coach's team
//   - admin/staff/front_desk: always
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userId = Number(session?.user?.id);
  if (!session?.user || !role || !Number.isFinite(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const playerId = Number(id);
  if (!Number.isFinite(playerId) || playerId <= 0) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Authorization
  let allowed = false;
  if (role === "admin" || role === "staff" || role === "front_desk") {
    allowed = true;
  } else if (role === "parent") {
    allowed = player.parentUserId === userId;
  } else if (role === "coach") {
    const [own] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.id, player.teamId ?? 0), eq(teams.coachUserId, userId)))
      .limit(1);
    allowed = !!own;
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Team
  let team: { id: number; name: string; division: string | null } | null = null;
  if (player.teamId) {
    const [row] = await db
      .select({ id: teams.id, name: teams.name, division: teams.division })
      .from(teams)
      .where(eq(teams.id, player.teamId))
      .limit(1);
    team = row || null;
  }

  // Check-in history — join with tournaments for the event name.
  const history = await db
    .select({
      id: checkins.id,
      timestamp: checkins.timestamp,
      teamName: checkins.teamName,
      division: checkins.division,
      type: checkins.type,
      source: checkins.source,
      isLate: checkins.isLate,
      tournamentId: checkins.tournamentId,
      tournamentName: tournaments.name,
      tournamentStart: tournaments.startDate,
    })
    .from(checkins)
    .leftJoin(tournaments, eq(tournaments.id, checkins.tournamentId))
    .where(eq(checkins.playerId, playerId))
    .orderBy(desc(checkins.timestamp))
    .limit(200);

  // Group by tournament for the UI.
  const byTournament = new Map<
    string,
    {
      tournamentId: number | null;
      name: string;
      startDate: string | null;
      events: typeof history;
    }
  >();
  for (const h of history) {
    const key = h.tournamentId ? `t:${h.tournamentId}` : `name:${h.teamName}:${h.timestamp.slice(0, 10)}`;
    if (!byTournament.has(key)) {
      byTournament.set(key, {
        tournamentId: h.tournamentId,
        name: h.tournamentName || `${h.teamName} (no tournament)`,
        startDate: h.tournamentStart || null,
        events: [],
      });
    }
    byTournament.get(key)!.events.push(h);
  }

  // Totals
  const distinctTournaments = new Set(
    history.map((h) => h.tournamentId).filter((id): id is number => id != null),
  ).size;
  const total = history.filter((h) => h.type === "checkin").length;

  // Win/Loss summary — derive from games (status=final) + latest
  // gameScores per game, scoped to this team's name on either side.
  let wins = 0;
  let losses = 0;
  if (team) {
    try {
      const teamLower = team.name.toLowerCase();
      const finalGames = await db
        .select({
          id: games.id,
          homeTeam: games.homeTeam,
          awayTeam: games.awayTeam,
        })
        .from(games)
        .where(
          and(
            eq(games.status, "final"),
            or(
              sql`lower(${games.homeTeam}) = ${teamLower}`,
              sql`lower(${games.awayTeam}) = ${teamLower}`,
            ),
          ),
        );
      const gameIds = finalGames.map((g) => g.id);
      if (gameIds.length > 0) {
        const scoreRows = await db
          .select({
            gameId: gameScores.gameId,
            homeScore: gameScores.homeScore,
            awayScore: gameScores.awayScore,
            updatedAt: gameScores.updatedAt,
          })
          .from(gameScores)
          .where(sql`${gameScores.gameId} IN (${sql.join(gameIds.map((id) => sql`${id}`), sql`, `)})`);
        // Take the latest row per game (final score).
        const latest = new Map<number, { homeScore: number; awayScore: number }>();
        for (const s of scoreRows) {
          const prev = latest.get(s.gameId);
          if (!prev) {
            latest.set(s.gameId, s);
          }
        }
        for (const g of finalGames) {
          const s = latest.get(g.id);
          if (!s) continue;
          const isHome = (g.homeTeam || "").toLowerCase() === teamLower;
          const myScore = isHome ? s.homeScore : s.awayScore;
          const oppScore = isHome ? s.awayScore : s.homeScore;
          if (myScore > oppScore) wins++;
          else if (oppScore > myScore) losses++;
        }
      }
    } catch {
      /* skip stats on any schema/query mismatch */
    }
  }

  return NextResponse.json({
    player: {
      id: player.id,
      name: player.name,
      jerseyNumber: player.jerseyNumber,
      division: player.division,
      birthDate: player.birthDate,
      grade: player.grade,
      memberSince: player.memberSince,
      photoUrl: player.photoUrl,
      waiverOnFile: player.waiverOnFile,
    },
    team,
    totals: {
      tournaments: distinctTournaments,
      checkins: total,
      wins,
      losses,
    },
    history: Array.from(byTournament.values()).sort((a, b) => {
      const ad = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bd = b.startDate ? new Date(b.startDate).getTime() : 0;
      return bd - ad;
    }),
  });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournaments, tournamentRegistrations, checkins } from "@/lib/db/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/checkin-progress[?tournamentId=N]
// For the given tournament (defaults to the active one), returns
// every registered team with check-in progress: number of player
// check-ins, whether roster/waivers/payment are in order, and a
// single "complete" boolean. Powers the admin check-in dashboard.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !["admin", "front_desk", "staff"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const requested = Number(searchParams.get("tournamentId"));

    // Resolve target tournament — requested id, else first active, else
    // the most recent.
    let tournament: { id: number; name: string; status: string; startDate: string } | null = null;
    if (Number.isInteger(requested) && requested > 0) {
      const [t] = await db
        .select({ id: tournaments.id, name: tournaments.name, status: tournaments.status, startDate: tournaments.startDate })
        .from(tournaments)
        .where(eq(tournaments.id, requested))
        .limit(1);
      tournament = t ?? null;
    }
    if (!tournament) {
      const [t] = await db
        .select({ id: tournaments.id, name: tournaments.name, status: tournaments.status, startDate: tournaments.startDate })
        .from(tournaments)
        .where(eq(tournaments.status, "active"))
        .orderBy(asc(tournaments.startDate))
        .limit(1);
      tournament = t ?? null;
    }
    if (!tournament) {
      return NextResponse.json({ tournament: null, teams: [], totals: null });
    }

    const regs = await db
      .select()
      .from(tournamentRegistrations)
      .where(eq(tournamentRegistrations.tournamentId, tournament.id))
      .orderBy(asc(tournamentRegistrations.teamName));

    const teamNames = regs.map((r) => r.teamName);
    let counts: Record<string, number> = {};
    let latestByTeam: Record<string, string> = {};

    if (teamNames.length > 0) {
      const rows = await db
        .select({
          teamName: checkins.teamName,
          count: sql<number>`count(*)`,
          latest: sql<string>`max(${checkins.timestamp})`,
        })
        .from(checkins)
        .where(
          and(
            eq(checkins.type, "checkin"),
            inArray(checkins.teamName, teamNames)
          )
        )
        .groupBy(checkins.teamName);
      counts = Object.fromEntries(rows.map((r) => [r.teamName, Number(r.count) || 0]));
      latestByTeam = Object.fromEntries(rows.map((r) => [r.teamName, r.latest]));
    }

    const teams = regs.map((r) => {
      const checkedIn = counts[r.teamName] || 0;
      const target = r.playerCount ?? 0;
      const percent = target > 0 ? Math.round(Math.min(100, (checkedIn / target) * 100)) : 0;
      // "Complete" heuristic: roster submitted + waivers signed +
      // payment not pending + at least 5 players checked in (or
      // target met if smaller).
      const minPlayers = target > 0 ? target : 5;
      const complete =
        r.rosterSubmitted === true &&
        r.waiversSigned === true &&
        r.paymentStatus !== "pending" &&
        checkedIn >= minPlayers;
      return {
        id: r.id,
        teamName: r.teamName,
        division: r.division,
        coachName: r.coachName,
        coachEmail: r.coachEmail,
        coachPhone: r.coachPhone,
        playerCount: target,
        checkedIn,
        percent,
        rosterSubmitted: r.rosterSubmitted === true,
        waiversSigned: r.waiversSigned === true,
        paymentStatus: r.paymentStatus,
        registrationStatus: r.status,
        latestCheckinAt: latestByTeam[r.teamName] || null,
        complete,
      };
    });

    const totals = {
      teams: teams.length,
      complete: teams.filter((t) => t.complete).length,
      partial: teams.filter((t) => !t.complete && t.checkedIn > 0).length,
      none: teams.filter((t) => t.checkedIn === 0).length,
      rosterSubmitted: teams.filter((t) => t.rosterSubmitted).length,
      waiversSigned: teams.filter((t) => t.waiversSigned).length,
      paymentsPending: teams.filter((t) => t.paymentStatus === "pending").length,
    };

    return NextResponse.json(
      { tournament, teams, totals },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("checkin-progress failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  tournamentRegistrations,
  tournaments,
  checkins,
  users,
} from "@/lib/db/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/portal/coach/checkin-status
// Returns the caller's active tournament registrations with check-in
// progress for each — so the coach portal can surface exactly what's
// missing (roster / waivers / payment / player count) without them
// having to call the front desk.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find the coach's active tournament regs by email.
    const email = session.user.email.toLowerCase();

    // Active + upcoming tournaments only.
    const activeTournaments = await db
      .select({ id: tournaments.id, name: tournaments.name, status: tournaments.status, startDate: tournaments.startDate })
      .from(tournaments)
      .where(inArray(tournaments.status, ["active", "published"]))
      .orderBy(asc(tournaments.startDate));
    if (activeTournaments.length === 0) {
      return NextResponse.json({ registrations: [] });
    }

    const regs = await db
      .select()
      .from(tournamentRegistrations)
      .where(
        and(
          eq(tournamentRegistrations.coachEmail, email),
          inArray(
            tournamentRegistrations.tournamentId,
            activeTournaments.map((t) => t.id)
          )
        )
      );
    if (regs.length === 0) {
      return NextResponse.json({ registrations: [] });
    }

    // Pull check-in counts per team name.
    const teamNames = regs.map((r) => r.teamName);
    const rows = await db
      .select({
        teamName: checkins.teamName,
        count: sql<number>`count(*)`,
      })
      .from(checkins)
      .where(
        and(
          eq(checkins.type, "checkin"),
          inArray(checkins.teamName, teamNames)
        )
      )
      .groupBy(checkins.teamName);
    const counts = Object.fromEntries(rows.map((r) => [r.teamName, Number(r.count) || 0]));

    // Enrich with progress.
    const tournamentByRegId = Object.fromEntries(activeTournaments.map((t) => [t.id, t]));
    const registrations = regs.map((r) => {
      const checkedIn = counts[r.teamName] || 0;
      const target = r.playerCount || 5;
      const gaps: string[] = [];
      if (!r.rosterSubmitted) gaps.push("Submit roster");
      if (!r.waiversSigned) gaps.push("Collect all waivers");
      if (r.paymentStatus === "pending") gaps.push("Complete payment");
      if (checkedIn < target) gaps.push(`${target - checkedIn} more player${(target - checkedIn) === 1 ? "" : "s"} to check in`);
      const complete = gaps.length === 0;
      return {
        id: r.id,
        teamName: r.teamName,
        division: r.division,
        tournament: tournamentByRegId[r.tournamentId] ?? null,
        playerCount: target,
        checkedIn,
        percent: target > 0 ? Math.min(100, Math.round((checkedIn / target) * 100)) : 0,
        rosterSubmitted: r.rosterSubmitted === true,
        waiversSigned: r.waiversSigned === true,
        paymentStatus: r.paymentStatus,
        gaps,
        complete,
      };
    });

    return NextResponse.json(
      { registrations },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("coach checkin-status failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

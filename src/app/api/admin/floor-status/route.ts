import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeEntries, users, games, gymEvents } from "@/lib/db/schema";
import { and, asc, eq, gte, isNull, lte } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/floor-status
// Two live operational views for the front desk:
//   1) Who's currently clocked in (open time_entries)
//   2) What each court looks like right now — live game, next scheduled
//      game, or open.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const nowIso = new Date().toISOString();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [onClock, liveGames, upcomingGames, todayEvents] = await Promise.all([
      db
        .select({
          userId: users.id,
          name: users.name,
          role: users.role,
          photoUrl: users.photoUrl,
          clockInAt: timeEntries.clockInAt,
          source: timeEntries.source,
        })
        .from(timeEntries)
        .leftJoin(users, eq(users.id, timeEntries.userId))
        .where(isNull(timeEntries.clockOutAt))
        .orderBy(asc(timeEntries.clockInAt)),
      db
        .select()
        .from(games)
        .where(eq(games.status, "live"))
        .orderBy(asc(games.court)),
      db
        .select()
        .from(games)
        .where(
          and(
            eq(games.status, "scheduled"),
            gte(games.scheduledTime, nowIso),
            lte(games.scheduledTime, endOfDay.toISOString())
          )
        )
        .orderBy(asc(games.scheduledTime)),
      db
        .select()
        .from(gymEvents)
        .where(
          and(
            lte(gymEvents.startAt, endOfDay.toISOString()),
            gte(gymEvents.endAt, nowIso)
          )
        )
        .orderBy(asc(gymEvents.startAt)),
    ]);

    // Build per-court status. Courts 1..7 is the facility layout
    // (CR: hardcoded in tournaments/manage). Front-end can pass the
    // list explicitly later.
    //
    // Index the source arrays into Maps once instead of running three
    // .find() scans per court — for 7 courts that's 21 linear scans
    // shrinking to constant-time lookups.
    const COURTS = ["Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6", "Court 7"];
    const liveByCourt = new Map(liveGames.map((g) => [g.court, g] as const));
    const nextByCourt = new Map(upcomingGames.map((g) => [g.court, g] as const));
    const blockerByCourt = new Map<string, (typeof todayEvents)[number]>();
    for (const e of todayEvents) {
      if (e.location) blockerByCourt.set(e.location.toLowerCase(), e);
    }
    const courtStatus = COURTS.map((court) => {
      const live = liveByCourt.get(court);
      if (live) {
        return {
          court,
          status: "live" as const,
          label: `${live.homeTeam} vs ${live.awayTeam}`,
          gameId: live.id,
        };
      }
      const next = nextByCourt.get(court);
      if (next) {
        return {
          court,
          status: "scheduled" as const,
          label: `${next.homeTeam} vs ${next.awayTeam}`,
          at: next.scheduledTime,
          gameId: next.id,
        };
      }
      const blocker = blockerByCourt.get(court.toLowerCase());
      if (blocker) {
        return {
          court,
          status: "blocked" as const,
          label: blocker.title,
          category: blocker.category,
        };
      }
      return { court, status: "open" as const, label: "Open" };
    });

    return NextResponse.json(
      { onClock, courtStatus, asOf: nowIso },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("floor-status failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

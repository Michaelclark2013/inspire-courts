import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  resourceBookings,
  users,
  tournaments,
  games,
  resources,
} from "@/lib/db/schema";
import { and, eq, gte, sql, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/stats
// Tiny rolling-window stats for the admin ticker. Cheap queries —
// intended for 30-second polling.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const nowIso = new Date().toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString();

    const [
      liveRentals,
      new7d,
      revenue30,
      activeTournaments,
      liveGames,
      fleetSize,
    ] = await Promise.all([
      db
        .select({ n: sql<number>`count(*)` })
        .from(resourceBookings)
        .where(eq(resourceBookings.status, "in_use")),
      db
        .select({ n: sql<number>`count(*)` })
        .from(users)
        .where(gte(users.createdAt, sevenDaysAgo)),
      db
        .select({
          n: sql<number>`coalesce(sum(${resourceBookings.totalCents}), 0)`,
        })
        .from(resourceBookings)
        .where(
          and(
            eq(resourceBookings.status, "returned"),
            gte(resourceBookings.checkinAt, thirtyDaysAgo)
          )
        ),
      db
        .select({ n: sql<number>`count(*)` })
        .from(tournaments)
        .where(eq(tournaments.status, "active")),
      db
        .select({ n: sql<number>`count(*)` })
        .from(games)
        .where(eq(games.status, "live")),
      db
        .select({ n: sql<number>`count(*)` })
        .from(resources)
        .where(eq(resources.active, true)),
    ]);

    return NextResponse.json(
      {
        liveRentals: Number(liveRentals[0]?.n || 0),
        newUsers7d: Number(new7d[0]?.n || 0),
        revenue30Cents: Number(revenue30[0]?.n || 0),
        activeTournaments: Number(activeTournaments[0]?.n || 0),
        liveGames: Number(liveGames[0]?.n || 0),
        fleetSize: Number(fleetSize[0]?.n || 0),
        asOf: nowIso,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("admin stats failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  resourceBookings,
  resources,
  gymEvents,
  shifts,
  games,
} from "@/lib/db/schema";
import { and, asc, eq, gte, lte, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { canAccess } from "@/lib/permissions";

// GET /api/admin/today — compact "what's happening right now" roll-up
// for the admin dashboard. Rentals out/returning today, gym events
// today, live shifts, games today.
export async function GET() {
  const session = await getServerSession(authOptions);
  // Today rollup powers the /admin overview dashboard. Staff +
  // front_desk can both see overview, so use canAccess instead of
  // hardcoded admin.
  if (!session?.user?.role || !canAccess(session.user.role, "overview")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const startIso = startOfDay.toISOString();
    const endIso = endOfDay.toISOString();
    const nowIso = now.toISOString();

    const [rentalsOut, returnsToday, eventsToday, liveShifts, gamesToday] = await Promise.all([
      db
        .select({
          id: resourceBookings.id,
          renterName: resourceBookings.renterName,
          endAt: resourceBookings.endAt,
          vehicleName: resources.name,
        })
        .from(resourceBookings)
        .leftJoin(resources, eq(resources.id, resourceBookings.resourceId))
        .where(
          and(
            eq(resourceBookings.status, "in_use"),
            lte(resourceBookings.startAt, nowIso),
            gte(resourceBookings.endAt, nowIso)
          )
        )
        .orderBy(asc(resourceBookings.endAt)),
      db
        .select({
          id: resourceBookings.id,
          renterName: resourceBookings.renterName,
          endAt: resourceBookings.endAt,
          status: resourceBookings.status,
          vehicleName: resources.name,
        })
        .from(resourceBookings)
        .leftJoin(resources, eq(resources.id, resourceBookings.resourceId))
        .where(
          and(
            inArray(resourceBookings.status, ["in_use", "confirmed"]),
            gte(resourceBookings.endAt, startIso),
            lte(resourceBookings.endAt, endIso)
          )
        )
        .orderBy(asc(resourceBookings.endAt)),
      db
        .select()
        .from(gymEvents)
        .where(
          and(
            lte(gymEvents.startAt, endIso),
            gte(gymEvents.endAt, startIso)
          )
        )
        .orderBy(asc(gymEvents.startAt)),
      db
        .select()
        .from(shifts)
        .where(
          and(
            lte(shifts.startAt, nowIso),
            gte(shifts.endAt, nowIso)
          )
        )
        .orderBy(asc(shifts.startAt)),
      db
        .select()
        .from(games)
        .where(
          and(
            gte(games.scheduledTime, startIso),
            lte(games.scheduledTime, endIso)
          )
        )
        .orderBy(asc(games.scheduledTime)),
    ]);

    return NextResponse.json(
      {
        rentalsOut,
        returnsToday,
        eventsToday,
        liveShifts,
        gamesToday,
        asOf: nowIso,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("today summary failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

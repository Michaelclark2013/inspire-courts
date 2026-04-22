import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  tournaments,
  tournamentRegistrations,
  games,
  checkins,
  waivers,
  announcements,
  auditLog,
} from "@/lib/db/schema";
import { and, eq, gte, sql, inArray } from "drizzle-orm";
import { canAccess } from "@/lib/permissions";
import { logger } from "@/lib/logger";
import { withTiming } from "@/lib/timing";

// GET /api/admin/metrics — compact multi-entity counts for admin dashboards.
//
// Previously dashboards mounted by firing 5+ parallel fetches (users,
// approvals, tournaments, checkins, registrations) and aggregating client
// side. This route collapses the common counts into one server-side
// Promise.all so a dashboard can mount in a single round-trip.
//
// admin-only — some counts (pending approvals, audit activity) leak
// operational info.
export const GET = withTiming("admin.metrics", async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const nowIso = new Date().toISOString();
    // Today = midnight UTC; tight enough for "check-ins today" without
    // needing timezone-aware bucketing.
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      [{ userCount }],
      [{ pendingApprovals }],
      [{ tournamentCount }],
      [{ publishedActiveTournaments }],
      [{ registrationCount }],
      [{ pendingRegistrations }],
      [{ approvedRegistrations }],
      [{ gamesCount }],
      [{ liveGames }],
      [{ checkinsToday }],
      [{ waiverCount }],
      [{ activeAnnouncements }],
      [{ auditLast24h }],
    ] = await Promise.all([
      db.select({ userCount: sql<number>`count(*)` }).from(users),
      db
        .select({ pendingApprovals: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.approved, false)),
      db.select({ tournamentCount: sql<number>`count(*)` }).from(tournaments),
      db
        .select({ publishedActiveTournaments: sql<number>`count(*)` })
        .from(tournaments)
        .where(inArray(tournaments.status, ["published", "active"])),
      db.select({ registrationCount: sql<number>`count(*)` }).from(tournamentRegistrations),
      db
        .select({ pendingRegistrations: sql<number>`count(*)` })
        .from(tournamentRegistrations)
        .where(eq(tournamentRegistrations.status, "pending")),
      db
        .select({ approvedRegistrations: sql<number>`count(*)` })
        .from(tournamentRegistrations)
        .where(eq(tournamentRegistrations.status, "approved")),
      db.select({ gamesCount: sql<number>`count(*)` }).from(games),
      db.select({ liveGames: sql<number>`count(*)` }).from(games).where(eq(games.status, "live")),
      db
        .select({ checkinsToday: sql<number>`count(*)` })
        .from(checkins)
        .where(and(eq(checkins.type, "checkin"), gte(checkins.timestamp, todayIso))),
      db.select({ waiverCount: sql<number>`count(*)` }).from(waivers),
      db
        .select({ activeAnnouncements: sql<number>`count(*)` })
        .from(announcements),
      db
        .select({ auditLast24h: sql<number>`count(*)` })
        .from(auditLog)
        .where(gte(auditLog.createdAt, oneDayAgo)),
    ]);

    return NextResponse.json(
      {
        asOf: nowIso,
        users: { total: Number(userCount) || 0, pendingApprovals: Number(pendingApprovals) || 0 },
        tournaments: {
          total: Number(tournamentCount) || 0,
          publishedOrActive: Number(publishedActiveTournaments) || 0,
        },
        registrations: {
          total: Number(registrationCount) || 0,
          pending: Number(pendingRegistrations) || 0,
          approved: Number(approvedRegistrations) || 0,
        },
        games: { total: Number(gamesCount) || 0, live: Number(liveGames) || 0 },
        checkinsToday: Number(checkinsToday) || 0,
        waivers: Number(waiverCount) || 0,
        announcements: Number(activeAnnouncements) || 0,
        auditActivity24h: Number(auditLast24h) || 0,
      },
      { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" } }
    );
  } catch (err) {
    logger.error("metrics fetch failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
});

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  timeEntries,
  users,
  staffProfiles,
  shifts,
  shiftAssignments,
  resources,
  resourceBookings,
  tournaments,
  tournamentRegistrations,
  payPeriods,
  staffCertifications,
  maintenanceTickets,
  members,
  waivers} from "@/lib/db/schema";
import { and, desc, eq, gt, gte, isNotNull, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { canAccess } from "@/lib/permissions";
import { withTiming } from "@/lib/timing";
import { ytdGrossByUser, form1099Status, FORM_1099_WARNING_CENTS } from "@/lib/payroll";

// GET /api/admin/ops-summary — single round-trip for the overhauled
// admin dashboard. Collapses what used to be 8 parallel fetches into
// one server-side fan-out so the dashboard mounts in one request.
//
// Shape is intentionally flat — the UI reads specific keys without
// having to reshape anything client-side.
export const GET = withTiming("admin.ops_summary", async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nowIso = new Date().toISOString();
  const in48hIso = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const next30dIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  try {
    const [
      onTheClock,
      pendingApprovals,
      upcomingShifts48h,
      understaffedShifts,
      nextTournaments,
      pendingRegistrations,
      activeResources,
      inUseBookings,
      upcomingBookings,
      openPayPeriods,
      staffActiveCount,
      expiringCerts,
      urgentTickets,
      activeMembers,
      trialMembers,
      pastDueMembers,
      renewingThisWeek,
      visitsToday,
      expiringWaivers,
    ] = await Promise.all([
      // Live clock-ins with the person's name for a glanceable list
      db
        .select({
          id: timeEntries.id,
          userId: timeEntries.userId,
          name: users.name,
          role: timeEntries.role,
          clockInAt: timeEntries.clockInAt,
          source: timeEntries.source,
        })
        .from(timeEntries)
        .leftJoin(users, eq(users.id, timeEntries.userId))
        .where(isNull(timeEntries.clockOutAt))
        .orderBy(desc(timeEntries.clockInAt))
        .limit(20),

      // Pending time-entry approvals (count)
      db
        .select({ c: sql<number>`count(*)` })
        .from(timeEntries)
        .where(eq(timeEntries.status, "pending")),

      // Upcoming shifts in next 48h for quick scan
      db
        .select({
          id: shifts.id,
          title: shifts.title,
          role: shifts.role,
          startAt: shifts.startAt,
          endAt: shifts.endAt,
          requiredHeadcount: shifts.requiredHeadcount,
          status: shifts.status,
        })
        .from(shifts)
        .where(
          and(
            gte(shifts.startAt, nowIso),
            lt(shifts.startAt, in48hIso),
            eq(shifts.status, "published")
          )
        )
        .orderBy(shifts.startAt)
        .limit(20),

      // Understaffed shifts — published, in next 30d, with fewer
      // filled assignments than required. Two-step: fetch, then compare.
      // (Can be optimized with a groupBy join later if needed.)
      (async () => {
        const upcoming = await db
          .select()
          .from(shifts)
          .where(
            and(
              eq(shifts.status, "published"),
              gte(shifts.startAt, nowIso),
              lt(shifts.startAt, next30dIso)
            )
          );
        if (upcoming.length === 0) return [] as Array<typeof upcoming[number] & { filled: number }>;
        const counts = await db
          .select({
            shiftId: shiftAssignments.shiftId,
            c: sql<number>`count(*)`,
          })
          .from(shiftAssignments)
          .where(
            and(
              sql`${shiftAssignments.status} in ('assigned','confirmed','completed')`
            )
          )
          .groupBy(shiftAssignments.shiftId);
        const byId = new Map(counts.map((r) => [r.shiftId, Number(r.c) || 0]));
        return upcoming
          .map((s) => ({ ...s, filled: byId.get(s.id) ?? 0 }))
          .filter((s) => s.filled < s.requiredHeadcount)
          .sort((a, b) => a.startAt.localeCompare(b.startAt))
          .slice(0, 10);
      })(),

      // Next upcoming tournaments
      db
        .select({
          id: tournaments.id,
          name: tournaments.name,
          startDate: tournaments.startDate,
          status: tournaments.status,
        })
        .from(tournaments)
        .where(
          and(
            gte(tournaments.startDate, todayIso.slice(0, 10)),
            sql`${tournaments.status} in ('published','active')`
          )
        )
        .orderBy(tournaments.startDate)
        .limit(5),

      // Pending tournament registrations (needs approval)
      db
        .select({ c: sql<number>`count(*)` })
        .from(tournamentRegistrations)
        .where(eq(tournamentRegistrations.status, "pending")),

      // Active resources (just totals, not rows)
      db
        .select({ c: sql<number>`count(*)` })
        .from(resources)
        .where(eq(resources.active, true)),

      // Resources currently rented — overlap `now`
      db
        .select({
          id: resourceBookings.id,
          resourceId: resourceBookings.resourceId,
          resourceName: resources.name,
          renterName: resourceBookings.renterName,
          endAt: resourceBookings.endAt,
          status: resourceBookings.status,
          odometerStart: resourceBookings.odometerStart,
        })
        .from(resourceBookings)
        .leftJoin(resources, eq(resources.id, resourceBookings.resourceId))
        .where(
          and(
            lt(resourceBookings.startAt, nowIso),
            gt(resourceBookings.endAt, nowIso),
            sql`${resourceBookings.status} in ('confirmed','in_use','tentative')`
          )
        )
        .orderBy(resourceBookings.endAt)
        .limit(10),

      // Next 5 upcoming bookings (haven't started yet)
      db
        .select({
          id: resourceBookings.id,
          resourceId: resourceBookings.resourceId,
          resourceName: resources.name,
          renterName: resourceBookings.renterName,
          startAt: resourceBookings.startAt,
          endAt: resourceBookings.endAt,
          status: resourceBookings.status,
        })
        .from(resourceBookings)
        .leftJoin(resources, eq(resources.id, resourceBookings.resourceId))
        .where(
          and(
            gt(resourceBookings.startAt, nowIso),
            sql`${resourceBookings.status} in ('tentative','confirmed')`
          )
        )
        .orderBy(resourceBookings.startAt)
        .limit(5),

      // Open pay periods
      db.select().from(payPeriods).where(eq(payPeriods.status, "open")).orderBy(desc(payPeriods.startsAt)),

      db
        .select({ c: sql<number>`count(*)` })
        .from(staffProfiles)
        .where(eq(staffProfiles.status, "active")),

      // Certifications expiring in the next 30 days
      db
        .select({
          id: staffCertifications.id,
          userId: staffCertifications.userId,
          name: users.name,
          type: staffCertifications.type,
          expiresAt: staffCertifications.expiresAt,
        })
        .from(staffCertifications)
        .leftJoin(users, eq(users.id, staffCertifications.userId))
        .where(
          and(
            isNotNull(staffCertifications.expiresAt),
            lt(
              staffCertifications.expiresAt,
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            )
          )
        )
        .orderBy(staffCertifications.expiresAt)
        .limit(10),

      // Active maintenance tickets — urgent + high only for the dash alert
      db
        .select({
          id: maintenanceTickets.id,
          title: maintenanceTickets.title,
          location: maintenanceTickets.location,
          priority: maintenanceTickets.priority,
          status: maintenanceTickets.status,
          createdAt: maintenanceTickets.createdAt,
        })
        .from(maintenanceTickets)
        .where(
          and(
            or(
              eq(maintenanceTickets.status, "open"),
              eq(maintenanceTickets.status, "in_progress"),
              eq(maintenanceTickets.status, "waiting_vendor")
            )!,
            or(
              eq(maintenanceTickets.priority, "urgent"),
              eq(maintenanceTickets.priority, "high")
            )!
          )
        )
        .orderBy(
          sql`CASE ${maintenanceTickets.priority} WHEN 'urgent' THEN 0 ELSE 1 END`,
          desc(maintenanceTickets.createdAt)
        )
        .limit(10),

      // Member KPIs
      db.select({ c: sql<number>`count(*)` }).from(members).where(eq(members.status, "active")),
      db.select({ c: sql<number>`count(*)` }).from(members).where(eq(members.status, "trial")),
      db.select({ c: sql<number>`count(*)` }).from(members).where(eq(members.status, "past_due")),
      db
        .select({ c: sql<number>`count(*)` })
        .from(members)
        .where(
          and(
            gte(members.nextRenewalAt, nowIso),
            lt(members.nextRenewalAt, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
          )
        ),
      db
        .select({ c: sql<number>`count(*)` })
        .from(sql`(SELECT DISTINCT member_id FROM member_visits WHERE visited_at >= ${todayIso})`),

      // Waivers expiring in next 30 days (or already expired within
      // the last 30d — lapsed but still showing). Helps front desk
      // re-prompt at next check-in.
      db
        .select({
          id: waivers.id,
          playerName: waivers.playerName,
          expiresAt: waivers.expiresAt,
          waiverType: waivers.waiverType,
        })
        .from(waivers)
        .where(
          and(
            isNotNull(waivers.expiresAt),
            lt(
              waivers.expiresAt,
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            ),
            gte(
              waivers.expiresAt,
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            )
          )
        )
        .orderBy(waivers.expiresAt)
        .limit(10),
    ]);

    // 1099 threshold watch — any active non-W2/non-volunteer worker
    // whose YTD is ≥ $500 shows up in the dashboard alert widget.
    const ytd = await ytdGrossByUser();
    const rosterRows = await db
      .select({
        userId: staffProfiles.userId,
        name: users.name,
        classification: staffProfiles.employmentClassification,
      })
      .from(staffProfiles)
      .leftJoin(users, eq(users.id, staffProfiles.userId))
      .where(eq(staffProfiles.status, "active"));

    const thresholdAlerts = rosterRows
      .map((r) => ({
        userId: r.userId,
        name: r.name,
        classification: r.classification,
        ytdCents: ytd.get(r.userId) ?? 0,
        status: form1099Status(r.classification, ytd.get(r.userId) ?? 0),
      }))
      .filter((r) => r.status === "approaching" || r.status === "over")
      .sort((a, b) => b.ytdCents - a.ytdCents)
      .slice(0, 10);

    return NextResponse.json(
      {
        asOf: nowIso,
        staff: {
          activeCount: Number(staffActiveCount[0]?.c) || 0,
          onTheClock,
          pendingApprovals: Number(pendingApprovals[0]?.c) || 0,
          thresholdAlerts,
          thresholdWarnAtCents: FORM_1099_WARNING_CENTS,
          expiringCerts,
        },
        maintenance: {
          activeCount: urgentTickets.length,
          urgentTickets,
        },
        members: {
          activeCount: Number(activeMembers[0]?.c) || 0,
          trialCount: Number(trialMembers[0]?.c) || 0,
          pastDueCount: Number(pastDueMembers[0]?.c) || 0,
          renewingThisWeek: Number(renewingThisWeek[0]?.c) || 0,
          visitsTodayUniqueMembers: Number(visitsToday[0]?.c) || 0,
        },
        compliance: {
          expiringWaivers,
        },
        shifts: {
          upcoming48h: upcomingShifts48h,
          understaffed: understaffedShifts,
        },
        tournaments: {
          next: nextTournaments,
          pendingRegistrations: Number(pendingRegistrations[0]?.c) || 0,
        },
        resources: {
          activeCount: Number(activeResources[0]?.c) || 0,
          inUse: inUseBookings,
          upcoming: upcomingBookings,
        },
        payroll: {
          openPeriods: openPayPeriods,
        },
      },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } }
    );
  } catch (err) {
    logger.error("Failed to build ops summary", { error: String(err) });
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
});

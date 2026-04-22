import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeEntries, users, staffProfiles, payPeriods } from "@/lib/db/schema";
import { and, desc, eq, gt, gte, isNotNull, isNull, lt, ne, sql, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import {
  timeEntryPatchSchema,
  timeEntryCreateSchema,
} from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";
import { computeEntryCents } from "@/lib/payroll";

// GET /api/admin/timeclock — default view combines:
//   - `onTheClock`: everyone with an open entry right now
//   - `pending`: closed entries awaiting approval
//   - `recent`: last N approved entries for quick scan
//
// ?status=open|pending|approved|rejected filters to a single bucket
// ?userId=123 narrows to one worker
// ?since=ISO / ?until=ISO date-range
// ?tournamentId=123 filter by tournament
// ?page= / ?limit= standard pagination (max 200)
export const GET = withTiming("admin.timeclock.list", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }

  const sp = request.nextUrl.searchParams;
  const statusFilter = sp.get("status");
  const userIdRaw = sp.get("userId");
  const since = sp.get("since");
  const until = sp.get("until");
  const tournamentIdRaw = sp.get("tournamentId");

  const filters: SQL[] = [];
  if (statusFilter && ["open", "pending", "approved", "rejected"].includes(statusFilter)) {
    filters.push(
      eq(
        timeEntries.status,
        statusFilter as "open" | "pending" | "approved" | "rejected"
      )
    );
  }
  const userId = Number(userIdRaw);
  if (userIdRaw && Number.isInteger(userId) && userId > 0) {
    filters.push(eq(timeEntries.userId, userId));
  }
  if (since) filters.push(gte(timeEntries.clockInAt, since));
  if (until) filters.push(lt(timeEntries.clockInAt, until));
  const tournamentId = Number(tournamentIdRaw);
  if (tournamentIdRaw && Number.isInteger(tournamentId) && tournamentId > 0) {
    filters.push(eq(timeEntries.tournamentId, tournamentId));
  }

  const MAX_LIMIT = 200;
  const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
  const rawLimit = Math.floor(Number(sp.get("limit")) || 50);
  const limit = Math.min(Math.max(1, rawLimit || 50), MAX_LIMIT);
  const offset = (page - 1) * limit;

  try {
    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // When no explicit status filter is set, return the three-bucket
    // view so the default /admin/timeclock page shows "on the clock"
    // up-top without a second request.
    if (!statusFilter && !userIdRaw && !since && !until && !tournamentIdRaw) {
      const [onTheClock, pending, recent] = await Promise.all([
        db
          .select({
            id: timeEntries.id,
            userId: timeEntries.userId,
            name: users.name,
            role: timeEntries.role,
            clockInAt: timeEntries.clockInAt,
            source: timeEntries.source,
            tournamentId: timeEntries.tournamentId,
            payRateCents: timeEntries.payRateCents,
            payRateType: timeEntries.payRateType,
          })
          .from(timeEntries)
          .leftJoin(users, eq(users.id, timeEntries.userId))
          .where(isNull(timeEntries.clockOutAt))
          .orderBy(desc(timeEntries.clockInAt))
          .limit(100),
        db
          .select({
            id: timeEntries.id,
            userId: timeEntries.userId,
            name: users.name,
            role: timeEntries.role,
            clockInAt: timeEntries.clockInAt,
            clockOutAt: timeEntries.clockOutAt,
            breakMinutes: timeEntries.breakMinutes,
            payRateCents: timeEntries.payRateCents,
            payRateType: timeEntries.payRateType,
            bonusCents: timeEntries.bonusCents,
            source: timeEntries.source,
            tournamentId: timeEntries.tournamentId,
          })
          .from(timeEntries)
          .leftJoin(users, eq(users.id, timeEntries.userId))
          .where(and(eq(timeEntries.status, "pending"), isNotNull(timeEntries.clockOutAt)))
          .orderBy(desc(timeEntries.clockOutAt))
          .limit(100),
        db
          .select({
            id: timeEntries.id,
            userId: timeEntries.userId,
            name: users.name,
            role: timeEntries.role,
            clockInAt: timeEntries.clockInAt,
            clockOutAt: timeEntries.clockOutAt,
            breakMinutes: timeEntries.breakMinutes,
            payRateCents: timeEntries.payRateCents,
            payRateType: timeEntries.payRateType,
            bonusCents: timeEntries.bonusCents,
            status: timeEntries.status,
          })
          .from(timeEntries)
          .leftJoin(users, eq(users.id, timeEntries.userId))
          .where(eq(timeEntries.status, "approved"))
          .orderBy(desc(timeEntries.clockOutAt))
          .limit(25),
      ]);

      return NextResponse.json(
        {
          onTheClock,
          pending: pending.map((e) => ({
            ...e,
            computedCents: computeEntryCents({
              clockInAt: e.clockInAt,
              clockOutAt: e.clockOutAt,
              breakMinutes: e.breakMinutes ?? 0,
              payRateCents: e.payRateCents ?? 0,
              payRateType: e.payRateType,
              bonusCents: e.bonusCents ?? 0,
            }),
          })),
          recent,
        },
        { headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=10" } }
      );
    }

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id: timeEntries.id,
          userId: timeEntries.userId,
          name: users.name,
          role: timeEntries.role,
          clockInAt: timeEntries.clockInAt,
          clockOutAt: timeEntries.clockOutAt,
          breakMinutes: timeEntries.breakMinutes,
          payRateCents: timeEntries.payRateCents,
          payRateType: timeEntries.payRateType,
          bonusCents: timeEntries.bonusCents,
          source: timeEntries.source,
          status: timeEntries.status,
          tournamentId: timeEntries.tournamentId,
          notes: timeEntries.notes,
        })
        .from(timeEntries)
        .leftJoin(users, eq(users.id, timeEntries.userId))
        .where(whereClause)
        .orderBy(desc(timeEntries.clockInAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: sql<number>`count(*)` }).from(timeEntries).where(whereClause),
    ]);

    const enriched = rows.map((e) => ({
      ...e,
      computedCents: computeEntryCents({
        clockInAt: e.clockInAt,
        clockOutAt: e.clockOutAt,
        breakMinutes: e.breakMinutes ?? 0,
        payRateCents: e.payRateCents ?? 0,
        payRateType: e.payRateType,
        bonusCents: e.bonusCents ?? 0,
      }),
    }));

    return NextResponse.json({
      data: enriched,
      total: Number(total) || 0,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil((Number(total) || 0) / limit)),
    });
  } catch (err) {
    logger.error("Failed to fetch timeclock", { error: String(err) });
    return apiError("Failed to fetch timeclock", 500);
  }
});

// POST /api/admin/timeclock — admin-keyed retroactive entry (tablet
// was offline, manual adjustment, etc.). Defaults status to "pending"
// so the entry still flows through the approval step.
export const POST = withTiming("admin.timeclock.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, timeEntryCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    // Snapshot pay rate from staff_profiles if the admin didn't
    // override — consistent with the self-clock-in behavior.
    let payRateCents = body.payRateCents;
    let payRateType = body.payRateType;
    if (payRateCents == null || payRateType == null) {
      const [profile] = await db
        .select({
          payRateCents: staffProfiles.payRateCents,
          payRateType: staffProfiles.payRateType,
        })
        .from(staffProfiles)
        .where(eq(staffProfiles.userId, body.userId))
        .limit(1);
      payRateCents = payRateCents ?? profile?.payRateCents ?? 0;
      payRateType = payRateType ?? profile?.payRateType ?? "hourly";
    }

    const [created] = await db
      .insert(timeEntries)
      .values({
        userId: body.userId,
        clockInAt: body.clockInAt,
        clockOutAt: body.clockOutAt ?? null,
        source: "manual",
        breakMinutes: body.breakMinutes ?? 0,
        role: body.role ?? null,
        tournamentId: body.tournamentId ?? null,
        payRateCents,
        payRateType,
        bonusCents: body.bonusCents ?? 0,
        notes: body.notes ?? null,
        status: body.clockOutAt ? "pending" : "open",
      })
      .returning();

    await recordAudit({
      session,
      request,
      action: "time_entry.manual_created",
      entityType: "time_entry",
      entityId: created.id,
      before: null,
      after: {
        targetUserId: body.userId,
        clockInAt: created.clockInAt,
        clockOutAt: created.clockOutAt,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create time entry", { error: String(err) });
    return apiError("Failed to create time entry", 500);
  }
});

// PATCH /api/admin/timeclock — edit / approve / reject a single entry.
// This is the canonical approval endpoint.
export const PATCH = withTiming("admin.timeclock.patch", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return apiError("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, timeEntryPatchSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    const [before] = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, body.entryId))
      .limit(1);
    if (!before) return apiNotFound("Time entry not found");

    // Reject edits that fall inside a locked or paid pay period.
    // Locking is the gesture that freezes the payroll math; if an
    // admin needs to amend an entry in a locked period, they must
    // unlock it first (not currently exposed — deliberate friction).
    const [lockingPeriod] = await db
      .select({ id: payPeriods.id, label: payPeriods.label, status: payPeriods.status })
      .from(payPeriods)
      .where(
        and(
          ne(payPeriods.status, "open"),
          lt(payPeriods.startsAt, before.clockInAt),
          gt(payPeriods.endsAt, before.clockInAt)
        )
      )
      .limit(1);
    if (lockingPeriod) {
      return apiError(
        `Entry falls inside locked pay period "${lockingPeriod.label}" — cannot edit.`,
        409,
        { extras: { payPeriodId: lockingPeriod.id, status: lockingPeriod.status } }
      );
    }

    const updates: Record<string, unknown> = {};
    if (body.clockInAt !== undefined) updates.clockInAt = body.clockInAt;
    if (body.clockOutAt !== undefined) updates.clockOutAt = body.clockOutAt;
    if (body.breakMinutes !== undefined) updates.breakMinutes = body.breakMinutes;
    if (body.role !== undefined) updates.role = body.role;
    if (body.tournamentId !== undefined) updates.tournamentId = body.tournamentId;
    if (body.payRateCents !== undefined) updates.payRateCents = body.payRateCents;
    if (body.payRateType !== undefined) updates.payRateType = body.payRateType;
    if (body.bonusCents !== undefined) updates.bonusCents = body.bonusCents;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === "approved" || body.status === "rejected") {
        const approverId = session.user.id ? Number(session.user.id) : null;
        updates.approvedBy = approverId && !isNaN(approverId) ? approverId : null;
        updates.approvedAt = new Date().toISOString();
      }
    }

    const [updated] = await db
      .update(timeEntries)
      .set(updates)
      .where(eq(timeEntries.id, body.entryId))
      .returning();

    // Status transitions get their own audit action; plain edits are
    // tagged as "time_entry.edited" so payroll disputes have a clean
    // event stream to replay.
    const statusChanged =
      body.status !== undefined && body.status !== before.status;
    const rateChanged =
      (body.payRateCents !== undefined && body.payRateCents !== before.payRateCents) ||
      (body.payRateType !== undefined && body.payRateType !== before.payRateType) ||
      (body.bonusCents !== undefined && body.bonusCents !== before.bonusCents);

    await recordAudit({
      session,
      request,
      action: statusChanged
        ? `time_entry.${body.status}`
        : rateChanged
          ? "time_entry.rate_edited"
          : "time_entry.edited",
      entityType: "time_entry",
      entityId: body.entryId,
      before: {
        clockInAt: before.clockInAt,
        clockOutAt: before.clockOutAt,
        breakMinutes: before.breakMinutes,
        payRateCents: before.payRateCents,
        payRateType: before.payRateType,
        bonusCents: before.bonusCents,
        status: before.status,
      },
      after: updates,
    });

    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to patch time entry", { error: String(err) });
    return apiError("Failed to update time entry", 500);
  }
});

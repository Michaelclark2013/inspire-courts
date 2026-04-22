import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { staffProfiles, timeEntries } from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { clockInSchema, clockOutSchema } from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

// GET /api/portal/clock — returns the caller's currently-open time
// entry (if any) so the clock-in UI can render "You clocked in at 9:14am"
// without a second round trip.
export const GET = withTiming("portal.clock.status", async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401);
  }
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return apiError("Unauthorized", 401);
  }

  try {
    const [profile] = await db
      .select({
        payRateCents: staffProfiles.payRateCents,
        payRateType: staffProfiles.payRateType,
        status: staffProfiles.status,
        roleTags: staffProfiles.roleTags,
      })
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, userId))
      .limit(1);

    const [openEntry] = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.clockOutAt)))
      .orderBy(desc(timeEntries.clockInAt))
      .limit(1);

    return NextResponse.json(
      {
        onStaff: !!profile,
        staffStatus: profile?.status ?? null,
        roleTags: profile?.roleTags ?? "",
        openEntry: openEntry ?? null,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("Failed to fetch portal clock status", { error: String(err) });
    return apiError("Failed to fetch clock status", 500);
  }
});

// POST /api/portal/clock — clock in. Body validated by clockInSchema.
// Snapshots the rate from staff_profiles so a subsequent rate change
// doesn't retroactively re-price this shift.
export const POST = withTiming("portal.clock.in", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401);
  }
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return apiError("Unauthorized", 401);
  }

  // Aggressive rate-limit to blunt any replay-attack / double-clock.
  const ip = getClientIp(request);
  if (isRateLimited(`portal-clock-in:${userId}:${ip}`, 10, 60_000)) {
    return apiError("Too many clock attempts. Slow down.", 429, {
      headers: { "Retry-After": "60" },
    });
  }

  const parsed = await parseJsonBody(request, clockInSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    // Caller must have a staff profile AND be active. Any user without
    // one — parents, coaches, players — is silently rejected.
    const [profile] = await db
      .select({
        payRateCents: staffProfiles.payRateCents,
        payRateType: staffProfiles.payRateType,
        status: staffProfiles.status,
      })
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, userId))
      .limit(1);
    if (!profile) return apiNotFound("You are not on the staff roster");
    if (profile.status !== "active") {
      return apiError(
        `Your staff status is "${profile.status}". Clock-in disabled.`,
        403
      );
    }

    // Refuse to open a second entry if one is already open — the
    // worker needs to clock out first. Prevents phantom double-pay.
    const [existingOpen] = await db
      .select({ id: timeEntries.id, clockInAt: timeEntries.clockInAt })
      .from(timeEntries)
      .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.clockOutAt)))
      .limit(1);
    if (existingOpen) {
      return apiError("You are already clocked in — clock out first.", 409, {
        extras: { openEntryId: existingOpen.id, since: existingOpen.clockInAt },
      });
    }

    const nowIso = new Date().toISOString();
    const [created] = await db
      .insert(timeEntries)
      .values({
        userId,
        clockInAt: nowIso,
        source: body.source ?? "mobile",
        clockInLat: body.lat ?? null,
        clockInLng: body.lng ?? null,
        role: body.role ?? null,
        tournamentId: body.tournamentId ?? null,
        payRateCents: profile.payRateCents,
        payRateType: profile.payRateType,
        status: "open",
      })
      .returning();

    await recordAudit({
      session,
      request,
      action: "time_entry.clock_in",
      entityType: "time_entry",
      entityId: created.id,
      before: null,
      after: {
        clockInAt: created.clockInAt,
        source: created.source,
        lat: created.clockInLat,
        lng: created.clockInLng,
        role: created.role,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to clock in", { error: String(err) });
    return apiError("Failed to clock in", 500);
  }
});

// PATCH /api/portal/clock — clock out. Closes the caller's open entry.
// Entry moves from `open` → `pending` so an admin can approve.
export const PATCH = withTiming("portal.clock.out", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401);
  }
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return apiError("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, clockOutSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    const [openEntry] = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.clockOutAt)))
      .orderBy(desc(timeEntries.clockInAt))
      .limit(1);
    if (!openEntry) {
      return apiError("No open time entry — you are not clocked in.", 409);
    }

    const nowIso = new Date().toISOString();
    const [updated] = await db
      .update(timeEntries)
      .set({
        clockOutAt: nowIso,
        clockOutLat: body.lat ?? null,
        clockOutLng: body.lng ?? null,
        breakMinutes: body.breakMinutes ?? 0,
        status: "pending",
      })
      .where(eq(timeEntries.id, openEntry.id))
      .returning();

    await recordAudit({
      session,
      request,
      action: "time_entry.clock_out",
      entityType: "time_entry",
      entityId: openEntry.id,
      before: { clockInAt: openEntry.clockInAt, status: openEntry.status },
      after: {
        clockOutAt: updated.clockOutAt,
        breakMinutes: updated.breakMinutes,
        status: updated.status,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to clock out", { error: String(err) });
    return apiError("Failed to clock out", 500);
  }
});

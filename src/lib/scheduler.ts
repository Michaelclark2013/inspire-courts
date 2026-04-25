import { db } from "@/lib/db";
import {
  shifts,
  shiftAssignments,
  staffAvailability,
  staffProfiles,
  timeOffRequests,
  users,
} from "@/lib/db/schema";
import { and, eq, gte, lte, ne, or, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ── AI Scheduler ──────────────────────────────────────────────────────
// Greedy constraint solver. For each open shift slot, score every
// active staff member on:
//   1. Role tag match (hard requirement) — staff_profiles.roleTags
//      LIKE %shift.role%. No match = skip.
//   2. Availability window covers the shift — staff_availability rows
//      for the right weekday with start/end overlapping the shift.
//   3. No conflicting assignment in the same time window.
//   4. No approved time-off overlapping the shift.
//   5. Pay rate (lower = preferred when tied).
//   6. Recent assignments (avoid burning out the same 3 people).
//
// Output: per shift, top N candidates with a transparent reason
// breakdown so the admin sees WHY each pick. Greedy — pick top of
// ranked list, mark assigned in-memory, move to next shift.

export type SuggestedAssignment = {
  shiftId: number;
  shiftTitle: string;
  shiftStartAt: string;
  shiftEndAt: string;
  shiftRole: string | null;
  needed: number;
  candidates: Array<{
    userId: number;
    name: string;
    score: number;
    reasons: string[];
  }>;
};

function timeWithinWindow(targetHHMM: string, startHHMM: string, endHHMM: string): boolean {
  return targetHHMM >= startHHMM && targetHHMM <= endHHMM;
}

/**
 * Compute suggested fillings for all `draft` and `published` shifts in
 * the given window that are short on assignees. Does NOT mutate — just
 * returns suggestions for the admin to apply.
 */
export async function suggestAssignments(opts: {
  fromIso: string;
  toIso: string;
  perShiftCandidates?: number;
}): Promise<SuggestedAssignment[]> {
  const N = opts.perShiftCandidates || 3;

  const openShifts = await db
    .select()
    .from(shifts)
    .where(
      and(
        gte(shifts.startAt, opts.fromIso),
        lte(shifts.startAt, opts.toIso),
        ne(shifts.status, "cancelled")
      )
    );

  if (openShifts.length === 0) return [];

  // Pull every active staff once.
  const staff = await db
    .select({
      userId: staffProfiles.userId,
      roleTags: staffProfiles.roleTags,
      payRateCents: staffProfiles.payRateCents,
      status: staffProfiles.status,
      name: users.name,
    })
    .from(staffProfiles)
    .leftJoin(users, eq(staffProfiles.userId, users.id))
    .where(eq(staffProfiles.status, "active"));

  const staffIds = staff.map((s) => s.userId);
  if (staffIds.length === 0) return [];

  const availability = await db
    .select()
    .from(staffAvailability);
  const availabilityByUser = new Map<number, typeof availability>();
  for (const a of availability) {
    if (!availabilityByUser.has(a.userId)) availabilityByUser.set(a.userId, []);
    availabilityByUser.get(a.userId)!.push(a);
  }

  // Approved time-off in the window.
  const timeOff = await db
    .select()
    .from(timeOffRequests)
    .where(
      and(
        eq(timeOffRequests.status, "approved"),
        or(
          and(gte(timeOffRequests.startDate, opts.fromIso), lte(timeOffRequests.startDate, opts.toIso)),
          and(gte(timeOffRequests.endDate, opts.fromIso), lte(timeOffRequests.endDate, opts.toIso))
        )
      )
    );
  const timeOffByUser = new Map<number, typeof timeOff>();
  for (const t of timeOff) {
    if (!timeOffByUser.has(t.userId)) timeOffByUser.set(t.userId, []);
    timeOffByUser.get(t.userId)!.push(t);
  }

  // Existing assignments in the window — we treat these as occupied
  // time and avoid double-booking.
  const existing = await db
    .select({
      userId: shiftAssignments.userId,
      shiftId: shiftAssignments.shiftId,
      startAt: shifts.startAt,
      endAt: shifts.endAt,
    })
    .from(shiftAssignments)
    .leftJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
    .where(
      and(
        ne(shiftAssignments.status, "declined"),
        ne(shiftAssignments.status, "no_show"),
        gte(shifts.startAt, opts.fromIso),
        lte(shifts.startAt, opts.toIso)
      )
    );
  const assignmentsByUser = new Map<number, typeof existing>();
  for (const e of existing) {
    if (!assignmentsByUser.has(e.userId)) assignmentsByUser.set(e.userId, []);
    assignmentsByUser.get(e.userId)!.push(e);
  }

  // Track in-memory "we plan to assign" so greedy doesn't double-book.
  const plannedByUser = new Map<number, Array<{ shiftId: number; startAt: string; endAt: string }>>();

  const out: SuggestedAssignment[] = [];

  // Sort shifts by start time so earliest-first.
  openShifts.sort((a, b) => a.startAt.localeCompare(b.startAt));

  for (const shift of openShifts) {
    // How many already assigned?
    const assignedCount = existing.filter((e) => e.shiftId === shift.id).length;
    const needed = Math.max(0, shift.requiredHeadcount - assignedCount);
    if (needed === 0) continue;

    const shiftStart = new Date(shift.startAt);
    const weekday = shiftStart.getDay();
    const startHHMM = shift.startAt.slice(11, 16);
    const endHHMM = shift.endAt.slice(11, 16);

    const candidates: Array<{ userId: number; name: string; score: number; reasons: string[] }> = [];

    for (const s of staff) {
      let score = 0;
      const reasons: string[] = [];

      // Role match — hard requirement if shift.role is set.
      if (shift.role) {
        const tags = (s.roleTags || "").toLowerCase();
        if (!tags.includes(shift.role.toLowerCase())) continue;
        score += 30;
        reasons.push(`Tagged for ${shift.role}`);
      } else {
        score += 5;
      }

      // Availability check.
      const avail = availabilityByUser.get(s.userId) || [];
      const matchingAvail = avail.find(
        (a) =>
          a.weekday === weekday &&
          timeWithinWindow(startHHMM, a.startTime, a.endTime) &&
          timeWithinWindow(endHHMM, a.startTime, a.endTime)
      );
      if (matchingAvail) {
        score += 25;
        reasons.push(`Available ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][weekday]} ${matchingAvail.startTime}-${matchingAvail.endTime}`);
      } else if (avail.length === 0) {
        // No availability set — neutral, not a hard skip.
        score += 5;
      } else {
        // Has availability set, just doesn't cover this shift — soft skip.
        score -= 10;
      }

      // Time-off conflict — hard skip.
      const offs = timeOffByUser.get(s.userId) || [];
      const conflict = offs.find(
        (t) => shift.startAt >= t.startDate && shift.startAt <= t.endDate
      );
      if (conflict) continue;

      // Existing assignment overlap — hard skip if literally overlapping.
      const planned = plannedByUser.get(s.userId) || [];
      const realAssigns = assignmentsByUser.get(s.userId) || [];
      const allBusy = [...realAssigns, ...planned];
      const overlap = allBusy.some(
        (b) =>
          b.startAt && b.endAt &&
          shift.startAt < b.endAt && shift.endAt > b.startAt
      );
      if (overlap) continue;

      // Lower pay = preferred (small bias).
      if (s.payRateCents > 0) {
        score += Math.max(0, 20 - Math.floor(s.payRateCents / 500)); // $5/hr each removes 1pt
      }

      // Burn-out avoidance — fewer assignments this week = better.
      const burdenThisWeek = realAssigns.length + planned.length;
      score -= burdenThisWeek * 3;
      if (burdenThisWeek === 0) reasons.push("Fresh — no shifts assigned this week");

      candidates.push({ userId: s.userId, name: s.name || `user#${s.userId}`, score, reasons });
    }

    candidates.sort((a, b) => b.score - a.score);
    const topN = candidates.slice(0, N);

    // Greedy: claim the top picks for downstream shifts.
    for (const top of topN.slice(0, needed)) {
      if (!plannedByUser.has(top.userId)) plannedByUser.set(top.userId, []);
      plannedByUser.get(top.userId)!.push({
        shiftId: shift.id,
        startAt: shift.startAt,
        endAt: shift.endAt,
      });
    }

    out.push({
      shiftId: shift.id,
      shiftTitle: shift.title,
      shiftStartAt: shift.startAt,
      shiftEndAt: shift.endAt,
      shiftRole: shift.role,
      needed,
      candidates: topN,
    });
  }

  logger.info("scheduler suggestions computed", { shifts: out.length });
  return out;
}

/**
 * Apply a list of (shiftId, userId) suggestions as assignments.
 * Idempotent — skips combos that already exist.
 */
export async function applyAssignments(
  pairs: Array<{ shiftId: number; userId: number; assignedBy: number }>
): Promise<{ applied: number }> {
  let applied = 0;
  for (const p of pairs) {
    const existing = await db
      .select({ id: shiftAssignments.id })
      .from(shiftAssignments)
      .where(
        and(
          eq(shiftAssignments.shiftId, p.shiftId),
          eq(shiftAssignments.userId, p.userId)
        )
      )
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(shiftAssignments).values({
      shiftId: p.shiftId,
      userId: p.userId,
      status: "assigned",
      assignedBy: p.assignedBy,
    });
    applied++;
  }
  // ensure import is used
  void sql;
  return { applied };
}

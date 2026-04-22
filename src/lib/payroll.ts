import { db } from "@/lib/db";
import { timeEntries } from "@/lib/db/schema";
import { and, eq, gte, isNotNull, lt, sql } from "drizzle-orm";

/**
 * Pay math lives in one place so the /admin/staff list, /admin/timeclock
 * approval view, and the eventual /admin/payroll roll-up all use the
 * same rules. No floats — everything is in cents until the last display
 * step.
 *
 * Rules:
 *   hourly     → round(minutes/60 * rate) + bonus
 *   per_shift  → flat rate per entry + bonus (length-agnostic)
 *   per_game   → flat rate per entry + bonus (one entry = one game)
 *   salary     → not counted per-entry (payroll pulls the period-level
 *                salary number in Phase 3)
 *   stipend    → flat rate per entry + bonus
 *
 * Open entries (no clockOutAt) contribute 0 cents — they haven't earned
 * anything yet. Break minutes are subtracted from the hourly-calc minutes.
 */
export function computeEntryCents(entry: {
  clockInAt: string;
  clockOutAt: string | null;
  breakMinutes: number;
  payRateCents: number;
  payRateType: "hourly" | "per_shift" | "per_game" | "salary" | "stipend";
  bonusCents: number;
}): number {
  const bonus = entry.bonusCents || 0;
  if (!entry.clockOutAt) return 0;

  switch (entry.payRateType) {
    case "per_shift":
    case "per_game":
    case "stipend":
      return (entry.payRateCents || 0) + bonus;
    case "salary":
      return 0;
    case "hourly":
    default: {
      const startMs = Date.parse(entry.clockInAt);
      const endMs = Date.parse(entry.clockOutAt);
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
        return bonus;
      }
      const totalMinutes = Math.floor((endMs - startMs) / 60_000);
      const workedMinutes = Math.max(0, totalMinutes - (entry.breakMinutes || 0));
      // Rate is per hour; keep everything integer by multiplying then dividing.
      const cents = Math.round((workedMinutes * entry.payRateCents) / 60);
      return cents + bonus;
    }
  }
}

/** Cents → "$123.45" for admin UI display. */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/**
 * Year-to-date gross cents per user, limited to approved entries.
 * Returned as a Map so the staff-list handler can merge against the
 * roster in one pass.
 *
 * Cheap enough to run on every staff-list hit because the
 * time_entries_user_idx + status index cover the filter. If the
 * table grows past a few hundred thousand rows we can memoize
 * per-minute.
 */
export async function ytdGrossByUser(
  year: number = new Date().getFullYear()
): Promise<Map<number, number>> {
  const startIso = new Date(Date.UTC(year, 0, 1)).toISOString();
  const endIso = new Date(Date.UTC(year + 1, 0, 1)).toISOString();

  const rows = await db
    .select({
      userId: timeEntries.userId,
      clockInAt: timeEntries.clockInAt,
      clockOutAt: timeEntries.clockOutAt,
      breakMinutes: timeEntries.breakMinutes,
      payRateCents: timeEntries.payRateCents,
      payRateType: timeEntries.payRateType,
      bonusCents: timeEntries.bonusCents,
    })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.status, "approved"),
        gte(timeEntries.clockInAt, startIso),
        lt(timeEntries.clockInAt, endIso),
        isNotNull(timeEntries.clockOutAt)
      )
    );

  const byUser = new Map<number, number>();
  for (const r of rows) {
    const cents = computeEntryCents({
      clockInAt: r.clockInAt,
      clockOutAt: r.clockOutAt,
      breakMinutes: r.breakMinutes ?? 0,
      payRateCents: r.payRateCents ?? 0,
      payRateType: r.payRateType,
      bonusCents: r.bonusCents ?? 0,
    });
    byUser.set(r.userId, (byUser.get(r.userId) ?? 0) + cents);
  }
  return byUser;
}

/**
 * 1099-NEC threshold. The IRS requires a 1099 when a non-W2 worker's
 * annual gross crosses $600. We flag at $500 so admins have a
 * 30-day runway to decide whether to (a) stop paying, (b) reclassify
 * to W2, or (c) accept the 1099 filing obligation.
 */
export const FORM_1099_WARNING_CENTS = 50_000; // $500
export const FORM_1099_THRESHOLD_CENTS = 60_000; // $600

export function form1099Status(
  classification: string,
  ytdCents: number
): "not_applicable" | "ok" | "approaching" | "over" {
  // W2 + volunteer don't trigger 1099 at all.
  if (classification === "w2" || classification === "volunteer") {
    return "not_applicable";
  }
  if (ytdCents >= FORM_1099_THRESHOLD_CENTS) return "over";
  if (ytdCents >= FORM_1099_WARNING_CENTS) return "approaching";
  return "ok";
}

export async function countOpenEntriesForUser(userId: number): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)` })
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), sql`${timeEntries.clockOutAt} IS NULL`));
  return Number(row?.c) || 0;
}

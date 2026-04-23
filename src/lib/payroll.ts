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

// ── Pay period rollups ──────────────────────────────────────────────

export type PayrollLine = {
  userId: number;
  name: string | null;
  email: string | null;
  classification: string;
  paymentMethod: string;
  payoutHandle: string | null;
  // Minutes are the raw source of truth. Everything downstream is
  // derived so a reviewer can sanity-check hours before cutting checks.
  totalMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  regularCents: number;
  overtimeCents: number;
  bonusCents: number;
  flatPayCents: number; // per_shift / per_game / stipend totals
  grossCents: number;   // regular + overtime + bonus + flat
  entryCount: number;
  approvedEntries: number;
};

/**
 * Federal FLSA overtime applies to W2 employees at 1.5× for hours
 * worked over 40 in a workweek. 1099 / cash / volunteer / stipend
 * workers aren't covered, so we only compute overtime for `w2`.
 *
 * The bucketing happens per ISO-week within the period — NOT the
 * period boundary itself. A biweekly period has two weeks, each
 * with its own 40h cap. This matches how every US payroll system
 * from ADP to Gusto calculates it.
 *
 * Non-hourly entries (per_shift, per_game, stipend) are excluded
 * from the overtime calc — those are flat-pay and not hours-based.
 * Salary entries are ignored entirely (payroll_period handles them
 * at the period level, outside this function).
 */
export async function computePayrollRollup(
  startIso: string,
  endIso: string
): Promise<PayrollLine[]> {
  // Import here instead of top-of-file to keep the module load cheap
  // for non-payroll callers (computeEntryCents + ytdGrossByUser don't
  // need schema imports).
  const { and, eq, gte, isNotNull, lt } = await import("drizzle-orm");
  const { db } = await import("@/lib/db");
  const { timeEntries, users, staffProfiles } = await import("@/lib/db/schema");

  const rows = await db
    .select({
      userId: timeEntries.userId,
      name: users.name,
      email: users.email,
      classification: staffProfiles.employmentClassification,
      paymentMethod: staffProfiles.paymentMethod,
      payoutHandle: staffProfiles.payoutHandle,
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
    .leftJoin(staffProfiles, eq(staffProfiles.userId, timeEntries.userId))
    .where(
      and(
        eq(timeEntries.status, "approved"),
        gte(timeEntries.clockInAt, startIso),
        lt(timeEntries.clockInAt, endIso),
        isNotNull(timeEntries.clockOutAt)
      )
    );

  // Bucket entries first by user, then by ISO-week within the period
  // so we can apply the 40h-per-week overtime cap correctly.
  type Acc = {
    userId: number;
    name: string | null;
    email: string | null;
    classification: string;
    paymentMethod: string;
    payoutHandle: string | null;
    weeklyMinutes: Map<string, number>; // "2026-W16" → minutes
    weeklyRate: Map<string, number>;    // rate snapshot (last-wins)
    flatCents: number;
    bonusCents: number;
    entryCount: number;
    approvedEntries: number;
  };

  const byUser = new Map<number, Acc>();
  for (const r of rows) {
    if (!r.clockOutAt) continue;
    const acc = byUser.get(r.userId) ?? {
      userId: r.userId,
      name: r.name ?? null,
      email: r.email ?? null,
      classification: r.classification ?? "cash_no_1099",
      paymentMethod: r.paymentMethod ?? "venmo",
      payoutHandle: r.payoutHandle ?? null,
      weeklyMinutes: new Map(),
      weeklyRate: new Map(),
      flatCents: 0,
      bonusCents: 0,
      entryCount: 0,
      approvedEntries: 0,
    };
    acc.entryCount += 1;
    acc.approvedEntries += 1;
    acc.bonusCents += r.bonusCents ?? 0;

    if (r.payRateType === "hourly") {
      const startMs = Date.parse(r.clockInAt);
      const endMs = Date.parse(r.clockOutAt);
      if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs) {
        const mins = Math.max(
          0,
          Math.floor((endMs - startMs) / 60_000) - (r.breakMinutes ?? 0)
        );
        const wk = isoWeekKey(new Date(startMs));
        acc.weeklyMinutes.set(wk, (acc.weeklyMinutes.get(wk) ?? 0) + mins);
        acc.weeklyRate.set(wk, r.payRateCents ?? 0);
      }
    } else if (r.payRateType === "salary") {
      // Salary handled at the period level — skip here.
    } else {
      // per_shift / per_game / stipend: flat pay per entry.
      acc.flatCents += r.payRateCents ?? 0;
    }
    byUser.set(r.userId, acc);
  }

  const lines: PayrollLine[] = [];
  for (const acc of byUser.values()) {
    let regularMinutes = 0;
    let overtimeMinutes = 0;
    let regularCents = 0;
    let overtimeCents = 0;
    const canOvertime = acc.classification === "w2";

    for (const [wk, mins] of acc.weeklyMinutes) {
      const rate = acc.weeklyRate.get(wk) ?? 0;
      const WEEK_CAP = 40 * 60;
      if (canOvertime && mins > WEEK_CAP) {
        const reg = WEEK_CAP;
        const ot = mins - WEEK_CAP;
        regularMinutes += reg;
        overtimeMinutes += ot;
        regularCents += Math.round((reg * rate) / 60);
        overtimeCents += Math.round((ot * rate * 1.5) / 60);
      } else {
        regularMinutes += mins;
        regularCents += Math.round((mins * rate) / 60);
      }
    }

    const gross =
      regularCents + overtimeCents + acc.bonusCents + acc.flatCents;

    lines.push({
      userId: acc.userId,
      name: acc.name,
      email: acc.email,
      classification: acc.classification,
      paymentMethod: acc.paymentMethod,
      payoutHandle: acc.payoutHandle,
      totalMinutes: regularMinutes + overtimeMinutes,
      regularMinutes,
      overtimeMinutes,
      regularCents,
      overtimeCents,
      bonusCents: acc.bonusCents,
      flatPayCents: acc.flatCents,
      grossCents: gross,
      entryCount: acc.entryCount,
      approvedEntries: acc.approvedEntries,
    });
  }
  lines.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  return lines;
}

/** ISO week key — "2026-W16". Uses Monday as week start (ISO 8601). */
function isoWeekKey(d: Date): string {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  );
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// ── CSV formatters ──────────────────────────────────────────────────
// RFC 4180 — every cell quoted so commas/newlines are safe.

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function csvDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Generic "everything" CSV — what you'd paste into a spreadsheet. */
export function rollupToGenericCsv(lines: PayrollLine[]): string {
  const header = [
    "user_id",
    "name",
    "email",
    "classification",
    "payment_method",
    "payout_handle",
    "total_hours",
    "regular_hours",
    "overtime_hours",
    "regular_pay",
    "overtime_pay",
    "bonus_pay",
    "flat_pay",
    "gross",
    "entry_count",
  ];
  const rows = lines.map((l) => [
    l.userId,
    l.name,
    l.email,
    l.classification,
    l.paymentMethod,
    l.payoutHandle,
    (l.totalMinutes / 60).toFixed(2),
    (l.regularMinutes / 60).toFixed(2),
    (l.overtimeMinutes / 60).toFixed(2),
    csvDollars(l.regularCents),
    csvDollars(l.overtimeCents),
    csvDollars(l.bonusCents),
    csvDollars(l.flatPayCents),
    csvDollars(l.grossCents),
    l.entryCount,
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

/**
 * Gusto bulk-import column order (as of 2025). Gusto expects name
 * parts separately; we split naively on last whitespace.
 */
export function rollupToGustoCsv(lines: PayrollLine[]): string {
  const header = [
    "First Name",
    "Last Name",
    "Email",
    "Regular Hours",
    "Overtime Hours",
    "Bonus",
    "Reimbursement",
    "Other Earnings",
    "Notes",
  ];
  const rows = lines.map((l) => {
    const full = (l.name ?? "").trim();
    const sp = full.lastIndexOf(" ");
    const first = sp >= 0 ? full.slice(0, sp) : full;
    const last = sp >= 0 ? full.slice(sp + 1) : "";
    return [
      first,
      last,
      l.email,
      (l.regularMinutes / 60).toFixed(2),
      (l.overtimeMinutes / 60).toFixed(2),
      csvDollars(l.bonusCents),
      "0.00",
      csvDollars(l.flatPayCents),
      l.classification === "w2" ? "" : `(${l.classification})`,
    ];
  });
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

/** QuickBooks Time export — matches the "Approved Timesheets" format. */
export function rollupToQuickBooksCsv(lines: PayrollLine[]): string {
  const header = [
    "Employee",
    "Regular Hours",
    "Overtime Hours",
    "Bonus",
    "Total Earnings",
    "Payment Method",
  ];
  const rows = lines.map((l) => [
    l.name ?? `User #${l.userId}`,
    (l.regularMinutes / 60).toFixed(2),
    (l.overtimeMinutes / 60).toFixed(2),
    csvDollars(l.bonusCents),
    csvDollars(l.grossCents),
    l.paymentMethod,
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export async function countOpenEntriesForUser(userId: number): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)` })
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), sql`${timeEntries.clockOutAt} IS NULL`));
  return Number(row?.c) || 0;
}

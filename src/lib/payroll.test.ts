import { describe, it, expect } from "vitest";
import {
  computeEntryCents,
  formatCents,
  form1099Status,
  FORM_1099_WARNING_CENTS,
  FORM_1099_THRESHOLD_CENTS,
  rollupToGenericCsv,
  rollupToGustoCsv,
  rollupToQuickBooksCsv,
  type PayrollLine,
} from "./payroll";

// ─── computeEntryCents ────────────────────────────────────────────────

describe("payroll / computeEntryCents", () => {
  const base = {
    clockInAt: "2026-06-01T09:00:00Z",
    clockOutAt: "2026-06-01T17:00:00Z", // 8 hours
    breakMinutes: 0,
    payRateCents: 2500, // $25/hr
    bonusCents: 0,
  };

  it("returns 0 for an open (still-clocked-in) entry", () => {
    expect(
      computeEntryCents({ ...base, clockOutAt: null, payRateType: "hourly" })
    ).toBe(0);
  });

  it("returns 0 for salary entries regardless of hours", () => {
    expect(computeEntryCents({ ...base, payRateType: "salary" })).toBe(0);
  });

  it("hourly: 8h @ $25/hr = $200.00 (20000 cents)", () => {
    expect(computeEntryCents({ ...base, payRateType: "hourly" })).toBe(20_000);
  });

  it("hourly: subtracts break minutes from worked minutes", () => {
    // 8h - 30min break = 7.5h @ $25 = $187.50
    expect(
      computeEntryCents({ ...base, breakMinutes: 30, payRateType: "hourly" })
    ).toBe(18_750);
  });

  it("hourly: break exceeding shift length floors at 0 (plus bonus)", () => {
    expect(
      computeEntryCents({
        ...base,
        breakMinutes: 999,
        payRateType: "hourly",
        bonusCents: 500,
      })
    ).toBe(500);
  });

  it("hourly: rounds fractional cents (half-up to nearest cent)", () => {
    // 17min @ $15/hr = 17*1500/60 = 425 cents exactly
    // Use 11min @ $15/hr = 275 cents. Try 7min @ $13.33/hr to force rounding.
    // 7min * 1333 / 60 = 9331/60 = 155.5166... → rounded = 156
    const cents = computeEntryCents({
      ...base,
      clockInAt: "2026-06-01T09:00:00Z",
      clockOutAt: "2026-06-01T09:07:00Z",
      payRateCents: 1333,
      breakMinutes: 0,
      payRateType: "hourly",
    });
    expect(cents).toBe(156);
  });

  it("hourly: rejects backwards clock (clockOut <= clockIn) — returns only bonus", () => {
    expect(
      computeEntryCents({
        ...base,
        clockInAt: "2026-06-01T17:00:00Z",
        clockOutAt: "2026-06-01T09:00:00Z",
        payRateType: "hourly",
        bonusCents: 1000,
      })
    ).toBe(1000);
  });

  it("hourly: returns only bonus when timestamps are invalid", () => {
    expect(
      computeEntryCents({
        ...base,
        clockInAt: "not-a-date",
        clockOutAt: "also-not-a-date",
        payRateType: "hourly",
        bonusCents: 250,
      })
    ).toBe(250);
  });

  it("per_shift: flat rate + bonus, ignores clocked minutes", () => {
    expect(
      computeEntryCents({
        ...base,
        payRateType: "per_shift",
        payRateCents: 15_000,
        bonusCents: 2_500,
      })
    ).toBe(17_500);
  });

  it("per_game: flat rate + bonus", () => {
    expect(
      computeEntryCents({
        ...base,
        payRateType: "per_game",
        payRateCents: 4_000,
        bonusCents: 0,
      })
    ).toBe(4_000);
  });

  it("stipend: flat rate + bonus", () => {
    expect(
      computeEntryCents({
        ...base,
        payRateType: "stipend",
        payRateCents: 10_000,
        bonusCents: 500,
      })
    ).toBe(10_500);
  });

  it("adds bonus to hourly computations", () => {
    // 8h @ $25/hr + $50 bonus = $250.00
    expect(
      computeEntryCents({ ...base, payRateType: "hourly", bonusCents: 5_000 })
    ).toBe(25_000);
  });
});

// ─── formatCents ──────────────────────────────────────────────────────

describe("payroll / formatCents", () => {
  it("formats whole dollars with trailing .00", () => {
    expect(formatCents(20_000)).toBe("$200.00");
  });

  it("formats partial dollars", () => {
    expect(formatCents(12_345)).toBe("$123.45");
  });

  it("pads single-digit cents", () => {
    expect(formatCents(12_305)).toBe("$123.05");
  });

  it("handles zero", () => {
    expect(formatCents(0)).toBe("$0.00");
  });

  it("prefixes negative amounts with '-'", () => {
    expect(formatCents(-5_000)).toBe("-$50.00");
  });
});

// ─── form1099Status ───────────────────────────────────────────────────

describe("payroll / form1099Status", () => {
  it("'not_applicable' for W2 and volunteer regardless of YTD", () => {
    expect(form1099Status("w2", 100_000)).toBe("not_applicable");
    expect(form1099Status("volunteer", 100_000)).toBe("not_applicable");
  });

  it("'ok' below the warning threshold ($500)", () => {
    expect(form1099Status("1099", 0)).toBe("ok");
    expect(form1099Status("1099", FORM_1099_WARNING_CENTS - 1)).toBe("ok");
  });

  it("'approaching' at the warning threshold (up to $599)", () => {
    expect(form1099Status("1099", FORM_1099_WARNING_CENTS)).toBe("approaching");
    expect(form1099Status("1099", FORM_1099_THRESHOLD_CENTS - 1)).toBe("approaching");
  });

  it("'over' at the IRS threshold ($600)", () => {
    expect(form1099Status("1099", FORM_1099_THRESHOLD_CENTS)).toBe("over");
    expect(form1099Status("1099", 1_000_000)).toBe("over");
  });
});

// ─── CSV exports ──────────────────────────────────────────────────────

function mkLine(overrides: Partial<PayrollLine> = {}): PayrollLine {
  return {
    userId: 1,
    name: "Jane Smith",
    email: "jane@example.com",
    classification: "1099",
    paymentMethod: "venmo",
    payoutHandle: "@jane",
    totalMinutes: 480,
    regularMinutes: 480,
    overtimeMinutes: 0,
    regularCents: 20_000,
    overtimeCents: 0,
    bonusCents: 0,
    flatPayCents: 0,
    grossCents: 20_000,
    entryCount: 1,
    ...overrides,
  };
}

describe("payroll / rollupToGenericCsv", () => {
  it("renders header + one row with converted hours + dollars", () => {
    const csv = rollupToGenericCsv([mkLine()]);
    const [header, row] = csv.split("\n");
    expect(header).toContain("user_id");
    expect(header).toContain("gross");
    expect(row).toContain("Jane Smith");
    // 480 min → 8.00 hours
    expect(row).toContain('"8.00"');
    // 20000 cents → 200.00
    expect(row).toContain('"200.00"');
  });

  it("quotes every cell (RFC-4180 always-quoted style)", () => {
    const csv = rollupToGenericCsv([mkLine()]);
    // Every field is wrapped in double quotes
    expect(csv.split("\n")[1]).toMatch(/^".*"$/);
  });
});

describe("payroll / rollupToGustoCsv", () => {
  it("splits 'First Last' into separate columns", () => {
    const csv = rollupToGustoCsv([mkLine({ name: "Jane Smith" })]);
    expect(csv).toContain('"Jane"');
    expect(csv).toContain('"Smith"');
  });

  it("leaves last-name empty for single-word names", () => {
    const csv = rollupToGustoCsv([mkLine({ name: "Madonna" })]);
    const row = csv.split("\n")[1];
    // "Madonna","",... — first col Madonna, second blank
    expect(row).toMatch(/^"Madonna",""/);
  });

  it("annotates non-W2 classifications in the Notes column", () => {
    const csv = rollupToGustoCsv([mkLine({ classification: "1099" })]);
    expect(csv).toContain("(1099)");
  });

  it("leaves Notes empty for W2 workers", () => {
    const csv = rollupToGustoCsv([
      mkLine({ classification: "w2", name: "Jane Smith" }),
    ]);
    const row = csv.split("\n")[1];
    // Last column is Notes — should be empty string ""
    expect(row.endsWith('""')).toBe(true);
  });
});

describe("payroll / rollupToQuickBooksCsv", () => {
  it("uses name or falls back to 'User #<id>'", () => {
    const withName = rollupToQuickBooksCsv([mkLine({ name: "Jane Smith" })]);
    expect(withName).toContain("Jane Smith");

    const nameless = rollupToQuickBooksCsv([mkLine({ name: null, userId: 42 })]);
    expect(nameless).toContain("User #42");
  });

  it("renders total earnings as gross dollars", () => {
    const csv = rollupToQuickBooksCsv([mkLine({ grossCents: 34_567 })]);
    expect(csv).toContain('"345.67"');
  });
});

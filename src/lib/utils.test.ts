import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cn,
  formatDate,
  formatDateRange,
  formatCurrency,
  relativeDate,
  formatDateShort,
  slugify,
  formatPhone,
} from "./utils";

describe("utils / cn", () => {
  it("joins truthy string classes with spaces", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out null/undefined/false", () => {
    expect(cn("a", null, "b", undefined, false, "c")).toBe("a b c");
  });

  it("returns empty string when nothing is truthy", () => {
    expect(cn(null, undefined, false)).toBe("");
  });

  it("supports conditional class patterns", () => {
    const active = true;
    const disabled = false;
    expect(cn("btn", active && "active", disabled && "disabled")).toBe("btn active");
  });
});

describe("utils / formatDate", () => {
  it("formats ISO date strings as 'Mon D, YYYY'", () => {
    // Time-zone safe: pass explicit UTC timestamp
    const out = formatDate("2026-04-15T12:00:00Z");
    // Result can depend on local TZ, but month + year tokens are stable:
    expect(out).toMatch(/Apr.+2026/);
  });
});

describe("utils / formatDateRange", () => {
  it("compacts same-month ranges to 'Apr 1-5, 2026'", () => {
    const out = formatDateRange("2026-04-01T12:00:00Z", "2026-04-05T12:00:00Z");
    expect(out).toMatch(/Apr \d+-\d+, 2026/);
  });

  it("spells out both dates for cross-month ranges", () => {
    const out = formatDateRange("2026-04-30T12:00:00Z", "2026-05-02T12:00:00Z");
    expect(out).toContain(" - ");
    expect(out).toMatch(/Apr/);
    expect(out).toMatch(/May/);
  });
});

describe("utils / formatCurrency", () => {
  it("formats whole dollars with $ prefix, no decimals (per config)", () => {
    expect(formatCurrency(1234)).toBe("$1,234");
    expect(formatCurrency(0)).toBe("$0");
  });

  it("rounds fractions at display time", () => {
    expect(formatCurrency(99.4)).toBe("$99");
    expect(formatCurrency(99.5)).toBe("$100");
  });
});

describe("utils / relativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T10:00:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("returns null for past dates", () => {
    expect(relativeDate("2026-06-14")).toBeNull();
    expect(relativeDate("2020-01-01")).toBeNull();
  });

  it("returns 'Today' for the current date", () => {
    expect(relativeDate("2026-06-15")).toBe("Today");
  });

  it("returns 'Tomorrow' for next day", () => {
    expect(relativeDate("2026-06-16")).toBe("Tomorrow");
  });

  it("returns 'This <weekday>' for days 2-6 out", () => {
    // 2026-06-15 = Monday, +3 = Thursday
    expect(relativeDate("2026-06-18")).toBe("This Thursday");
  });

  it("returns 'In N days' for days 7-13", () => {
    expect(relativeDate("2026-06-22")).toBe("In 7 days");
    expect(relativeDate("2026-06-28")).toBe("In 13 days");
  });

  it("returns null for dates more than 13 days out", () => {
    expect(relativeDate("2026-06-29")).toBeNull();
    expect(relativeDate("2026-12-01")).toBeNull();
  });
});

describe("utils / formatDateShort", () => {
  it("renders 'Mon D' without year", () => {
    expect(formatDateShort("2026-04-16")).toMatch(/Apr \d+/);
  });

  it("handles ISO with time component", () => {
    expect(formatDateShort("2026-04-16T15:30:00Z")).toMatch(/Apr \d+/);
  });
});

describe("utils / slugify", () => {
  it("lowercases and dashifies", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("collapses non-alphanumerics to single dashes", () => {
    expect(slugify("A!! B??  C")).toBe("a-b-c");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("  Leading spaces  ")).toBe("leading-spaces");
    expect(slugify("--edge--")).toBe("edge");
  });

  it("returns empty string for non-alphanumeric input", () => {
    expect(slugify("!!! ")).toBe("");
  });
});

describe("utils / formatPhone", () => {
  it("returns empty for empty input", () => {
    expect(formatPhone("")).toBe("");
  });

  it("formats partial digits with opening paren only", () => {
    expect(formatPhone("480")).toBe("(480");
  });

  it("inserts closing paren at 4th digit", () => {
    expect(formatPhone("4805")).toBe("(480) 5");
  });

  it("inserts hyphen at 7th digit", () => {
    expect(formatPhone("4805551")).toBe("(480) 555-1");
  });

  it("formats a complete US number", () => {
    expect(formatPhone("4805551234")).toBe("(480) 555-1234");
  });

  it("strips non-digits while preserving digit order", () => {
    expect(formatPhone("(480) 555-1234")).toBe("(480) 555-1234");
    // NOTE: This is an as-you-type formatter, not a normalizer. It
    // doesn't recognize the "+1" country code — the "1" is treated as
    // the first digit of the area code. Callers that want to strip
    // country codes should do so before calling formatPhone().
    expect(formatPhone("+1 480.555.1234 ext 99")).toBe("(148) 055-5123");
  });

  it("caps at 10 digits (ignores extra)", () => {
    expect(formatPhone("48055512349999")).toBe("(480) 555-1234");
  });
});

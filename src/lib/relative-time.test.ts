import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { relativeTime } from "./relative-time";

describe("relative-time / relativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty string for null / undefined / invalid inputs", () => {
    expect(relativeTime(null)).toBe("");
    expect(relativeTime(undefined)).toBe("");
    expect(relativeTime("not a date")).toBe("");
  });

  it("treats sub-45-second deltas as 'just now' in both directions", () => {
    expect(relativeTime("2026-06-15T11:59:30Z")).toBe("just now"); // 30s ago
    expect(relativeTime("2026-06-15T12:00:20Z")).toBe("just now"); // 20s future
  });

  it("formats past timestamps with 'ago' phrasing", () => {
    // 5 minutes ago — Intl.RelativeTimeFormat says "5 minutes ago"
    const out = relativeTime("2026-06-15T11:55:00Z");
    expect(out).toMatch(/5 minutes ago/);
  });

  it("formats hours / days / months appropriately", () => {
    expect(relativeTime("2026-06-15T09:00:00Z")).toMatch(/3 hours ago/);
    expect(relativeTime("2026-06-13T12:00:00Z")).toMatch(/2 days ago/);
    expect(relativeTime("2026-04-15T12:00:00Z")).toMatch(/2 months ago/);
  });

  it("handles future timestamps", () => {
    const out = relativeTime("2026-06-15T13:00:00Z"); // 1 hour from now
    // Intl RTF with numeric:auto may say "in 1 hour" — accept either phrasing
    expect(out).toMatch(/hour/);
    expect(out).not.toMatch(/ago/);
  });

  it("accepts Date objects directly", () => {
    const out = relativeTime(new Date("2026-06-15T10:00:00Z"));
    expect(out).toMatch(/2 hours ago/);
  });
});

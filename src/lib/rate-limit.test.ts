import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isRateLimited, getClientIp } from "./rate-limit";

describe("rate-limit / isRateLimited", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request for a new key", () => {
    expect(isRateLimited("rl-key-new", 3, 60_000)).toBe(false);
  });

  it("allows up to `limit` requests in the window", () => {
    const key = "rl-key-limit";
    expect(isRateLimited(key, 3, 60_000)).toBe(false); // 1
    expect(isRateLimited(key, 3, 60_000)).toBe(false); // 2
    expect(isRateLimited(key, 3, 60_000)).toBe(false); // 3
  });

  it("blocks the (limit+1)-th request within the window", () => {
    const key = "rl-key-block";
    isRateLimited(key, 2, 60_000); // 1
    isRateLimited(key, 2, 60_000); // 2
    expect(isRateLimited(key, 2, 60_000)).toBe(true); // 3 → blocked
    expect(isRateLimited(key, 2, 60_000)).toBe(true); // stays blocked
  });

  it("resets after the window elapses", () => {
    const key = "rl-key-reset";
    isRateLimited(key, 1, 60_000); // 1
    expect(isRateLimited(key, 1, 60_000)).toBe(true); // blocked

    // Jump forward past the window.
    vi.setSystemTime(new Date("2026-01-01T00:01:01Z"));

    expect(isRateLimited(key, 1, 60_000)).toBe(false); // fresh allowance
  });

  it("isolates buckets by key (so namespacing works)", () => {
    isRateLimited("bucket-a", 1, 60_000);
    expect(isRateLimited("bucket-a", 1, 60_000)).toBe(true);
    // Different key — its own bucket:
    expect(isRateLimited("bucket-b", 1, 60_000)).toBe(false);
  });
});

describe("rate-limit / getClientIp", () => {
  function mkReq(headers: Record<string, string>): Request {
    return new Request("https://example.com", { headers });
  }

  it("prefers the first entry in x-forwarded-for", () => {
    const ip = getClientIp(mkReq({ "x-forwarded-for": "203.0.113.1, 10.0.0.1" }));
    expect(ip).toBe("203.0.113.1");
  });

  it("trims whitespace from the forwarded IP", () => {
    const ip = getClientIp(mkReq({ "x-forwarded-for": "   203.0.113.2  , 10.0.0.1" }));
    expect(ip).toBe("203.0.113.2");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const ip = getClientIp(mkReq({ "x-real-ip": "203.0.113.3" }));
    expect(ip).toBe("203.0.113.3");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    const ip = getClientIp(mkReq({}));
    expect(ip).toBe("unknown");
  });
});

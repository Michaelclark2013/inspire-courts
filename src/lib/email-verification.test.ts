import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateVerifyToken,
  verifyUrlFor,
  verifyTokenExpiryIso,
  isVerified,
  EMAIL_VERIFY_TTL_HOURS,
} from "./email-verification";

describe("email-verification / generateVerifyToken", () => {
  it("returns a 64-character hex string (32 bytes)", () => {
    const token = generateVerifyToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[a-f0-9]+$/);
  });

  it("returns a different token every call", () => {
    const a = generateVerifyToken();
    const b = generateVerifyToken();
    expect(a).not.toBe(b);
  });
});

describe("email-verification / verifyUrlFor", () => {
  it("builds a URL pointing at /verify-email?token=...", () => {
    const url = verifyUrlFor("abc123");
    expect(url).toMatch(/\/verify-email\?token=abc123$/);
  });

  it("URL-encodes special characters defensively", () => {
    const url = verifyUrlFor("a&b=c");
    // Even though our tokens are always hex, never trust a caller.
    expect(url).toContain(encodeURIComponent("a&b=c"));
  });
});

describe("email-verification / verifyTokenExpiryIso", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("returns an ISO timestamp 24 hours in the future", () => {
    const iso = verifyTokenExpiryIso();
    const expected = new Date("2026-06-02T12:00:00Z").toISOString();
    expect(iso).toBe(expected);
  });

  it("matches the exported TTL constant", () => {
    expect(EMAIL_VERIFY_TTL_HOURS).toBe(24);
  });
});

describe("email-verification / isVerified", () => {
  it("returns false for null / undefined", () => {
    expect(isVerified(null)).toBe(false);
    expect(isVerified(undefined)).toBe(false);
  });

  it("returns false when emailVerifiedAt is null", () => {
    expect(isVerified({ emailVerifiedAt: null })).toBe(false);
  });

  it("returns true when emailVerifiedAt is an ISO string", () => {
    expect(isVerified({ emailVerifiedAt: "2026-06-01T12:00:00Z" })).toBe(true);
  });

  it("returns true when emailVerifiedAt is a Date", () => {
    expect(isVerified({ emailVerifiedAt: new Date() })).toBe(true);
  });
});

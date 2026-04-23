import { describe, it, expect } from "vitest";
import { getSessionUserId } from "./session-helpers";
import type { Session } from "next-auth";

function mkSession(id: unknown): Session {
  // Session type expects user.id: string, but the whole point of this helper
  // is to handle malformed payloads — cast through unknown to exercise those.
  return {
    user: { id: id as string },
    expires: "2026-12-31T00:00:00Z",
  } as Session;
}

describe("session-helpers / getSessionUserId", () => {
  it("returns null when session is null", () => {
    expect(getSessionUserId(null)).toBeNull();
  });

  it("returns null when session is undefined", () => {
    expect(getSessionUserId(undefined)).toBeNull();
  });

  it("returns null when session.user.id is missing", () => {
    expect(getSessionUserId({ user: {}, expires: "" } as Session)).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(getSessionUserId(mkSession("not-a-number"))).toBeNull();
    expect(getSessionUserId(mkSession("abc123"))).toBeNull();
  });

  it("returns null for decimals", () => {
    expect(getSessionUserId(mkSession("1.5"))).toBeNull();
  });

  it("returns null for zero or negative numbers", () => {
    expect(getSessionUserId(mkSession("0"))).toBeNull();
    expect(getSessionUserId(mkSession("-5"))).toBeNull();
  });

  it("returns null for NaN / Infinity representations", () => {
    expect(getSessionUserId(mkSession("NaN"))).toBeNull();
    expect(getSessionUserId(mkSession("Infinity"))).toBeNull();
  });

  it("returns the integer for valid positive numeric strings", () => {
    expect(getSessionUserId(mkSession("1"))).toBe(1);
    expect(getSessionUserId(mkSession("42"))).toBe(42);
    expect(getSessionUserId(mkSession("999999"))).toBe(999999);
  });

  it("accepts numeric (not string) ids defensively", () => {
    expect(getSessionUserId(mkSession(7))).toBe(7);
  });
});

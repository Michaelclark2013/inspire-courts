import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { lookupIdempotent, storeIdempotent } from "./idempotency";

describe("idempotency", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when no key is provided (no-op)", () => {
    expect(lookupIdempotent(1, null)).toBeNull();
    expect(lookupIdempotent(1, undefined)).toBeNull();
    storeIdempotent(1, null, { ok: true }, 200);
    expect(lookupIdempotent(1, "whatever")).toBeNull();
  });

  it("stores and returns a cached response for the same (userId, key)", () => {
    storeIdempotent(7, "key-1", { created: true }, 201);
    const cached = lookupIdempotent(7, "key-1");
    expect(cached).not.toBeNull();
    expect(cached!.status).toBe(201);
    expect(cached!.body).toEqual({ created: true });
  });

  it("isolates cache by userId so two admins with same key don't collide", () => {
    storeIdempotent(1, "shared-key", { from: 1 }, 200);
    storeIdempotent(2, "shared-key", { from: 2 }, 200);

    const a = lookupIdempotent(1, "shared-key");
    const b = lookupIdempotent(2, "shared-key");
    expect(a!.body).toEqual({ from: 1 });
    expect(b!.body).toEqual({ from: 2 });
  });

  it("expires cached entries after the TTL (5 min)", () => {
    storeIdempotent(1, "fleeting", { v: 1 }, 200);
    expect(lookupIdempotent(1, "fleeting")).not.toBeNull();

    // 5 minutes + 1 second → past TTL
    vi.setSystemTime(new Date("2026-06-01T00:05:01Z"));
    expect(lookupIdempotent(1, "fleeting")).toBeNull();
  });

  it("treats anonymous (no userId) stores as their own namespace", () => {
    storeIdempotent(null, "anon-key", { anon: true }, 200);
    expect(lookupIdempotent(null, "anon-key")).not.toBeNull();
    // A logged-in user with the same key should NOT see the anonymous entry.
    expect(lookupIdempotent(5, "anon-key")).toBeNull();
  });
});

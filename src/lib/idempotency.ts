import { logger } from "@/lib/logger";

/**
 * Simple in-process idempotency cache for admin POST retries.
 *
 * When a client passes an `Idempotency-Key` header, the handler can:
 *   1. Call `lookupIdempotent(userId, key)` first — returns a cached body
 *      + status if the same key has been seen recently.
 *   2. Run its normal mutation.
 *   3. Call `storeIdempotent(userId, key, body, status)` with the final
 *      response so a retry within TTL_MS returns the same result.
 *
 * Scope: per-admin-user + per-key, so two admins sending the same key
 * don't collide. TTL is intentionally short (5 min) — long enough for a
 * realistic retry window, short enough that memory doesn't balloon.
 *
 * Not persistent: on a cold Lambda start the cache is empty and a retry
 * that crosses that boundary could duplicate-insert. In practice admin
 * retries happen within seconds of the original request, well before
 * Vercel recycles a function.
 */
const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 500; // cap memory; LRU eviction when we hit it

type CachedResponse = {
  status: number;
  body: unknown;
  expiresAt: number;
};

const cache = new Map<string, CachedResponse>();

function makeKey(userId: string | number | null | undefined, key: string): string {
  return `${userId ?? "anon"}:${key}`;
}

function pruneExpired() {
  const now = Date.now();
  for (const [k, v] of cache) {
    if (v.expiresAt <= now) cache.delete(k);
  }
  // Hard cap: drop oldest insertions if we blew past the limit.
  while (cache.size > MAX_ENTRIES) {
    const first = cache.keys().next().value;
    if (!first) break;
    cache.delete(first);
  }
}

export function lookupIdempotent(
  userId: string | number | null | undefined,
  key: string | null | undefined
): CachedResponse | null {
  if (!key) return null;
  pruneExpired();
  const entry = cache.get(makeKey(userId, key));
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(makeKey(userId, key));
    return null;
  }
  return entry;
}

export function storeIdempotent(
  userId: string | number | null | undefined,
  key: string | null | undefined,
  body: unknown,
  status: number
): void {
  if (!key) return;
  try {
    cache.set(makeKey(userId, key), {
      status,
      body,
      expiresAt: Date.now() + TTL_MS,
    });
    pruneExpired();
  } catch (err) {
    // Caching is best-effort. A failure here must never block the mutation.
    logger.warn("idempotency cache write failed", { error: String(err) });
  }
}

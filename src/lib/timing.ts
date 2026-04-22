import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Per-request timing instrumentation.
 *
 * Wraps a route handler so the returned NextResponse carries a
 * `Server-Timing` header (RFC 9456-ish format) + an `X-Response-Time`
 * header in milliseconds. Slow requests (>1000ms) also write a
 * structured log line so we can spot N+1 queries / expensive
 * aggregations without needing APM tooling.
 *
 * Usage:
 *   export const GET = withTiming("admin.metrics", async () => { ... });
 *
 * The label is an opaque identifier that appears in both headers and
 * log lines so we can correlate slow responses back to the specific
 * route without relying on Next.js request metadata.
 *
 * Zero-cost on the happy path: one `performance.now()` call + a single
 * header set. The wrapper never swallows thrown errors — they bubble
 * up to Next's default error boundary exactly as before.
 */
export function withTiming<Args extends unknown[]>(
  label: string,
  handler: (...args: Args) => Promise<NextResponse> | NextResponse
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    const started = performance.now();
    let res: NextResponse;
    try {
      res = await handler(...args);
    } catch (err) {
      const ms = Math.round(performance.now() - started);
      logger.error("route threw", { label, ms, error: String(err) });
      throw err;
    }
    const ms = Math.round(performance.now() - started);
    try {
      res.headers.set("Server-Timing", `${label};dur=${ms}`);
      res.headers.set("X-Response-Time", `${ms}ms`);
    } catch {
      // Some response types (e.g. cached 304) have immutable headers —
      // silently skip rather than fail the request.
    }
    if (ms > 1000) {
      logger.warn("slow route", { label, ms, status: res.status });
    }
    return res;
  };
}

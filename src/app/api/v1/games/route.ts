import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games } from "@/lib/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { verifyApiKey, checkApiKeyRateLimit } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// GET /api/v1/games?status=live  → list games (no scores; that's a separate
// endpoint). Filtered by status enum and an optional `since` ISO timestamp.
export async function GET(request: NextRequest) {
  const auth = await verifyApiKey(request.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = checkApiKeyRateLimit(auth.id);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }
  const sp = request.nextUrl.searchParams;
  // Validate the user-supplied query params before letting them reach the
  // SQL builder. Untrusted callers can hit this with a valid API key, so a
  // bogus status enum or malformed `since` should 400 fast rather than
  // turn into a runtime SQL error or a misleading empty result set.
  const STATUS_VALUES = ["scheduled", "live", "final"] as const;
  const rawStatus = sp.get("status");
  const status = rawStatus && (STATUS_VALUES as readonly string[]).includes(rawStatus)
    ? (rawStatus as (typeof STATUS_VALUES)[number])
    : null;
  if (rawStatus && !status) {
    return NextResponse.json(
      { error: `status must be one of ${STATUS_VALUES.join(", ")}` },
      { status: 400 }
    );
  }
  const rawSince = sp.get("since");
  let since: string | null = null;
  if (rawSince) {
    const t = Date.parse(rawSince);
    if (!Number.isFinite(t)) {
      return NextResponse.json(
        { error: "since must be an ISO-8601 timestamp" },
        { status: 400 }
      );
    }
    since = new Date(t).toISOString();
  }
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 100, 1), 500);
  try {
    const filters = [];
    if (status) filters.push(eq(games.status, status));
    if (since) filters.push(gte(games.scheduledTime, since));
    const rows = await db
      .select({
        id: games.id,
        homeTeam: games.homeTeam,
        awayTeam: games.awayTeam,
        court: games.court,
        division: games.division,
        eventName: games.eventName,
        scheduledTime: games.scheduledTime,
        status: games.status,
      })
      .from(games)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(games.scheduledTime))
      .limit(limit);

    return NextResponse.json({ data: rows, count: rows.length });
  } catch (err) {
    logger.error("v1 games failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

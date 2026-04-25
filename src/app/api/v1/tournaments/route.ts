import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { verifyApiKey, checkApiKeyRateLimit } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// GET /api/v1/tournaments?status=upcoming
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
  const status = sp.get("status");
  const limit = Math.min(Number(sp.get("limit")) || 50, 200);
  try {
    const rows = await db
      .select()
      .from(tournaments)
      .where(status ? eq(tournaments.status, status as "draft" | "published" | "active" | "completed") : undefined)
      .orderBy(desc(tournaments.startDate))
      .limit(limit);
    return NextResponse.json({ data: rows, count: rows.length });
  } catch (err) {
    logger.error("v1 tournaments failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

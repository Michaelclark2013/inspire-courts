import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { verifyApiKey, checkApiKeyRateLimit } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// GET /api/v1/members?status=active&limit=100
// Public API. Requires `Authorization: Bearer ic_...` header.
// Read-scoped — returns the same projection regardless of scope (no
// PII like phone/email returned to read-only keys; expand later).
export async function GET(request: NextRequest) {
  const auth = await verifyApiKey(request.headers.get("authorization"));
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rl = checkApiKeyRateLimit(auth.id);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }
  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  const limit = Math.min(Number(sp.get("limit")) || 100, 1000);
  const includeContact = auth.scopes.includes("write") || auth.scopes.includes("read:contact");
  try {
    const rows = await db
      .select({
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        status: members.status,
        joinedAt: members.joinedAt,
        membershipPlanId: members.membershipPlanId,
        ...(includeContact ? { email: members.email, phone: members.phone } : {}),
      })
      .from(members)
      .where(status ? eq(members.status, status as "active") : undefined)
      .orderBy(desc(members.createdAt))
      .limit(limit);
    return NextResponse.json({ data: rows, count: rows.length });
  } catch (err) {
    logger.error("v1 members failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

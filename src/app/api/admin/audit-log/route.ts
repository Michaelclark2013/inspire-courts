import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { and, desc, eq, lt, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";

// Cap how many rows a single request can pull regardless of ?limit — keeps
// a malicious or buggy client from dumping the entire log in one hit.
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

// GET /api/admin/audit-log — paginated audit-log read (admin only).
//   ?entityType=user|tournament|tournament_registration
//   ?action=user.deleted | tournament.bracket_generated | ...
//   ?actorUserId=123
//   ?limit=50 (max 200)
//   ?before=<ISO timestamp>  (cursor for older-than pagination)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // Audit log is admin-only by design — it may contain PII in before/after
  // snapshots and is the source of truth for compliance questions.
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;

  const entityType = sp.get("entityType");
  const action = sp.get("action");
  const actorUserIdRaw = sp.get("actorUserId");
  const limitRaw = sp.get("limit");
  const before = sp.get("before");

  const limit = (() => {
    const n = Number(limitRaw);
    if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
    return Math.min(Math.floor(n), MAX_LIMIT);
  })();

  const filters: SQL[] = [];
  if (entityType) filters.push(eq(auditLog.entityType, entityType));
  if (action) filters.push(eq(auditLog.action, action));
  if (actorUserIdRaw) {
    const actorUserId = Number(actorUserIdRaw);
    if (Number.isFinite(actorUserId) && actorUserId > 0) {
      filters.push(eq(auditLog.actorUserId, actorUserId));
    }
  }
  if (before) filters.push(lt(auditLog.createdAt, before));

  try {
    const where = filters.length > 0 ? and(...filters) : undefined;
    const rows = await db
      .select()
      .from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit + 1); // fetch one extra to detect whether more exist

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1].createdAt : null;

    return NextResponse.json(
      {
        items,
        nextCursor,
        limit,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    logger.error("Failed to fetch audit log", { error: String(err) });
    return NextResponse.json(
      { error: "Failed to fetch audit log" },
      { status: 500 }
    );
  }
}

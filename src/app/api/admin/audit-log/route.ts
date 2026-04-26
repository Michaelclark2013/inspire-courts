import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { and, desc, eq, gte, like, lt, sql, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { canAccess } from "@/lib/permissions";
import { withTiming } from "@/lib/timing";
import { csvCell, csvBody } from "@/lib/api-helpers";

// Cap how many rows a single request can pull regardless of ?limit — keeps
// a malicious or buggy client from dumping the entire log in one hit.
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

// GET /api/admin/audit-log — paginated audit-log read (admin only).
//   ?entityType=user|tournament|tournament_registration
//   ?entityId=42              narrow to a single entity (requires entityType
//                             to be useful, but not enforced so callers can
//                             search loosely)
//   ?action=user.deleted | tournament.bracket_generated | ...
//   ?actorUserId=123
//   ?limit=50 (max 200)
//   ?before=<ISO timestamp>  (cursor for older-than pagination)
//   ?since=<ISO timestamp>   (lower bound — audit-log incident triage:
//                              "everything since the deploy at 14:00")
//   ?format=csv              Download ALL matching rows (up to 10_000) as
//                             CSV — bypasses the pagination cap for
//                             compliance / export workflows. Ignores
//                             ?limit and ?before.
export const GET = withTiming("admin.audit_log", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  // Audit log is admin-only by design — it may contain PII in before/after
  // snapshots and is the source of truth for compliance questions.
  if (!session?.user?.role || !canAccess(session.user.role, "audit_log")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;

  const entityType = sp.get("entityType");
  const entityId = sp.get("entityId");
  const action = sp.get("action");
  const actorUserIdRaw = sp.get("actorUserId");
  const actorEmailRaw = sp.get("actorEmail");
  const limitRaw = sp.get("limit");
  const before = sp.get("before");
  const since = sp.get("since");

  const limit = (() => {
    const n = Number(limitRaw);
    if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
    return Math.min(Math.floor(n), MAX_LIMIT);
  })();

  const filters: SQL[] = [];
  if (entityType) filters.push(eq(auditLog.entityType, entityType));
  if (entityId) filters.push(eq(auditLog.entityId, String(entityId)));
  if (action) filters.push(eq(auditLog.action, action));
  if (actorUserIdRaw) {
    const actorUserId = Number(actorUserIdRaw);
    if (Number.isFinite(actorUserId) && actorUserId > 0) {
      filters.push(eq(auditLog.actorUserId, actorUserId));
    }
  }
  if (actorEmailRaw) {
    // Substring LIKE so admins can filter by partial email — they
    // type "sarah" and find every action by sarah@inspirecourts.com.
    // Escape SQL LIKE wildcards in the user input first.
    const safe = actorEmailRaw.slice(0, 100).replace(/[\\%_]/g, "\\$&");
    filters.push(like(auditLog.actorEmail, `%${safe}%`));
  }
  // before/since are stored as ISO strings (text column), so a clean
  // ISO compares lexicographically. Validate before pushing into the
  // query — a bare "yesterday" string would still execute and just
  // return zero rows, which is confusing.
  if (before && !Number.isNaN(new Date(before).getTime())) {
    filters.push(lt(auditLog.createdAt, before));
  }
  if (since && !Number.isNaN(new Date(since).getTime())) {
    filters.push(gte(auditLog.createdAt, since));
  }

  const format = sp.get("format");

  try {
    const where = filters.length > 0 ? and(...filters) : undefined;

    if (format === "csv") {
      // Hard cap at 10_000 rows so a broad filter can't download the
      // whole table; admins needing more can narrow their filters.
      const CSV_MAX = 10_000;
      const csvRows = await db
        .select()
        .from(auditLog)
        .where(where)
        .orderBy(desc(auditLog.createdAt))
        .limit(CSV_MAX);

      const header = [
        "id",
        "createdAt",
        "actorUserId",
        "actorEmail",
        "actorRole",
        "action",
        "entityType",
        "entityId",
        "beforeJson",
        "afterJson",
      ];
      // csvCell + csvBody (in lib/api-helpers) keep this download
      // Excel-compat: formula-injection prefix on cells, CRLF row
      // terminators, and a UTF-8 BOM. Same helpers used by every
      // other admin CSV endpoint.
      const lines = [
        header.map(csvCell).join(","),
        ...csvRows.map((r) =>
          [
            r.id,
            r.createdAt,
            r.actorUserId,
            r.actorEmail,
            r.actorRole,
            r.action,
            r.entityType,
            r.entityId,
            r.beforeJson,
            r.afterJson,
          ]
            .map(csvCell)
            .join(",")
        ),
      ];
      return new NextResponse(csvBody(lines), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
          "Cache-Control": "no-store",
          // Let edge compressors vary their response correctly and hint
          // that gzip is welcome. 10k-row audit dumps are multiple MB.
          Vary: "Accept-Encoding",
          ...(csvRows.length === CSV_MAX ? { "X-Row-Cap-Reached": "true" } : {}),
        },
      });
    }
    // Fetch page + 1 for cursor detection, and total count in parallel so
    // the UI can show "X of Y".
    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(auditLog)
        .where(where)
        .orderBy(desc(auditLog.createdAt))
        .limit(limit + 1),
      db.select({ total: sql<number>`count(*)` }).from(auditLog).where(where),
    ]);

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1].createdAt : null;

    return NextResponse.json(
      {
        // `data` matches the convention used by every other admin list GET;
        // `items` is kept as an alias for any existing callers until they
        // migrate.
        data,
        items: data,
        total: Number(total) || 0,
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
});

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { and, desc, gte, sql, type SQL } from "drizzle-orm";
import { canAccess } from "@/lib/permissions";
import { logger } from "@/lib/logger";
import { withTiming } from "@/lib/timing";

// GET /api/admin/audit-log/stats
//
// Aggregation view over the audit log — the two most common compliance
// / anomaly-detection queries:
//   - top actors by action count
//   - most-mutated entities (by entityType + entityId)
//   - action histogram
//
// Optional window: ?since=<ISO timestamp> to narrow to "last N days".
// Default window is the last 30 days to keep the aggregation cheap.
export const GET = withTiming("admin.audit_stats", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "audit_log")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const sinceParam = sp.get("since");
  const defaultSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since = sinceParam || defaultSince;

  const filters: SQL[] = [gte(auditLog.createdAt, since)];
  const where = and(...filters);

  try {
    const [topActors, topEntities, actionHistogram, [{ total }]] = await Promise.all([
      // Top 10 actors by count
      db
        .select({
          actorUserId: auditLog.actorUserId,
          actorEmail: auditLog.actorEmail,
          actorRole: auditLog.actorRole,
          count: sql<number>`count(*)`,
        })
        .from(auditLog)
        .where(where)
        .groupBy(auditLog.actorUserId, auditLog.actorEmail, auditLog.actorRole)
        .orderBy(desc(sql`count(*)`))
        .limit(10),

      // Top 10 most-mutated entities
      db
        .select({
          entityType: auditLog.entityType,
          entityId: auditLog.entityId,
          count: sql<number>`count(*)`,
        })
        .from(auditLog)
        .where(where)
        .groupBy(auditLog.entityType, auditLog.entityId)
        .orderBy(desc(sql`count(*)`))
        .limit(10),

      // Action histogram — counts per action slug
      db
        .select({ action: auditLog.action, count: sql<number>`count(*)` })
        .from(auditLog)
        .where(where)
        .groupBy(auditLog.action)
        .orderBy(desc(sql`count(*)`)),

      db.select({ total: sql<number>`count(*)` }).from(auditLog).where(where),
    ]);

    return NextResponse.json(
      {
        since,
        total: Number(total) || 0,
        topActors: topActors.map((r) => ({ ...r, count: Number(r.count) })),
        topEntities: topEntities.map((r) => ({ ...r, count: Number(r.count) })),
        actionHistogram: actionHistogram.map((r) => ({ ...r, count: Number(r.count) })),
      },
      { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
    );
  } catch (err) {
    logger.error("Failed to fetch audit stats", { error: String(err) });
    return NextResponse.json({ error: "Failed to fetch audit stats" }, { status: 500 });
  }
});

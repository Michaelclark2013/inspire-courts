import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/permissions/[userId]/history
// Returns the audit log entries for permission changes that affected
// this user (their own overrides + bulk actions that included them).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId: userIdStr } = await params;
  const userId = Number(userIdStr);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    // Individual-user action rows land in audit_log with entityType =
    // "user_permission" and entityId = permission row id. We don't
    // have a reliable backref from entityId → userId for historical
    // rows, so we filter by action name + a LIKE on the JSON "after"
    // field which always contains the userId we care about.
    const rows = await db
      .select()
      .from(auditLog)
      .where(
        and(
          inArray(auditLog.action, [
            "permission.granted",
            "permission.revoked",
            "permission.override_cleared",
            "permission.reset_user",
            "permission.bulk_granted",
            "permission.bulk_revoked",
            "permission.bulk_cleared",
            "permission.copied",
          ]),
          or(
            // Per-user entries have entityId = permission row id, so
            // we match on the JSON blob containing this user id.
            sql`json_extract(${auditLog.afterJson}, '$.userId') = ${userId}`,
            sql`json_extract(${auditLog.beforeJson}, '$.userId') = ${userId}`,
            // Bulk entries store userIds as a JSON array; SQLite's
            // json_each works for the presence check.
            sql`exists (select 1 from json_each(json_extract(${auditLog.afterJson}, '$.userIds')) where value = ${userId})`,
            sql`exists (select 1 from json_each(json_extract(${auditLog.beforeJson}, '$.userIds')) where value = ${userId})`,
            // Targeted copy rows keep the target id in targetId.
            sql`json_extract(${auditLog.afterJson}, '$.targetId') = ${userId}`,
            // Reset-user rows put the user id in entityId directly.
            and(eq(auditLog.action, "permission.reset_user"), eq(auditLog.entityId, String(userId)))
          )
        )
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(50);

    return NextResponse.json(rows, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    logger.error("permission history failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}

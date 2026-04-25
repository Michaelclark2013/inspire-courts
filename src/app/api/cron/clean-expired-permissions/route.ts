import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userPermissions, users, auditLog } from "@/lib/db/schema";
import { and, inArray, isNotNull, lt } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { requireCronSecret } from "@/lib/api-helpers";

// GET /api/cron/clean-expired-permissions
// Scheduled task (daily) that deletes per-user permission overrides
// whose expiresAt has passed. Bumps permissions_updated_at on every
// affected user so their next request picks up the reverted state.
//
// Auth: requires CRON_SECRET via Authorization: Bearer or x-cron-secret.
export async function GET(request: NextRequest) {
  const fail = requireCronSecret(request);
  if (fail) return fail;
  try {
    const nowIso = new Date().toISOString();

    // Fetch expired rows so we can bump the user stamps after delete.
    const expired = await db
      .select({ id: userPermissions.id, userId: userPermissions.userId, page: userPermissions.page })
      .from(userPermissions)
      .where(
        and(
          isNotNull(userPermissions.expiresAt),
          lt(userPermissions.expiresAt, nowIso)
        )
      );

    if (expired.length === 0) {
      return NextResponse.json({ ok: true, removed: 0 });
    }

    const expiredIds = expired.map((e) => e.id);
    const affectedUserIds = Array.from(new Set(expired.map((e) => e.userId)));

    await db.delete(userPermissions).where(inArray(userPermissions.id, expiredIds));

    // Bump stamp on affected users.
    await db
      .update(users)
      .set({ permissionsUpdatedAt: nowIso, updatedAt: nowIso })
      .where(inArray(users.id, affectedUserIds));

    // System-initiated audit entry (no session; actor fields null).
    // Audit insert errors are non-fatal — the cleanup itself succeeded —
    // but they need to surface in logs so a missing audit trail can be
    // investigated (compliance + forensics).
    try {
      await db.insert(auditLog).values({
        actorUserId: null,
        actorEmail: "system:cron",
        actorRole: "system",
        action: "permission.auto_expired",
        entityType: "user_permission",
        entityId: "0",
        beforeJson: null,
        afterJson: JSON.stringify({ removed: expired.length, users: affectedUserIds.length }),
      });
    } catch (auditErr) {
      logger.warn("clean-expired-permissions: audit insert failed (cleanup succeeded)", {
        error: String(auditErr),
        removed: expired.length,
        users: affectedUserIds.length,
      });
    }

    logger.info("Cleaned expired permission overrides", { removed: expired.length });
    return NextResponse.json({
      ok: true,
      removed: expired.length,
      users: affectedUserIds.length,
    });
  } catch (err) {
    logger.error("clean-expired-permissions cron failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

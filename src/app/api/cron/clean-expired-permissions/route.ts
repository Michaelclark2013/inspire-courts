import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userPermissions, users, auditLog } from "@/lib/db/schema";
import { and, inArray, isNotNull, lt } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/cron/clean-expired-permissions
// Scheduled task (daily) that deletes per-user permission overrides
// whose expiresAt has passed. Bumps permissions_updated_at on every
// affected user so their next request picks up the reverted state.
//
// Auth: requires x-cron-secret header matching CRON_SECRET env var.
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret") || request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
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
    } catch { /* don't let audit failure break the cron */ }

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

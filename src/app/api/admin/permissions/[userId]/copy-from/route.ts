import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userPermissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { bumpPermissionsUpdated } from "@/lib/permission-bump";

// POST /api/admin/permissions/[userId]/copy-from
// Body: { sourceUserId: number, replace?: boolean }
// Copies every override from source → target.
//   replace=true  → clears the target's existing overrides first
//   replace=false → merges (source wins on conflicts)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId: userIdStr } = await params;
  const targetId = Number(userIdStr);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const sourceId = Number(body?.sourceUserId);
    const replace = !!body?.replace;
    if (!Number.isInteger(sourceId) || sourceId <= 0) {
      return NextResponse.json({ error: "Invalid sourceUserId" }, { status: 400 });
    }
    if (sourceId === targetId) {
      return NextResponse.json({ error: "Source and target are the same user" }, { status: 400 });
    }

    // Confirm both exist.
    const [[target], [source]] = await Promise.all([
      db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, targetId)).limit(1),
      db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, sourceId)).limit(1),
    ]);
    if (!target) return NextResponse.json({ error: "Target not found" }, { status: 404 });
    if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });

    const sourceOverrides = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, sourceId));

    if (replace) {
      await db.delete(userPermissions).where(eq(userPermissions.userId, targetId));
    }

    // Snapshot the target's existing overrides once so per-page upserts
    // stay in memory (avoids a round-trip per page).
    const targetExisting = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, targetId));
    const targetByPage = new Map(targetExisting.map((r) => [r.page, r]));

    let copied = 0;
    const actorId = Number(session.user.id);
    for (const o of sourceOverrides) {
      const hit = targetByPage.get(o.page);
      if (hit) {
        await db
          .update(userPermissions)
          .set({
            granted: o.granted,
            reason: o.reason ? `Copied: ${o.reason}` : "Copied from another user",
            grantedBy: actorId,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(userPermissions.id, hit.id));
      } else {
        await db.insert(userPermissions).values({
          userId: targetId,
          page: o.page,
          granted: o.granted,
          reason: o.reason ? `Copied: ${o.reason}` : "Copied from another user",
          grantedBy: actorId,
        });
      }
      copied++;
    }

    await recordAudit({
      session,
      request,
      action: "permission.copied",
      entityType: "user_permission",
      entityId: targetId,
      before: null,
      after: { sourceId, targetId, copied, replace },
    });

    await bumpPermissionsUpdated(targetId);
    return NextResponse.json({ ok: true, copied });
  } catch (err) {
    logger.error("permission copy failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to copy permissions" }, { status: 500 });
  }
}

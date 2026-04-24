import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userPermissions } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { ALL_ADMIN_PAGES, type AdminPage } from "@/lib/permissions";

// POST /api/admin/permissions/bulk
// Body: {
//   userIds: number[],         // target users
//   pages: AdminPage[],         // which pages to affect
//   action: "grant" | "revoke" | "clear",
//   reason?: string,
// }
// Applies the same change across every (userId, page) pair. Useful for
// "give all staff access to /admin/scores" or "revoke /admin/payroll
// from these 3 users".
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const userIds = Array.isArray(body?.userIds)
      ? body.userIds.map(Number).filter((n: number) => Number.isInteger(n) && n > 0)
      : [];
    const pages: AdminPage[] = Array.isArray(body?.pages)
      ? body.pages.filter((p: string) => (ALL_ADMIN_PAGES as string[]).includes(p))
      : [];
    const action: "grant" | "revoke" | "clear" = body?.action;
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) || null : null;
    const expiresAt = typeof body?.expiresAt === "string" && body.expiresAt ? body.expiresAt : null;

    if (userIds.length === 0) {
      return NextResponse.json({ error: "No users selected" }, { status: 400 });
    }
    if (pages.length === 0) {
      return NextResponse.json({ error: "No pages selected" }, { status: 400 });
    }
    if (!["grant", "revoke", "clear"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const actorId = Number(session.user.id);
    const nowIso = new Date().toISOString();

    // Confirm target users exist so we don't blindly insert orphan rows.
    const targets = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(inArray(users.id, userIds));
    const targetIds = targets.map((t) => t.id);

    if (action === "clear") {
      const removed = await db
        .delete(userPermissions)
        .where(
          and(
            inArray(userPermissions.userId, targetIds),
            inArray(userPermissions.page, pages)
          )
        )
        .returning();
      await recordAudit({
        session,
        request,
        action: "permission.bulk_cleared",
        entityType: "user_permission",
        entityId: 0,
        before: { userIds: targetIds, pages, count: removed.length },
        after: null,
      });
      return NextResponse.json({ ok: true, cleared: removed.length });
    }

    // Grant / revoke → upsert each pair.
    const granted = action === "grant";
    // Self-protect: admin cannot bulk-revoke their own /admin/users access.
    const filteredIds = granted
      ? targetIds
      : targetIds.filter((id) => !(id === actorId && pages.includes("users")));

    let touched = 0;
    for (const uid of filteredIds) {
      for (const page of pages) {
        const [existing] = await db
          .select()
          .from(userPermissions)
          .where(and(eq(userPermissions.userId, uid), eq(userPermissions.page, page)))
          .limit(1);
        if (existing) {
          await db
            .update(userPermissions)
            .set({ granted, reason, expiresAt, grantedBy: actorId, updatedAt: nowIso })
            .where(eq(userPermissions.id, existing.id));
        } else {
          await db.insert(userPermissions).values({
            userId: uid,
            page,
            granted,
            reason,
            expiresAt,
            grantedBy: actorId,
          });
        }
        touched++;
      }
    }

    await recordAudit({
      session,
      request,
      action: granted ? "permission.bulk_granted" : "permission.bulk_revoked",
      entityType: "user_permission",
      entityId: 0,
      before: null,
      after: { userIds: filteredIds, pages, touched, reason },
    });

    return NextResponse.json({ ok: true, touched });
  } catch (err) {
    logger.error("bulk permission failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to apply bulk change" }, { status: 500 });
  }
}

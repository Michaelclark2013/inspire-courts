import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userPermissions } from "@/lib/db/schema";
import { and, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { bumpPermissionsUpdated } from "@/lib/permission-bump";
import { ALL_ADMIN_PAGES, type AdminPage } from "@/lib/permissions";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

// Hard cap on a single bulk request. Each (user, page) pair triggers
// 1–2 sequential queries; without a cap a malformed UI submission could
// generate hundreds of thousands of writes and stall the DB.
const MAX_USERS = 500;
const MAX_PAGES = 50;

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

  // Throttle bulk writes per IP — a misbehaving UI could otherwise
  // spam several hundred mutations a second.
  const ip = getClientIp(request);
  if (isRateLimited(`admin-perm-bulk:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many bulk operations. Slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
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
    if (userIds.length > MAX_USERS) {
      return NextResponse.json({ error: `Too many users in one request (max ${MAX_USERS}).` }, { status: 413 });
    }
    if (pages.length > MAX_PAGES) {
      return NextResponse.json({ error: `Too many pages in one request (max ${MAX_PAGES}).` }, { status: 413 });
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
      await bumpPermissionsUpdated(targetIds);
      return NextResponse.json({ ok: true, cleared: removed.length });
    }

    // Grant / revoke → upsert each pair.
    const granted = action === "grant";
    // Self-protect: admin cannot bulk-revoke their own /admin/users access.
    const filteredIds = granted
      ? targetIds
      : targetIds.filter((id) => !(id === actorId && pages.includes("users")));

    // Fetch every (userId, page) row that already exists for this batch
    // in ONE query, instead of one SELECT per pair. Then we know which
    // pairs need INSERT vs UPDATE without further round-trips.
    const existingRows = filteredIds.length === 0
      ? []
      : await db
          .select({ id: userPermissions.id, userId: userPermissions.userId, page: userPermissions.page })
          .from(userPermissions)
          .where(
            and(
              inArray(userPermissions.userId, filteredIds),
              inArray(userPermissions.page, pages)
            )
          );
    const existingByPair = new Map<string, number>(
      existingRows.map((r) => [`${r.userId}:${r.page}`, r.id])
    );

    const toInsert: Array<{
      userId: number;
      page: AdminPage;
      granted: boolean;
      reason: string | null;
      expiresAt: string | null;
      grantedBy: number;
    }> = [];
    const updateIds: number[] = [];
    for (const uid of filteredIds) {
      for (const page of pages) {
        const id = existingByPair.get(`${uid}:${page}`);
        if (id) {
          updateIds.push(id);
        } else {
          toInsert.push({ userId: uid, page, granted, reason, expiresAt, grantedBy: actorId });
        }
      }
    }

    if (updateIds.length > 0) {
      // Single batched UPDATE — every existing pair gets the same
      // granted/reason/expiresAt regardless of which user/page it is.
      await db
        .update(userPermissions)
        .set({ granted, reason, expiresAt, grantedBy: actorId, updatedAt: nowIso })
        .where(inArray(userPermissions.id, updateIds));
    }
    if (toInsert.length > 0) {
      await db.insert(userPermissions).values(toInsert);
    }
    const touched = updateIds.length + toInsert.length;

    await recordAudit({
      session,
      request,
      action: granted ? "permission.bulk_granted" : "permission.bulk_revoked",
      entityType: "user_permission",
      entityId: 0,
      before: null,
      after: { userIds: filteredIds, pages, touched, reason },
    });

    await bumpPermissionsUpdated(filteredIds);
    return NextResponse.json({ ok: true, touched });
  } catch (err) {
    logger.error("bulk permission failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to apply bulk change" }, { status: 500 });
  }
}

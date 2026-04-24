import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userPermissions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import {
  ALL_ADMIN_PAGES,
  effectivePermissions,
  type AdminPage,
} from "@/lib/permissions";
import type { UserRole } from "@/types/next-auth";

// Helper: validate page string against the AdminPage union.
function isValidPage(p: string): p is AdminPage {
  return (ALL_ADMIN_PAGES as string[]).includes(p);
}

// GET /api/admin/permissions/[userId]
// Returns the target user + their override rows + the full effective
// matrix (role default merged with overrides) for the UI to render.
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
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        approved: users.approved,
        photoUrl: users.photoUrl,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const overrides = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    const effective = effectivePermissions(
      user.role as UserRole,
      overrides.map((o) => ({
        page: o.page as AdminPage,
        granted: o.granted,
      }))
    );

    return NextResponse.json(
      { user, overrides, effective },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("permissions fetch failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// PUT /api/admin/permissions/[userId]
// Body: { page: AdminPage, granted: boolean | null, reason?: string }
//   - granted = true  → explicit grant (override role default)
//   - granted = false → explicit revoke (override role default)
//   - granted = null  → clear override (fall back to role default)
// Records an audit entry on every change.
export async function PUT(
  request: NextRequest,
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
    const body = await request.json();
    const page = String(body?.page || "");
    if (!isValidPage(page)) {
      return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    }
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) || null : null;
    // Optional ISO-8601 expiry — override lapses after this moment.
    const expiresAt = typeof body?.expiresAt === "string" && body.expiresAt
      ? body.expiresAt
      : null;

    // Look up the target to confirm existence + capture role for audit.
    const [user] = await db
      .select({ id: users.id, role: users.role, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Self-protect: main admin cannot revoke their own admin-only access
    // (otherwise they could lock themselves out of /admin/permissions).
    if (userId === Number(session.user.id) && user.role === "admin" && body?.granted === false) {
      return NextResponse.json(
        { error: "You can't revoke your own admin access" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(userPermissions)
      .where(and(eq(userPermissions.userId, userId), eq(userPermissions.page, page)))
      .limit(1);

    // granted === null → delete the override (back to role default).
    if (body?.granted === null || body?.granted === undefined) {
      if (existing) {
        await db.delete(userPermissions).where(eq(userPermissions.id, existing.id));
        await recordAudit({
          session,
          request,
          action: "permission.override_cleared",
          entityType: "user_permission",
          entityId: existing.id,
          before: { userId, page, granted: existing.granted },
          after: null,
        });
      }
      return NextResponse.json({ ok: true, cleared: true });
    }

    const granted = Boolean(body.granted);
    let result;
    if (existing) {
      [result] = await db
        .update(userPermissions)
        .set({
          granted,
          reason,
          expiresAt,
          grantedBy: Number(session.user.id),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userPermissions.id, existing.id))
        .returning();
      await recordAudit({
        session,
        request,
        action: granted ? "permission.granted" : "permission.revoked",
        entityType: "user_permission",
        entityId: result.id,
        before: { granted: existing.granted, expiresAt: existing.expiresAt },
        after: { granted, reason, expiresAt },
      });
    } else {
      [result] = await db
        .insert(userPermissions)
        .values({
          userId,
          page,
          granted,
          reason,
          expiresAt,
          grantedBy: Number(session.user.id),
        })
        .returning();
      await recordAudit({
        session,
        request,
        action: granted ? "permission.granted" : "permission.revoked",
        entityType: "user_permission",
        entityId: result.id,
        before: null,
        after: { userId, page, granted, reason, expiresAt },
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    logger.error("permission update failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/admin/permissions/[userId] — clear ALL overrides for
// this user (bulk reset to role defaults).
export async function DELETE(
  request: NextRequest,
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
    const removed = await db
      .delete(userPermissions)
      .where(eq(userPermissions.userId, userId))
      .returning();
    await recordAudit({
      session,
      request,
      action: "permission.reset_user",
      entityType: "user_permission",
      entityId: userId,
      before: { count: removed.length },
      after: null,
    });
    return NextResponse.json({ ok: true, cleared: removed.length });
  } catch (err) {
    logger.error("permission bulk delete failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
  }
}

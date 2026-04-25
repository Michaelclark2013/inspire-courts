import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { permissionTemplates, userPermissions, users } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { bumpPermissionsUpdated } from "@/lib/permission-bump";
import { ALL_ADMIN_PAGES, type AdminPage } from "@/lib/permissions";

// POST /api/admin/permissions/templates/[id]/apply
// Body: {
//   userIds: number[],
//   overrideDurationDays?: number | null,  // null = use template default
//   reason?: string,
// }
// Applies every (page, granted) pair in the template to each user.
// Duration: explicit param wins > template default > permanent.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const userIds: number[] = Array.isArray(body?.userIds)
      ? body.userIds.map(Number).filter((n: number) => Number.isInteger(n) && n > 0)
      : [];
    if (userIds.length === 0) {
      return NextResponse.json({ error: "No users selected" }, { status: 400 });
    }
    // Same upper bound as /api/admin/permissions/bulk — keeps a single
    // request from spawning hundreds of thousands of upserts.
    if (userIds.length > 500) {
      return NextResponse.json({ error: "Too many users in one request (max 500)." }, { status: 413 });
    }

    const [template] = await db
      .select()
      .from(permissionTemplates)
      .where(eq(permissionTemplates.id, id))
      .limit(1);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Parse the page bundle.
    let pages: Array<{ page: AdminPage; granted: boolean }>;
    try {
      const raw = JSON.parse(template.pagesJson || "[]");
      pages = (Array.isArray(raw) ? raw : []).filter(
        (p: unknown): p is { page: AdminPage; granted: boolean } =>
          !!p &&
          typeof p === "object" &&
          typeof (p as { page?: unknown }).page === "string" &&
          (ALL_ADMIN_PAGES as string[]).includes((p as { page: string }).page) &&
          typeof (p as { granted?: unknown }).granted === "boolean"
      );
    } catch {
      pages = [];
    }
    if (pages.length === 0) {
      return NextResponse.json({ error: "Template has no pages" }, { status: 400 });
    }

    // Resolve expiry.
    const durationDays =
      "overrideDurationDays" in body && body.overrideDurationDays !== null && Number.isFinite(Number(body.overrideDurationDays))
        ? Number(body.overrideDurationDays)
        : template.defaultDurationDays ?? null;
    let expiresAt: string | null = null;
    if (durationDays && durationDays > 0) {
      const d = new Date();
      d.setDate(d.getDate() + durationDays);
      expiresAt = d.toISOString();
    }

    const reason =
      (typeof body?.reason === "string" && body.reason.trim()) ||
      `Applied template: ${template.name}`;

    // Confirm users exist.
    const targets = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, userIds));
    const targetIds = targets.map((t) => t.id);
    const actorId = Number(session.user.id);
    const nowIso = new Date().toISOString();

    // Batch the work: 1 SELECT to find existing rows, then group
    // existing IDs by their target `granted` value so we can issue at
    // most 2 UPDATEs (granted=true / granted=false) plus 1 INSERT for
    // missing pairs. Old loop ran 2N×M queries.
    const pagePaths = pages.map((p) => p.page);
    const existingRows = targetIds.length === 0
      ? []
      : await db
          .select({ id: userPermissions.id, userId: userPermissions.userId, page: userPermissions.page })
          .from(userPermissions)
          .where(
            and(
              inArray(userPermissions.userId, targetIds),
              inArray(userPermissions.page, pagePaths)
            )
          );
    const existingByPair = new Map<string, number>(
      existingRows.map((r) => [`${r.userId}:${r.page}`, r.id])
    );

    const updateGrant: number[] = [];
    const updateRevoke: number[] = [];
    const toInsert: Array<{
      userId: number;
      page: AdminPage;
      granted: boolean;
      reason: string;
      expiresAt: string | null;
      grantedBy: number;
    }> = [];
    for (const uid of targetIds) {
      for (const p of pages) {
        const id = existingByPair.get(`${uid}:${p.page}`);
        if (id) {
          (p.granted ? updateGrant : updateRevoke).push(id);
        } else {
          toInsert.push({
            userId: uid,
            page: p.page,
            granted: p.granted,
            reason,
            expiresAt,
            grantedBy: actorId,
          });
        }
      }
    }

    if (updateGrant.length > 0) {
      await db
        .update(userPermissions)
        .set({ granted: true, reason, expiresAt, grantedBy: actorId, updatedAt: nowIso })
        .where(inArray(userPermissions.id, updateGrant));
    }
    if (updateRevoke.length > 0) {
      await db
        .update(userPermissions)
        .set({ granted: false, reason, expiresAt, grantedBy: actorId, updatedAt: nowIso })
        .where(inArray(userPermissions.id, updateRevoke));
    }
    if (toInsert.length > 0) {
      await db.insert(userPermissions).values(toInsert);
    }
    const touched = updateGrant.length + updateRevoke.length + toInsert.length;

    await recordAudit({
      session,
      request,
      action: "permission.template_applied",
      entityType: "permission_template",
      entityId: id,
      before: null,
      after: { templateId: id, templateName: template.name, userIds: targetIds, pages: pages.length, expiresAt },
    });

    await bumpPermissionsUpdated(targetIds);
    return NextResponse.json({ ok: true, touched, expiresAt });
  } catch (err) {
    logger.error("template apply failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to apply" }, { status: 500 });
  }
}

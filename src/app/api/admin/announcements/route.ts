import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { lookupIdempotent, storeIdempotent } from "@/lib/idempotency";
import { announcementSchema, announcementUpdateSchema } from "@/lib/schemas";
import { parseJsonBody, apiNotFound, apiError } from "@/lib/api-helpers";

// Public surfaces that read announcements — any create/update/delete
// should bust these so admins see their change reflected immediately.
function revalidateAnnouncementSurfaces() {
  revalidatePath("/");
  revalidatePath("/portal");
  revalidatePath("/admin/announcements");
}

// GET /api/admin/announcements — list all
// Supports If-None-Match: admin UIs that poll will get a 304 when the
// list hasn't changed. ETag is derived from row count + newest
// createdAt, which is cheap to compute and captures every mutation.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const all = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));

    // Cheap ETag — count + newest timestamp changes on any insert/update/delete.
    const newest = all[0]?.createdAt ?? "";
    const etag = `"${all.length}-${newest}"`;

    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": "private, max-age=15, stale-while-revalidate=60" },
      });
    }

    return NextResponse.json(all, {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
        ETag: etag,
      },
    });
  } catch (err) {
    logger.error("Failed to fetch announcements", { error: String(err) });
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

// POST /api/admin/announcements — create
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate-limit creation. Announcements go to the public home + portal,
  // so a burst of inserts would bloat the UI and spam ISR revalidations.
  const ip = getClientIp(request);
  if (isRateLimited(`admin-announce:${ip}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many announcement attempts. Slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // Idempotency replay: same Idempotency-Key + same admin user = cached response.
  const idemKey = request.headers.get("idempotency-key");
  const cached = lookupIdempotent(session.user.id, idemKey);
  if (cached) {
    return NextResponse.json(cached.body, {
      status: cached.status,
      headers: { "Idempotent-Replay": "true" },
    });
  }

  // Clone the body so we can both validate the required fields via zod
  // AND pull the new optional fields directly. parseJsonBody consumes
  // the request stream, so we cache the JSON first.
  const rawBody = await request.clone().json().catch(() => ({}));
  const parsed = await parseJsonBody(request, announcementSchema);
  if (!parsed.ok) return parsed.response;
  const { title, body: content, audience, expiresAt } = parsed.data;
  const safeAudience = audience ?? "all";

  const PRIO = ["normal", "important", "urgent"] as const;
  const CAT = ["general", "tournament", "schedule", "maintenance", "safety", "weather", "celebration"] as const;
  const priority = PRIO.includes(rawBody?.priority) ? rawBody.priority : "normal";
  const category = CAT.includes(rawBody?.category) ? rawBody.category : "general";
  const pinned = !!rawBody?.pinned;
  const scheduledPublishAt = typeof rawBody?.scheduledPublishAt === "string" && rawBody.scheduledPublishAt
    ? rawBody.scheduledPublishAt
    : null;
  const ctaLabel = typeof rawBody?.ctaLabel === "string" ? rawBody.ctaLabel.trim() || null : null;
  const ctaUrl = typeof rawBody?.ctaUrl === "string" ? rawBody.ctaUrl.trim() || null : null;
  const imageUrl = typeof rawBody?.imageUrl === "string" ? rawBody.imageUrl.trim() || null : null;

  try {

    const userId = session.user.id ? Number(session.user.id) : null;

    const [announcement] = await db
      .insert(announcements)
      .values({
        title: title.trim(),
        body: content.trim(),
        audience: safeAudience,
        priority,
        category,
        pinned,
        scheduledPublishAt,
        ctaLabel,
        ctaUrl,
        imageUrl,
        createdBy: userId && !isNaN(userId) ? userId : null,
        expiresAt: expiresAt || null,
      })
      .returning();

    await recordAudit({
      session,
      request,
      action: "announcement.created",
      entityType: "announcement",
      entityId: announcement.id,
      before: null,
      after: {
        title: announcement.title,
        audience: announcement.audience,
        expiresAt: announcement.expiresAt,
      },
    });
    revalidateAnnouncementSurfaces();
    storeIdempotent(session.user.id, idemKey, announcement, 201);

    // Push notification fan-out on publish. Skip when scheduled for
    // a future time (scheduledPublishAt in the future) — a future
    // cron can pick those up. Non-blocking; errors land in the log.
    const schedFuture =
      announcement.scheduledPublishAt &&
      new Date(announcement.scheduledPublishAt).getTime() > Date.now();
    if (!schedFuture) {
      try {
        const { pushAnnouncement } = await import("@/lib/announcement-push");
        pushAnnouncement(announcement.id).catch((err) =>
          logger.warn("announcement push fan-out failed", { error: String(err) })
        );
      } catch (err) {
        logger.warn("announcement push import failed", { error: String(err) });
      }
    }

    return NextResponse.json(announcement, { status: 201 });
  } catch (err) {
    logger.error("Failed to create announcement", { error: String(err) });
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}

// PUT /api/admin/announcements — update existing announcement
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.clone().json().catch(() => ({}));
  const parsed = await parseJsonBody(request, announcementUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { id, title, body: content, audience, expiresAt } = parsed.data;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title.trim();
  if (content !== undefined) updates.body = content.trim();
  if (audience !== undefined) updates.audience = audience;
  if (expiresAt !== undefined) updates.expiresAt = expiresAt || null;

  // New extended fields — pull straight from the raw body since the
  // shared zod schema doesn't know about them yet.
  const PRIO = ["normal", "important", "urgent"] as const;
  const CAT = ["general", "tournament", "schedule", "maintenance", "safety", "weather", "celebration"] as const;
  if (PRIO.includes(rawBody?.priority)) updates.priority = rawBody.priority;
  if (CAT.includes(rawBody?.category)) updates.category = rawBody.category;
  if (typeof rawBody?.pinned === "boolean") updates.pinned = rawBody.pinned;
  if ("scheduledPublishAt" in (rawBody || {})) {
    updates.scheduledPublishAt = rawBody.scheduledPublishAt || null;
  }
  if ("ctaLabel" in (rawBody || {})) updates.ctaLabel = rawBody.ctaLabel || null;
  if ("ctaUrl" in (rawBody || {})) updates.ctaUrl = rawBody.ctaUrl || null;
  if ("imageUrl" in (rawBody || {})) updates.imageUrl = rawBody.imageUrl || null;
  updates.updatedAt = new Date().toISOString();

  if (Object.keys(updates).length === 0) {
    return apiError("No fields to update", 400);
  }

  try {
    // Snapshot BEFORE update so audit captures the previous values.
    const [before] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);

    if (!before) {
      return apiNotFound("Announcement not found");
    }

    const [updated] = await db
      .update(announcements)
      .set(updates)
      .where(eq(announcements.id, id))
      .returning();

    await recordAudit({
      session,
      request,
      action: "announcement.updated",
      entityType: "announcement",
      entityId: before.id,
      before: { title: before.title, audience: before.audience, expiresAt: before.expiresAt },
      after: updates,
    });

    revalidateAnnouncementSurfaces();
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update announcement", { error: String(err) });
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
  }
}

// DELETE /api/admin/announcements — delete by id
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const idParam = searchParams.get("id");
    const id = Number(idParam);
    if (!idParam || !Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Valid id required" }, { status: 400 });
    }

    const deleted = await db
      .delete(announcements)
      .where(eq(announcements.id, id))
      .returning({ id: announcements.id, title: announcements.title, audience: announcements.audience });
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }
    await recordAudit({
      session,
      request,
      action: "announcement.deleted",
      entityType: "announcement",
      entityId: deleted[0].id,
      before: { title: deleted[0].title, audience: deleted[0].audience },
      after: null,
    });
    revalidateAnnouncementSurfaces();
    return NextResponse.json({ success: true, id: deleted[0].id });
  } catch (err) {
    logger.error("Failed to delete announcement", { error: String(err) });
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}

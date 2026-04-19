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

  try {
    const body = await request.json();
    const { title, body: content, audience, expiresAt } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    if (typeof title !== "string" || title.length > 255) {
      return NextResponse.json({ error: "Title must be 255 characters or less" }, { status: 400 });
    }

    if (typeof content !== "string" || content.length > 10000) {
      return NextResponse.json({ error: "Body must be 10,000 characters or less" }, { status: 400 });
    }

    const validAudiences = ["all", "coaches", "parents"];
    const safeAudience = validAudiences.includes(audience) ? audience : "all";

    const userId = session.user.id ? Number(session.user.id) : null;

    const [announcement] = await db
      .insert(announcements)
      .values({
        title: title.trim(),
        body: content.trim(),
        audience: safeAudience,
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

  try {
    const body = await request.json();
    const { id, title, body: content, audience, expiresAt } = body;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "Valid id required" }, { status: 400 });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || title.length === 0 || title.length > 255) {
        return NextResponse.json({ error: "Title must be between 1 and 255 characters" }, { status: 400 });
      }
    }

    if (content !== undefined) {
      if (typeof content !== "string" || content.length === 0 || content.length > 10000) {
        return NextResponse.json({ error: "Body must be between 1 and 10,000 characters" }, { status: 400 });
      }
    }

    const validAudiences = ["all", "coaches", "parents"];
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.body = content.trim();
    if (audience !== undefined) updates.audience = validAudiences.includes(audience) ? audience : "all";
    if (expiresAt !== undefined) updates.expiresAt = expiresAt || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Snapshot BEFORE update so audit captures the previous values.
    const [before] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, Number(id)))
      .limit(1);

    if (!before) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(announcements)
      .set(updates)
      .where(eq(announcements.id, Number(id)))
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

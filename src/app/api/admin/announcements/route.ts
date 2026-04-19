import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

// Public surfaces that read announcements — any create/update/delete
// should bust these so admins see their change reflected immediately.
function revalidateAnnouncementSurfaces() {
  revalidatePath("/");
  revalidatePath("/portal");
  revalidatePath("/admin/announcements");
}

// GET /api/admin/announcements — list all
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const all = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));

    return NextResponse.json(all, {
      headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" },
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

    revalidateAnnouncementSurfaces();
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

    const [updated] = await db
      .update(announcements)
      .set(updates)
      .where(eq(announcements.id, Number(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

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
      .returning({ id: announcements.id });
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }
    revalidateAnnouncementSurfaces();
    return NextResponse.json({ success: true, id: deleted[0].id });
  } catch (err) {
    logger.error("Failed to delete announcement", { error: String(err) });
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}

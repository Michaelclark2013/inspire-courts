import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { gymEvents, GYM_EVENT_CATEGORIES } from "@/lib/db/schema";
import { and, gte, lte, asc, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/gym-events?from=ISO&to=ISO
// List events in a window (defaults to next 30 days).
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const defaultTo = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const from = searchParams.get("from") || defaultFrom;
    const to = searchParams.get("to") || defaultTo;

    const rows = await db
      .select()
      .from(gymEvents)
      .where(and(gte(gymEvents.endAt, from), lte(gymEvents.startAt, to)))
      .orderBy(asc(gymEvents.startAt));

    return NextResponse.json(rows, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    logger.error("gym-events list failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

// POST /api/admin/gym-events
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const category = GYM_EVENT_CATEGORIES.includes(body?.category)
      ? body.category
      : "other";
    const location = typeof body?.location === "string" ? body.location.trim() || null : null;
    const startAt = typeof body?.startAt === "string" ? body.startAt : "";
    const endAt = typeof body?.endAt === "string" ? body.endAt : "";
    const allDay = !!body?.allDay;
    const notes = typeof body?.notes === "string" ? body.notes.trim() || null : null;

    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
    if (!startAt || !endAt) {
      return NextResponse.json({ error: "Start and end required" }, { status: 400 });
    }
    if (new Date(endAt).getTime() < new Date(startAt).getTime()) {
      return NextResponse.json({ error: "End must be after start" }, { status: 400 });
    }

    const [created] = await db
      .insert(gymEvents)
      .values({
        title,
        category,
        location,
        startAt,
        endAt,
        allDay,
        notes,
        createdBy: Number(session.user.id),
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("gym-events create failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

// DELETE /api/admin/gym-events?id=123
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    // 404 on missing instead of silent no-op delete.
    const [existing] = await db.select({ id: gymEvents.id }).from(gymEvents).where(eq(gymEvents.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    await db.delete(gymEvents).where(eq(gymEvents.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("gym-events delete failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}

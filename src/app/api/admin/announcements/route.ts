import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

// GET /api/admin/announcements — list all
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt));

  return NextResponse.json(all);
}

// POST /api/admin/announcements — create
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json(announcement, { status: 201 });
}

// DELETE /api/admin/announcements — delete by id
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "Valid id required" }, { status: 400 });
  }

  await db.delete(announcements).where(eq(announcements.id, Number(id)));
  return NextResponse.json({ success: true });
}

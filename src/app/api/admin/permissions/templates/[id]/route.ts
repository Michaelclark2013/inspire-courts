import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { permissionTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { ALL_ADMIN_PAGES } from "@/lib/permissions";

export async function GET(
  _req: NextRequest,
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
  const [row] = await db.select().from(permissionTemplates).where(eq(permissionTemplates.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
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
    const update: Record<string, unknown> = {};
    if (typeof body?.name === "string") update.name = body.name.trim();
    if ("description" in body) update.description = body.description ? String(body.description).trim() || null : null;
    if (Array.isArray(body?.pages)) {
      const pages = body.pages.filter(
        (p: unknown) =>
          p &&
          typeof p === "object" &&
          typeof (p as { page?: unknown }).page === "string" &&
          (ALL_ADMIN_PAGES as string[]).includes((p as { page: string }).page) &&
          typeof (p as { granted?: unknown }).granted === "boolean"
      );
      update.pagesJson = JSON.stringify(pages);
    }
    if ("defaultDurationDays" in body) {
      const n = Number(body.defaultDurationDays);
      update.defaultDurationDays = Number.isFinite(n) && n > 0 ? n : null;
    }
    update.updatedAt = new Date().toISOString();

    const [updated] = await db
      .update(permissionTemplates)
      .set(update)
      .where(eq(permissionTemplates.id, id))
      .returning();
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("template patch failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
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
  await db.delete(permissionTemplates).where(eq(permissionTemplates.id, id));
  return NextResponse.json({ ok: true });
}

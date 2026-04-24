import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { permissionTemplates } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { ALL_ADMIN_PAGES } from "@/lib/permissions";

// GET /api/admin/permissions/templates — list templates.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const rows = await db
      .select()
      .from(permissionTemplates)
      .orderBy(asc(permissionTemplates.name));
    return NextResponse.json(rows, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    logger.error("templates list failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// POST /api/admin/permissions/templates — create template.
// Body: { name, description?, pages: [{page, granted}], defaultDurationDays? }
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const pages = Array.isArray(body?.pages)
      ? body.pages.filter(
          (p: unknown) =>
            p &&
            typeof p === "object" &&
            typeof (p as { page?: unknown }).page === "string" &&
            (ALL_ADMIN_PAGES as string[]).includes((p as { page: string }).page) &&
            typeof (p as { granted?: unknown }).granted === "boolean"
        )
      : [];

    const [created] = await db
      .insert(permissionTemplates)
      .values({
        name,
        description: typeof body?.description === "string" ? body.description.trim() || null : null,
        pagesJson: JSON.stringify(pages),
        defaultDurationDays: Number.isFinite(Number(body?.defaultDurationDays))
          ? Number(body.defaultDurationDays)
          : null,
        createdBy: Number(session.user.id),
      })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("template create failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

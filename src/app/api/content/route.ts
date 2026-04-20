import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getContent, saveContent } from "@/lib/content";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

export async function GET() {
  const content = await getContent();
  return NextResponse.json(content, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}

// Pages we revalidate on save. Adding a new admin-editable page to
// content.ts? Add its public route here so the save takes effect
// without waiting for ISR to expire.
const EDITABLE_PAGES = [
  "/",
  "/about",
  "/facility",
  "/training",
  "/schedule",
  "/gameday",
  "/events",
  "/teams",
  "/media",
  "/prep",
  "/gallery",
  "/contact",
];

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Light rate limit — saves write to the DB + revalidate ~12 ISR
  // entries. 30/min per IP is far above a human editing workflow.
  const ip = getClientIp(request);
  if (isRateLimited(`admin-content-save:${ip}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many content saves. Slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const content = await request.json();

    // Shape validation — keep this hand-rolled (not Zod) because the
    // field map is open-ended per page; we only care that the top-level
    // envelope has the shape saveContent expects.
    if (
      !content ||
      typeof content !== "object" ||
      Array.isArray(content) ||
      !content.pages ||
      typeof content.pages !== "object"
    ) {
      return NextResponse.json(
        { error: "Invalid content structure: must have a pages object" },
        { status: 400 }
      );
    }

    for (const [pageId, page] of Object.entries(content.pages)) {
      const p = page as Record<string, unknown>;
      if (!p || typeof p !== "object" || !p.label || !p.sections) {
        return NextResponse.json(
          { error: `Invalid page structure for "${pageId}": must have label and sections` },
          { status: 400 }
        );
      }
      if (!Array.isArray(p.sections)) {
        return NextResponse.json(
          { error: `Invalid sections for page "${pageId}": must be an array` },
          { status: 400 }
        );
      }
    }

    const userId = session.user.id ? Number(session.user.id) : null;
    await saveContent(content, userId && !isNaN(userId) ? userId : null);

    // Bust ISR for every editable public page so the change is
    // visible immediately rather than after the next revalidation tick.
    for (const path of EDITABLE_PAGES) {
      revalidatePath(path);
    }

    // Content edits are material — track which admin changed what +
    // how many pages were touched. The full blob is too large to
    // store per-row, so we record the page ids as the diff.
    await recordAudit({
      session,
      request,
      action: "site_content.updated",
      entityType: "site_content",
      entityId: null,
      before: null,
      after: {
        pageIds: Object.keys(content.pages),
        pageCount: Object.keys(content.pages).length,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Failed to save content", { error: String(err) });
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

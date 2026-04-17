import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getContent, saveContent } from "@/lib/content";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

export async function GET() {
  const content = getContent();
  return NextResponse.json(content, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const content = await request.json();

    // Validate shape: must be an object with a "pages" key containing page objects
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

    // Validate each page has expected shape
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

    saveContent(content);
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Failed to save content", { error: String(err) });
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

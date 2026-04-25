import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shortLinks } from "@/lib/db/schema";
import { and, eq, gte, isNull, or, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /r/[slug] — branded short-link redirect with click tracking.
// Used for SMS blasts, QR codes on flyers, paid-channel landing-page
// shorteners. Front desk can mint these from /admin/short-links (UI
// not yet built — admin can insert rows directly for now).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const now = new Date().toISOString();

  try {
    const [link] = await db
      .select()
      .from(shortLinks)
      .where(
        and(
          eq(shortLinks.slug, slug),
          eq(shortLinks.active, true),
          or(isNull(shortLinks.expiresAt), gte(shortLinks.expiresAt, now))
        )
      )
      .limit(1);

    if (!link) {
      // Bounce to home rather than 404 — short-link typos in the wild
      // shouldn't dead-end the visitor.
      return NextResponse.redirect("https://inspirecourtsaz.com/", 302);
    }

    // Increment counter async — don't block the redirect.
    db.update(shortLinks)
      .set({ clickCount: sql`${shortLinks.clickCount} + 1` })
      .where(eq(shortLinks.id, link.id))
      .catch((err) => logger.warn("short-link counter bump failed", { error: String(err) }));

    return NextResponse.redirect(link.destination, 302);
  } catch (err) {
    logger.error("short-link resolve failed", { slug, error: String(err) });
    return NextResponse.redirect("https://inspirecourtsaz.com/", 302);
  }
}

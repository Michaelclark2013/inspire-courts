import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { and, desc, gt, isNull, ne, or } from "drizzle-orm";

// GET /api/portal/announcements — get active announcements for current user's role
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role || "parent";
  const now = new Date().toISOString();

  // Audience visibility lives in SQL: "all" is always visible, plus
  // any non-role-targeted audience (e.g. divisions like "14U") passes
  // through. Role-scoped audiences ("coaches" / "parents") only show
  // for the matching role.
  const excludedRoleAudience = role === "coach" ? "parents" : "coaches";

  const filtered = await db
    .select()
    .from(announcements)
    .where(
      and(
        or(isNull(announcements.expiresAt), gt(announcements.expiresAt, now)),
        ne(announcements.audience, excludedRoleAudience)
      )
    )
    .orderBy(desc(announcements.createdAt));

  return NextResponse.json(filtered, {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
  });
}

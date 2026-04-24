import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc, gte, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/recent-signups
// Returns the last 20 new user accounts + counts by role over the
// past 30 days so the admin dashboard can surface who's joining.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const [recent, roleCounts] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          emailVerifiedAt: users.emailVerifiedAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(20),
      db
        .select({
          role: users.role,
          count: sql<number>`count(*)`,
        })
        .from(users)
        .where(gte(users.createdAt, thirtyDaysAgo))
        .groupBy(users.role),
    ]);

    const counts: Record<string, number> = {};
    for (const r of roleCounts) counts[r.role] = Number(r.count) || 0;

    return NextResponse.json(
      { recent, counts, windowDays: 30 },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("recent-signups failed", { error: String(err) });
    return NextResponse.json(
      { error: "Failed to load signups" },
      { status: 500 }
    );
  }
}

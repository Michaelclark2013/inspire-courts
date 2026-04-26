import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userPermissions } from "@/lib/db/schema";
import { asc, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/permissions
// Returns every active user with their override count so the matrix
// index page can render a table at a glance. Only main admin can access.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [rows, overrides] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          approved: users.approved,
          photoUrl: users.photoUrl,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(asc(users.name)),
      db
        .select({
          userId: userPermissions.userId,
          grantCount: sql<number>`sum(case when ${userPermissions.granted} = 1 then 1 else 0 end)`,
          revokeCount: sql<number>`sum(case when ${userPermissions.granted} = 0 then 1 else 0 end)`,
        })
        .from(userPermissions)
        .groupBy(userPermissions.userId),
    ]);

    const counts = Object.fromEntries(
      overrides.map((o) => [
        o.userId,
        { grants: Number(o.grantCount) || 0, revokes: Number(o.revokeCount) || 0 },
      ])
    );

    return NextResponse.json(
      {
        users: rows.map((u) => ({
          ...u,
          overrides: counts[u.id] || { grants: 0, revokes: 0 },
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("permissions list failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

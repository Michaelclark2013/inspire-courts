import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { desc, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/permissions/activity
// Site-wide recent permission changes — powers the "recent activity"
// panel on the main permissions list page.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await db
      .select()
      .from(auditLog)
      .where(
        inArray(auditLog.action, [
          "permission.granted",
          "permission.revoked",
          "permission.override_cleared",
          "permission.reset_user",
          "permission.bulk_granted",
          "permission.bulk_revoked",
          "permission.bulk_cleared",
          "permission.copied",
        ])
      )
      .orderBy(desc(auditLog.createdAt))
      .limit(25);

    return NextResponse.json(rows, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    logger.error("permission activity failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

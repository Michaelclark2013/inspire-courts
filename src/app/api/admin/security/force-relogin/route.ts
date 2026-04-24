import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ne } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";

// POST /api/admin/security/force-relogin
// Bumps permissions_updated_at on every non-admin user. The JWT
// callback compares this stamp on the next request and re-hydrates,
// which effectively "logs them out" as far as stale permission state
// goes. Useful for incident response: credential leak, emergency
// policy change, etc.
//
// We intentionally leave admin tokens alone so the operator doesn't
// bounce themselves.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const now = new Date().toISOString();
    const result = await db
      .update(users)
      .set({ permissionsUpdatedAt: now, updatedAt: now })
      .where(ne(users.role, "admin"))
      .returning({ id: users.id });
    await recordAudit({
      session,
      request,
      action: "security.force_relogin",
      entityType: "user",
      entityId: 0,
      before: null,
      after: { count: result.length },
    });
    return NextResponse.json({ ok: true, touched: result.length });
  } catch (err) {
    logger.error("force-relogin failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

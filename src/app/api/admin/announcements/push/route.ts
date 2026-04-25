import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { pushAnnouncement } from "@/lib/announcement-push";
import { parseJsonBody } from "@/lib/api-helpers";
import { z } from "zod";

const pushSchema = z.object({ id: z.number().int().positive() });

// POST /api/admin/announcements/push  { id }
// Re-broadcast (or first-broadcast) an existing announcement as a
// push notification to every subscription that matches its audience.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "announcements")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = await parseJsonBody(request, pushSchema);
  if (!parsed.ok) return parsed.response;
  const { id } = parsed.data;
  try {
    const result = await pushAnnouncement(id);
    await recordAudit({
      session,
      request,
      action: "announcement.pushed",
      entityType: "announcement",
      entityId: id,
      before: null,
      after: result,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("announcement push failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

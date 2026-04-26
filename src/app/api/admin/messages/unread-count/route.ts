import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { apiError } from "@/lib/api-helpers";
import { countUnreadThreads } from "@/lib/messaging";

// GET /api/admin/messages/unread-count — small payload for sidebar
// badge polling. Cheap by design: scans only my conversation list.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "messages")) {
    return apiError("Unauthorized", 401);
  }
  const meId = Number(session.user.id);
  if (!Number.isFinite(meId)) return apiError("Bad session", 400);
  const count = await countUnreadThreads(meId);
  return NextResponse.json({ count });
}

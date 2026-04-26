import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { suggestAssignments, applyAssignments } from "@/lib/scheduler";
import { recordAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { parseJsonBody } from "@/lib/api-helpers";
import { canAccess } from "@/lib/permissions";
import { z } from "zod";

const schedulerApplySchema = z.object({
  pairs: z
    .array(
      z.object({
        shiftId: z.number().int().positive(),
        userId: z.number().int().positive(),
      })
    )
    .max(500),
});

// GET /api/admin/scheduler?from=ISO&to=ISO  — suggested fillings
// POST /api/admin/scheduler { pairs: [{shiftId, userId}] } — apply
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "scheduler")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = request.nextUrl.searchParams;
  const from = sp.get("from") || new Date().toISOString();
  const to = sp.get("to") || new Date(Date.now() + 14 * 86_400_000).toISOString();
  try {
    const suggestions = await suggestAssignments({ fromIso: from, toIso: to });
    return NextResponse.json({ suggestions });
  } catch (err) {
    logger.error("scheduler suggest failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "scheduler")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = await parseJsonBody(request, schedulerApplySchema);
  if (!parsed.ok) return parsed.response;
  const { pairs } = parsed.data;
  if (pairs.length === 0) return NextResponse.json({ applied: 0 });
  try {
    const valid = pairs.map((p) => ({
      shiftId: p.shiftId,
      userId: p.userId,
      assignedBy: Number(session.user.id),
    }));
    const r = await applyAssignments(valid);
    await recordAudit({
      session,
      request,
      action: "scheduler.auto_assigned",
      entityType: "shift_assignment",
      after: { count: r.applied, pairs: valid },
    });
    return NextResponse.json(r);
  } catch (err) {
    logger.error("scheduler apply failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

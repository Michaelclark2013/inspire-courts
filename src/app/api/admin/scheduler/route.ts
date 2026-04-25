import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { suggestAssignments, applyAssignments } from "@/lib/scheduler";
import { recordAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

// GET /api/admin/scheduler?from=ISO&to=ISO  — suggested fillings
// POST /api/admin/scheduler { pairs: [{shiftId, userId}] } — apply
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
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
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const pairs = Array.isArray(body?.pairs) ? body.pairs : [];
    if (pairs.length === 0) return NextResponse.json({ applied: 0 });
    const valid = pairs
      .filter((p: { shiftId: unknown; userId: unknown }) => Number.isInteger(p?.shiftId) && Number.isInteger(p?.userId))
      .map((p: { shiftId: number; userId: number }) => ({
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

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chargeSubscription } from "@/lib/billing";
import { recordAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

// POST /api/admin/billing/subscriptions/[id]/charge
// Manually retry a charge. Used by the "Charge now" button on /admin/billing
// for past-due rows. Admin-only because it moves money.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid subscription id" }, { status: 400 });
  }
  try {
    const result = await chargeSubscription(id);
    await recordAudit({
      session,
      action: "subscription.manual_charge",
      entityType: "subscription",
      entityId: String(id),
      after: result,
      request,
    });
    return NextResponse.json(result);
  } catch (err) {
    logger.error("manual charge failed", { id, error: String(err) });
    return NextResponse.json({ error: "Charge failed" }, { status: 500 });
  }
}

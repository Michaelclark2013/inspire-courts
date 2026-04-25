import { NextRequest, NextResponse } from "next/server";
import { runBillingTick } from "@/lib/billing";
import { logger } from "@/lib/logger";

// POST /api/admin/cron/billing-tick
// Daily renewal + retry processor. Protected by CRON_SECRET — Vercel
// cron sends `Authorization: Bearer ${CRON_SECRET}`. Local can hit it
// with the same header for ad-hoc runs.
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBillingTick();
    logger.info("billing tick complete", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("billing tick failed", { error: String(err) });
    return NextResponse.json({ error: "Tick failed" }, { status: 500 });
  }
}

// Vercel cron compatibility — they hit GET.
export async function GET(request: NextRequest) {
  return POST(request);
}

import { NextRequest, NextResponse } from "next/server";
import { runJourneyTick } from "@/lib/journeys";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const r = await runJourneyTick();
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    logger.error("journey tick failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

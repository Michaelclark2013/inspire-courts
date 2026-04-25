import { NextRequest, NextResponse } from "next/server";
import { runJourneyTick } from "@/lib/journeys";
import { logger } from "@/lib/logger";
import { requireCronSecret } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const fail = requireCronSecret(request);
  if (fail) return fail;
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

import { NextRequest, NextResponse } from "next/server";
import { recomputeAllRiskScores } from "@/lib/churn";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await recomputeAllRiskScores();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("churn tick failed", { error: String(err) });
    return NextResponse.json({ error: "Tick failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

import { NextRequest, NextResponse } from "next/server";
import { recomputeAllRiskScores } from "@/lib/churn";
import { logger } from "@/lib/logger";
import { requireCronSecret } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const fail = requireCronSecret(request);
  if (fail) return fail;
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

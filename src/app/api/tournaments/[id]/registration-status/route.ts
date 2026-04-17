import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tournamentRegistrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// GET /api/tournaments/[id]/registration-status?reg=123
export async function GET(request: NextRequest, { params }: Params) {
  // Rate limit: 30 requests per minute per IP
  const ip = getClientIp(request);
  if (isRateLimited(`reg-status:${ip}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": "10" } }
    );
  }

  await params; // consume params
  const regId = request.nextUrl.searchParams.get("reg");

  if (!regId) {
    return NextResponse.json({ error: "Missing reg param" }, { status: 400 });
  }

  const regIdNum = Number(regId);
  if (isNaN(regIdNum) || regIdNum <= 0 || !Number.isInteger(regIdNum)) {
    return NextResponse.json({ error: "Invalid reg param" }, { status: 400 });
  }

  try {
    const [reg] = await db
      .select({
        id: tournamentRegistrations.id,
        status: tournamentRegistrations.status,
        paymentStatus: tournamentRegistrations.paymentStatus,
        teamName: tournamentRegistrations.teamName,
      })
      .from(tournamentRegistrations)
      .where(eq(tournamentRegistrations.id, regIdNum));

    if (!reg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json(reg);
  } catch (err) {
    logger.error("Registration status lookup failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to check registration status" }, { status: 500 });
  }
}

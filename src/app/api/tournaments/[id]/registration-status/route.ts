import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tournamentRegistrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// GET /api/tournaments/[id]/registration-status?reg=123
export async function GET(request: NextRequest, { params }: Params) {
  await params; // consume params
  const regId = request.nextUrl.searchParams.get("reg");

  if (!regId) {
    return NextResponse.json({ error: "Missing reg param" }, { status: 400 });
  }

  const [reg] = await db
    .select({
      id: tournamentRegistrations.id,
      status: tournamentRegistrations.status,
      paymentStatus: tournamentRegistrations.paymentStatus,
      teamName: tournamentRegistrations.teamName,
    })
    .from(tournamentRegistrations)
    .where(eq(tournamentRegistrations.id, Number(regId)));

  if (!reg) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  return NextResponse.json(reg);
}

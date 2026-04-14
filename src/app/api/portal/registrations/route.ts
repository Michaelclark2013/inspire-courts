import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournamentRegistrations, tournaments } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

// GET /api/portal/registrations — coach's registrations
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const regs = await db
      .select()
      .from(tournamentRegistrations)
      .where(eq(tournamentRegistrations.coachEmail, session.user.email));

    if (regs.length === 0) {
      return NextResponse.json([]);
    }

    // Batch fetch tournaments instead of N+1
    const tournamentIds = [...new Set(regs.map((r) => r.tournamentId))];
    const tournamentRows = await db
      .select({ id: tournaments.id, name: tournaments.name, startDate: tournaments.startDate, status: tournaments.status })
      .from(tournaments)
      .where(inArray(tournaments.id, tournamentIds));

    const tournamentMap = new Map(tournamentRows.map((t) => [t.id, t]));

    const enriched = regs.map((r) => {
      const tournament = tournamentMap.get(r.tournamentId);
      return {
        id: r.id,
        tournamentId: r.tournamentId,
        tournamentName: tournament?.name ?? "Unknown",
        tournamentDate: tournament?.startDate ?? "",
        tournamentStatus: tournament?.status ?? "",
        teamName: r.teamName,
        division: r.division,
        paymentStatus: r.paymentStatus,
        status: r.status,
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json({ error: "Failed to load registrations" }, { status: 500 });
  }
}

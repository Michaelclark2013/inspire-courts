import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournamentRegistrations, tournaments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/portal/registrations — coach's registrations
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const regs = await db
    .select()
    .from(tournamentRegistrations)
    .where(eq(tournamentRegistrations.coachEmail, session.user.email));

  // Enrich with tournament names
  const enriched = await Promise.all(
    regs.map(async (r) => {
      const [tournament] = await db
        .select({ name: tournaments.name, startDate: tournaments.startDate, status: tournaments.status })
        .from(tournaments)
        .where(eq(tournaments.id, r.tournamentId));

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
    })
  );

  return NextResponse.json(enriched);
}

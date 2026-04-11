import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentRegistrations,
  tournamentTeams,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createCheckoutLink, isSquareConfigured } from "@/lib/square";

type Params = { params: Promise<{ id: string }> };

// POST /api/tournaments/[id]/register — public registration
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const tournamentId = Number(id);

  const body = await request.json();
  const { teamName, coachName, coachEmail, coachPhone, division, playerCount } =
    body as {
      teamName: string;
      coachName: string;
      coachEmail: string;
      coachPhone?: string;
      division?: string;
      playerCount?: number;
    };

  if (!teamName || !coachName || !coachEmail) {
    return NextResponse.json(
      { error: "Team name, coach name, and email are required" },
      { status: 400 }
    );
  }

  // Get tournament
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId));

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  // Check registration is open
  if (!tournament.registrationOpen) {
    return NextResponse.json(
      { error: "Registration is not open for this tournament" },
      { status: 400 }
    );
  }

  // Check deadline
  if (tournament.registrationDeadline) {
    const deadline = new Date(tournament.registrationDeadline + "T23:59:59");
    if (new Date() > deadline) {
      return NextResponse.json(
        { error: "Registration deadline has passed" },
        { status: 400 }
      );
    }
  }

  // Check capacity per division
  if (tournament.maxTeamsPerDivision && division) {
    const existingTeams = await db
      .select()
      .from(tournamentRegistrations)
      .where(
        and(
          eq(tournamentRegistrations.tournamentId, tournamentId),
          eq(tournamentRegistrations.division, division),
          eq(tournamentRegistrations.status, "approved")
        )
      );

    // Also count pending paid registrations
    const pendingPaid = await db
      .select()
      .from(tournamentRegistrations)
      .where(
        and(
          eq(tournamentRegistrations.tournamentId, tournamentId),
          eq(tournamentRegistrations.division, division),
          eq(tournamentRegistrations.paymentStatus, "paid")
        )
      );

    const count = Math.max(existingTeams.length, pendingPaid.length);
    if (count >= tournament.maxTeamsPerDivision) {
      return NextResponse.json(
        { error: `Division ${division} is full (${tournament.maxTeamsPerDivision} teams max)` },
        { status: 400 }
      );
    }
  }

  const entryFee = tournament.entryFee ?? 0;
  const needsPayment = tournament.requirePayment && entryFee > 0;

  // Create registration
  const [reg] = await db
    .insert(tournamentRegistrations)
    .values({
      tournamentId,
      teamName,
      coachName,
      coachEmail,
      coachPhone: coachPhone || null,
      division: division || null,
      playerCount: playerCount ?? null,
      entryFee,
      paymentStatus: needsPayment ? "pending" : "waived",
      status: needsPayment ? "pending" : "approved",
    })
    .returning();

  // If no payment required, auto-add team to tournament
  if (!needsPayment) {
    const existingTeams = await db
      .select()
      .from(tournamentTeams)
      .where(eq(tournamentTeams.tournamentId, tournamentId));

    await db.insert(tournamentTeams).values({
      tournamentId,
      teamName,
      division: division || null,
      seed: existingTeams.length + 1,
    });

    return NextResponse.json({
      registrationId: reg.id,
      status: "approved",
      paymentRequired: false,
    });
  }

  // Generate Square checkout link
  if (!isSquareConfigured()) {
    // Square not configured — mark as pending, admin can manually approve
    return NextResponse.json({
      registrationId: reg.id,
      status: "pending",
      paymentRequired: true,
      message: "Registration submitted. Payment will be collected separately.",
    });
  }

  try {
    const baseUrl = request.headers.get("origin") || request.nextUrl.origin;
    const redirectUrl = `${baseUrl}/tournaments/${tournamentId}/register/confirmation?reg=${reg.id}`;

    const { checkoutUrl, orderId } = await createCheckoutLink({
      amountCents: entryFee,
      tournamentName: tournament.name,
      teamName,
      registrationId: reg.id,
      redirectUrl,
    });

    // Save checkout URL and order ID
    await db
      .update(tournamentRegistrations)
      .set({
        squareCheckoutUrl: checkoutUrl,
        squareOrderId: orderId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tournamentRegistrations.id, reg.id));

    return NextResponse.json({
      registrationId: reg.id,
      status: "pending",
      paymentRequired: true,
      checkoutUrl,
    });
  } catch (err) {
    console.error("Square checkout link error:", err);
    return NextResponse.json({
      registrationId: reg.id,
      status: "pending",
      paymentRequired: true,
      message: "Registration submitted. Payment link could not be generated — admin will follow up.",
    });
  }
}

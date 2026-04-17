import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  tournaments,
  tournamentRegistrations,
  tournamentTeams,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createCheckoutLink, isSquareConfigured } from "@/lib/square";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/** Strip HTML special characters to prevent XSS in stored data. */
function sanitize(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Params = { params: Promise<{ id: string }> };

// POST /api/tournaments/[id]/register — public registration
export async function POST(request: NextRequest, { params }: Params) {
  // Rate limit: 10 registrations per 10 minutes per IP
  const ip = getClientIp(request);
  if (isRateLimited(`tourney-reg:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  const { id } = await params;
  const tournamentId = Number(id);
  if (isNaN(tournamentId)) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }

  const body = await request.json();
  const rawTeamName = body.teamName;
  const rawCoachName = body.coachName;
  const rawCoachEmail = body.coachEmail;
  const rawCoachPhone = body.coachPhone;
  const rawDivision = body.division;
  const rawPlayerCount = body.playerCount;

  if (!rawTeamName || !rawCoachName || !rawCoachEmail) {
    return NextResponse.json(
      { error: "Team name, coach name, and email are required" },
      { status: 400 }
    );
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(rawCoachEmail))) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Sanitize and enforce field length limits
  const teamName = sanitize(String(rawTeamName).slice(0, 100));
  const coachName = sanitize(String(rawCoachName).slice(0, 100));
  const coachEmail = String(rawCoachEmail).toLowerCase().slice(0, 254);
  const coachPhone = rawCoachPhone ? sanitize(String(rawCoachPhone).slice(0, 20)) : undefined;
  const division = rawDivision ? sanitize(String(rawDivision).slice(0, 50)) : undefined;
  const playerCount = rawPlayerCount !== undefined ? Math.max(0, Math.min(100, Number(rawPlayerCount))) : undefined;

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
    logger.error("Square checkout link error", { error: String(err) });
    return NextResponse.json({
      registrationId: reg.id,
      status: "pending",
      paymentRequired: true,
      message: "Registration submitted. Payment link could not be generated — admin will follow up.",
    });
  }
}

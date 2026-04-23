import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

const registerSchema = z.object({
  teamName: z.string().trim().min(1, "Team name is required").max(100),
  coachName: z.string().trim().min(1, "Coach name is required").max(100),
  coachEmail: z.string().trim().toLowerCase().email("Invalid email").max(254),
  coachPhone: z.string().trim().max(30).optional().nullable(),
  division: z.string().trim().max(50).optional().nullable(),
  playerCount: z.number().int().min(0).max(100).optional().nullable(),
});

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
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid registration" },
      { status: 400 }
    );
  }

  // Zod already validated + trimmed; sanitize is belt-and-suspenders for the
  // HTML escape (emails sent downstream, stored display fields).
  const teamName = sanitize(parsed.data.teamName);
  const coachName = sanitize(parsed.data.coachName);
  const coachEmail = parsed.data.coachEmail;
  const coachPhone = parsed.data.coachPhone ? sanitize(parsed.data.coachPhone) : undefined;
  const division = parsed.data.division ? sanitize(parsed.data.division) : undefined;
  const playerCount = parsed.data.playerCount ?? undefined;

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

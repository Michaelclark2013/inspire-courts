import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { lookupIdempotent, storeIdempotent } from "@/lib/idempotency";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/tournaments/[id]/duplicate
//
// Creates a new draft tournament copying the config of an existing one.
// Useful for running the same tournament each season without retyping
// divisions, courts, game length, etc.
//
// Copied: name (+ " (Copy)"), format, divisions, courts, gameLength,
// breakLength, entryFee, maxTeamsPerDivision, requireWaivers,
// requirePayment, description.
//
// NOT copied (reset to safe defaults):
//   - status       → "draft"
//   - registrationOpen → false
//   - startDate    → today + 30 days (placeholder; admin will edit)
//   - endDate      → null
//   - registrationDeadline → null
//
// Brackets, teams, and registrations are NOT copied — those are event-
// specific and would just confuse a fresh draft.
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }

  // Idempotency replay — a double-click on the duplicate button otherwise
  // creates two "(Copy)" rows.
  const idemKey = request.headers.get("idempotency-key");
  const cached = lookupIdempotent(session.user.id, idemKey);
  if (cached) {
    return NextResponse.json(cached.body, {
      status: cached.status,
      headers: { "Idempotent-Replay": "true" },
    });
  }

  try {
    const [source] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (!source) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Placeholder start date: today + 30 days (ISO yyyy-mm-dd).
    const placeholderDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const [copy] = await db
      .insert(tournaments)
      .values({
        name: `${source.name} (Copy)`.slice(0, 200),
        startDate: placeholderDate,
        endDate: null,
        location: source.location,
        format: source.format,
        divisions: source.divisions,
        courts: source.courts,
        gameLength: source.gameLength,
        breakLength: source.breakLength,
        entryFee: source.entryFee,
        maxTeamsPerDivision: source.maxTeamsPerDivision,
        registrationDeadline: null,
        registrationOpen: false,
        requireWaivers: source.requireWaivers,
        requirePayment: source.requirePayment,
        description: source.description,
        status: "draft",
      })
      .returning();

    await recordAudit({
      session,
      action: "tournament.duplicated",
      entityType: "tournament",
      entityId: copy.id,
      before: { sourceId: source.id, sourceName: source.name },
      after: { id: copy.id, name: copy.name, status: copy.status },
    });

    revalidatePath("/admin/tournaments");
    storeIdempotent(session.user.id, idemKey, copy, 201);
    return NextResponse.json(copy, { status: 201 });
  } catch (err) {
    logger.error("Failed to duplicate tournament", {
      tournamentId,
      error: String(err),
    });
    return NextResponse.json(
      { error: "Failed to duplicate tournament" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  tournamentRegistrations,
  tournamentTeams,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

// Escape a value for RFC-4180 CSV. Always quoted so embedded commas and
// newlines are safe. Empty/null becomes an empty quoted field.
function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// GET /api/admin/tournaments/[id]/registrations
//   ?format=csv → streams a CSV download instead of JSON
export async function GET(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }

  try {
    const regs = await db
      .select()
      .from(tournamentRegistrations)
      .where(eq(tournamentRegistrations.tournamentId, tournamentId))
      .orderBy(tournamentRegistrations.createdAt);

    const format = request.nextUrl.searchParams.get("format");
    if (format === "csv") {
      const header = [
        "id",
        "teamName",
        "coachName",
        "coachEmail",
        "coachPhone",
        "division",
        "playerCount",
        "entryFeeCents",
        "paymentStatus",
        "status",
        "rosterSubmitted",
        "waiversSigned",
        "notes",
        "createdAt",
      ];
      const rows = regs.map((r) => [
        r.id,
        r.teamName,
        r.coachName,
        r.coachEmail,
        r.coachPhone,
        r.division,
        r.playerCount,
        r.entryFee,
        r.paymentStatus,
        r.status,
        r.rosterSubmitted ? "yes" : "no",
        r.waiversSigned ? "yes" : "no",
        r.notes,
        r.createdAt,
      ]);
      const csv = [header.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="tournament-${tournamentId}-registrations.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(regs);
  } catch (err) {
    logger.error("Failed to fetch registrations", { tournamentId, error: String(err) });
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}

// POST /api/admin/tournaments/[id]/registrations — admin-create (walk-in / comp)
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

  try {
    const body = await request.json();

    const { teamName, coachName, coachEmail, division, paymentStatus, notes } =
      body as {
        teamName: string;
        coachName: string;
        coachEmail?: string;
        division?: string;
        paymentStatus?: string;
        notes?: string;
      };

    if (!teamName || !coachName) {
      return NextResponse.json(
        { error: "Team name and coach name required" },
        { status: 400 }
      );
    }

    const [reg] = await db
      .insert(tournamentRegistrations)
      .values({
        tournamentId,
        teamName,
        coachName,
        coachEmail: coachEmail || "",
        division: division || null,
        paymentStatus: (paymentStatus as "pending" | "paid" | "waived") || "waived",
        status: "approved",
        notes: notes || null,
      })
      .returning();

    // Auto-add to tournament teams
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

    revalidatePath(`/admin/tournaments/${id}`);
    revalidatePath(`/tournaments/${id}`);
    return NextResponse.json(reg);
  } catch (err) {
    logger.error("Failed to create registration", { tournamentId, error: String(err) });
    return NextResponse.json({ error: "Failed to create registration" }, { status: 500 });
  }
}

// PUT /api/admin/tournaments/[id]/registrations — update status
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { registrationId, ids, status, paymentStatus, notes } = body as {
      registrationId?: number;
      ids?: number[];
      status?: string;
      paymentStatus?: string;
      notes?: string;
    };

    // Accept either a single id (legacy) or a bulk `ids` array.
    const targetIds: number[] = Array.isArray(ids) && ids.length > 0
      ? ids.filter((n) => Number.isInteger(n) && n > 0)
      : registrationId && Number.isInteger(registrationId) && registrationId > 0
        ? [registrationId]
        : [];

    if (targetIds.length === 0) {
      return NextResponse.json({ error: "registrationId or ids[] required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (notes !== undefined) updates.notes = notes;

    // Single batched UPDATE covers both single and bulk paths.
    await db
      .update(tournamentRegistrations)
      .set(updates)
      .where(inArray(tournamentRegistrations.id, targetIds));

    // For each newly approved+paid registration, ensure a tournament_teams row exists.
    const updatedRegs = await db
      .select()
      .from(tournamentRegistrations)
      .where(inArray(tournamentRegistrations.id, targetIds));

    for (const reg of updatedRegs) {
      if (
        reg.status === "approved" &&
        (reg.paymentStatus === "paid" || reg.paymentStatus === "waived")
      ) {
        const existing = await db
          .select()
          .from(tournamentTeams)
          .where(
            and(
              eq(tournamentTeams.tournamentId, reg.tournamentId),
              eq(tournamentTeams.teamName, reg.teamName)
            )
          );

        if (existing.length === 0) {
          const allTeams = await db
            .select()
            .from(tournamentTeams)
            .where(eq(tournamentTeams.tournamentId, reg.tournamentId));

          await db.insert(tournamentTeams).values({
            tournamentId: reg.tournamentId,
            teamName: reg.teamName,
            division: reg.division || null,
            seed: allTeams.length + 1,
          });
        }
      }
    }

    if (targetIds.length > 1) {
      await recordAudit({
        session,
        action: "registration.bulk_update",
        entityType: "tournament_registration",
        entityId: targetIds.join(","),
        before: null,
        after: { ids: targetIds, updates },
      });
    }

    revalidatePath(`/admin/tournaments/${id}`);
    revalidatePath(`/tournaments/${id}`);
    return NextResponse.json({ ok: true, updated: targetIds.length });
  } catch (err) {
    logger.error("Failed to update registration", { error: String(err) });
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  }
}

// DELETE /api/admin/tournaments/[id]/registrations?registrationId=123
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const regId = request.nextUrl.searchParams.get("registrationId");
    if (!regId) {
      return NextResponse.json({ error: "registrationId required" }, { status: 400 });
    }

    await db
      .delete(tournamentRegistrations)
      .where(eq(tournamentRegistrations.id, Number(regId)));

    revalidatePath(`/admin/tournaments/${id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Failed to delete registration", { error: String(err) });
    return NextResponse.json({ error: "Failed to delete registration" }, { status: 500 });
  }
}

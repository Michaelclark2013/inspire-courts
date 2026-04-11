import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  tournamentRegistrations,
  tournamentTeams,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/tournaments/[id]/registrations
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);

  const regs = await db
    .select()
    .from(tournamentRegistrations)
    .where(eq(tournamentRegistrations.tournamentId, tournamentId))
    .orderBy(tournamentRegistrations.createdAt);

  return NextResponse.json(regs);
}

// POST /api/admin/tournaments/[id]/registrations — admin-create (walk-in / comp)
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);
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

  return NextResponse.json(reg);
}

// PUT /api/admin/tournaments/[id]/registrations — update status
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await params;
  const body = await request.json();
  const { registrationId, status, paymentStatus, notes } = body as {
    registrationId: number;
    status?: string;
    paymentStatus?: string;
    notes?: string;
  };

  if (!registrationId) {
    return NextResponse.json({ error: "registrationId required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (status) updates.status = status;
  if (paymentStatus) updates.paymentStatus = paymentStatus;
  if (notes !== undefined) updates.notes = notes;

  await db
    .update(tournamentRegistrations)
    .set(updates)
    .where(eq(tournamentRegistrations.id, registrationId));

  // If marking as paid + approved, auto-add to tournament teams
  const [reg] = await db
    .select()
    .from(tournamentRegistrations)
    .where(eq(tournamentRegistrations.id, registrationId));

  if (
    reg &&
    reg.status === "approved" &&
    (reg.paymentStatus === "paid" || reg.paymentStatus === "waived")
  ) {
    // Check if team already exists in tournament
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

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/tournaments/[id]/registrations?registrationId=123
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await params;
  const regId = request.nextUrl.searchParams.get("registrationId");
  if (!regId) {
    return NextResponse.json({ error: "registrationId required" }, { status: 400 });
  }

  await db
    .delete(tournamentRegistrations)
    .where(eq(tournamentRegistrations.id, Number(regId)));

  return NextResponse.json({ ok: true });
}

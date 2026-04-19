import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import {
  tournamentRegistrations,
  tournamentTeams,
} from "@/lib/db/schema";
import { asc, desc, eq, and, inArray, sql, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { withTiming } from "@/lib/timing";
import { registrationCreateSchema, registrationUpdateSchema } from "@/lib/schemas";
import { parseJsonBody } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// Escape a value for RFC-4180 CSV. Always quoted so embedded commas and
// newlines are safe. Empty/null becomes an empty quoted field.
function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// Pagination cap per request (CSV export is unbounded).
const REG_MAX_LIMIT = 200;
const REG_DEFAULT_LIMIT = 50;
const VALID_STATUS = ["pending", "approved", "rejected", "waitlisted"] as const;
const VALID_PAYMENT = ["pending", "paid", "refunded", "waived"] as const;

// Whitelist of sortable columns — prevents ORDER BY injection.
const REG_SORT_COLUMNS = {
  teamName: tournamentRegistrations.teamName,
  coachName: tournamentRegistrations.coachName,
  status: tournamentRegistrations.status,
  paymentStatus: tournamentRegistrations.paymentStatus,
  division: tournamentRegistrations.division,
  createdAt: tournamentRegistrations.createdAt,
} as const;

// GET /api/admin/tournaments/[id]/registrations
//   ?format=csv        stream CSV (unbounded, ignores pagination)
//   ?status=           filter by registration status
//   ?paymentStatus=    filter by payment status
//   ?division=         filter by division
//   ?sort=             teamName|coachName|status|paymentStatus|division|createdAt
//   ?dir=              asc|desc (default asc for text cols, desc for createdAt)
//   ?page=             1-indexed page (default 1)
//   ?limit=            rows per page (default 50, max 200)
// JSON response: { data, total, page, limit, totalPages }
export const GET = withTiming("admin.registrations.list", async (request: NextRequest, { params }: Params) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tournamentId = Number(id);
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
  }

  const sp = request.nextUrl.searchParams;
  const format = sp.get("format");
  const statusParam = sp.get("status");
  const paymentParam = sp.get("paymentStatus");
  const divisionParam = sp.get("division");

  const filters: SQL[] = [eq(tournamentRegistrations.tournamentId, tournamentId)];
  if (statusParam && (VALID_STATUS as readonly string[]).includes(statusParam)) {
    filters.push(eq(tournamentRegistrations.status, statusParam as (typeof VALID_STATUS)[number]));
  }
  if (paymentParam && (VALID_PAYMENT as readonly string[]).includes(paymentParam)) {
    filters.push(eq(tournamentRegistrations.paymentStatus, paymentParam as (typeof VALID_PAYMENT)[number]));
  }
  if (divisionParam) filters.push(eq(tournamentRegistrations.division, divisionParam));
  const whereClause = and(...filters);

  // Sort with a whitelist. Default to createdAt asc (oldest-first, so the
  // queue-style view is preserved) to match the previous behavior.
  const sortKey = (sp.get("sort") || "createdAt") as keyof typeof REG_SORT_COLUMNS;
  const sortCol = REG_SORT_COLUMNS[sortKey] || tournamentRegistrations.createdAt;
  const dir = sp.get("dir") === "desc" ? desc : sp.get("dir") === "asc" ? asc : null;
  const orderBy = dir
    ? dir(sortCol)
    : sortKey === "createdAt"
      ? asc(sortCol)
      : asc(sortCol);

  try {
    // Scoped selector shared by CSV + paginated JSON paths — excludes
    // Square payment tokens (squarePaymentId, squareOrderId, squareCheckoutUrl)
    // that the admin UI never needs and that shouldn't ride on every
    // list-view response.
    const regSelectColumns = {
      id: tournamentRegistrations.id,
      tournamentId: tournamentRegistrations.tournamentId,
      teamName: tournamentRegistrations.teamName,
      coachName: tournamentRegistrations.coachName,
      coachEmail: tournamentRegistrations.coachEmail,
      coachPhone: tournamentRegistrations.coachPhone,
      division: tournamentRegistrations.division,
      playerCount: tournamentRegistrations.playerCount,
      entryFee: tournamentRegistrations.entryFee,
      paymentStatus: tournamentRegistrations.paymentStatus,
      status: tournamentRegistrations.status,
      rosterSubmitted: tournamentRegistrations.rosterSubmitted,
      waiversSigned: tournamentRegistrations.waiversSigned,
      notes: tournamentRegistrations.notes,
      createdAt: tournamentRegistrations.createdAt,
      updatedAt: tournamentRegistrations.updatedAt,
    };

    if (format === "csv") {
      // CSV: no pagination — admin wants the full filtered set.
      const regs = await db
        .select(regSelectColumns)
        .from(tournamentRegistrations)
        .where(whereClause)
        .orderBy(orderBy);
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
          Vary: "Accept-Encoding",
        },
      });
    }

    // JSON path: pagination.
    const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
    const rawLimit = Math.floor(Number(sp.get("limit")) || REG_DEFAULT_LIMIT);
    const limit = Math.min(Math.max(1, rawLimit || REG_DEFAULT_LIMIT), REG_MAX_LIMIT);
    const offset = (page - 1) * limit;

    const [pagedRegs, [{ total }]] = await Promise.all([
      db
        .select(regSelectColumns)
        .from(tournamentRegistrations)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)` })
        .from(tournamentRegistrations)
        .where(whereClause),
    ]);

    return NextResponse.json({
      data: pagedRegs,
      total: Number(total) || 0,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil((Number(total) || 0) / limit)),
    });
  } catch (err) {
    logger.error("Failed to fetch registrations", { tournamentId, error: String(err) });
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
});

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

  const parsed = await parseJsonBody(request, registrationCreateSchema);
  if (!parsed.ok) return parsed.response;
  const { teamName, coachName, coachEmail, division, paymentStatus, notes } = parsed.data;
  const safePaymentStatus = paymentStatus ?? "waived";

  try {
    const [reg] = await db
      .insert(tournamentRegistrations)
      .values({
        tournamentId,
        teamName: teamName.trim().slice(0, 200),
        coachName: coachName.trim().slice(0, 200),
        coachEmail: coachEmail ? coachEmail.trim().toLowerCase().slice(0, 255) : "",
        division: division ? division.trim().slice(0, 50) : null,
        paymentStatus: safePaymentStatus,
        status: "approved",
        notes: notes ? notes.trim().slice(0, 2000) : null,
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

    // Walk-in registrations created by an admin skip the public
     // payment/approval flow and go straight to approved+waived, so they're
    // a high-consequence audit target (free entry granted by an admin).
    await recordAudit({
      session,
      request,
      action: "registration.created",
      entityType: "tournament_registration",
      entityId: reg.id,
      before: null,
      after: {
        tournamentId: reg.tournamentId,
        teamName: reg.teamName,
        coachName: reg.coachName,
        coachEmail: reg.coachEmail,
        paymentStatus: reg.paymentStatus,
        status: reg.status,
      },
    });

    revalidatePath(`/admin/tournaments/${id}`);
    revalidatePath(`/tournaments/${id}`);
    return NextResponse.json(reg, { status: 201 });
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

  const parsed = await parseJsonBody(request, registrationUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { registrationId, ids, status, paymentStatus, notes } = parsed.data;

  const targetIds: number[] = Array.isArray(ids) && ids.length > 0
    ? ids
    : registrationId
      ? [registrationId]
      : [];

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (status) updates.status = status;
  if (paymentStatus) updates.paymentStatus = paymentStatus;
  if (notes !== undefined) {
    updates.notes = notes === null ? null : notes.trim().slice(0, 2000);
  }

  try {

    // Snapshot BEFORE the write so the audit log can answer "what was the
    // status/payment before this approval?". Previously `before: null`.
    const beforeRows = await db
      .select({
        id: tournamentRegistrations.id,
        status: tournamentRegistrations.status,
        paymentStatus: tournamentRegistrations.paymentStatus,
        notes: tournamentRegistrations.notes,
      })
      .from(tournamentRegistrations)
      .where(inArray(tournamentRegistrations.id, targetIds));
    const beforeById = new Map(beforeRows.map((r) => [r.id, r]));

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

    // Audit single-row updates too (was bulk-only before). Single path gets
    // "registration.updated", bulk gets "registration.bulk_update" so queries
    // can distinguish. `before` now carries the pre-write snapshot.
    if (targetIds.length === 1) {
      await recordAudit({
        session,
        request,
        action: "registration.updated",
        entityType: "tournament_registration",
        entityId: targetIds[0],
        before: beforeById.get(targetIds[0]) ?? null,
        after: updates,
      });
    } else if (targetIds.length > 1) {
      await recordAudit({
        session,
        request,
        action: "registration.bulk_update",
        entityType: "tournament_registration",
        entityId: targetIds.join(","),
        before: { ids: beforeRows },
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

// DELETE /api/admin/tournaments/[id]/registrations
//   Single: ?registrationId=123 (legacy query param)
//   Bulk:   body { ids: number[] }
//
// Both paths cascade-remove any matching tournament_teams rows so the
// bracket doesn't keep a stale team reference.
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Accept either ?registrationId= (legacy) or a body { ids: number[] }.
    const regIdRaw = request.nextUrl.searchParams.get("registrationId");

    let bodyIds: number[] = [];
    // Only try to parse a body if the client sent one (DELETE without body
    // is common). Failure falls through to the query-param path.
    try {
      const contentLength = request.headers.get("content-length");
      if (contentLength && Number(contentLength) > 0) {
        const body = await request.json();
        if (Array.isArray(body?.ids)) {
          bodyIds = body.ids.filter(
            (n: unknown) => typeof n === "number" && Number.isInteger(n) && n > 0
          );
        }
      }
    } catch {
      // Ignore body parse errors; fall back to query param.
    }

    const DELETE_BULK_CAP = 200;
    if (bodyIds.length > DELETE_BULK_CAP) {
      return NextResponse.json(
        { error: `ids[] cannot exceed ${DELETE_BULK_CAP} entries; chunk the request` },
        { status: 400 }
      );
    }
    const targetIds: number[] = bodyIds.length > 0
      ? bodyIds
      : (() => {
          const regId = Number(regIdRaw);
          if (!regIdRaw || !Number.isInteger(regId) || regId <= 0) return [];
          return [regId];
        })();

    if (targetIds.length === 0) {
      return NextResponse.json(
        { error: "Valid registrationId query param or ids[] body required" },
        { status: 400 }
      );
    }

    // Fetch all targeted registrations so we can (a) cascade the
    // tournament_teams cleanup by teamName, and (b) capture before-snapshots
    // per-row for the audit log.
    const existing = await db
      .select()
      .from(tournamentRegistrations)
      .where(inArray(tournamentRegistrations.id, targetIds));

    if (existing.length === 0) {
      return NextResponse.json({ error: "No matching registrations" }, { status: 404 });
    }

    // Cascade atomically: tournament_teams cleanup + registration delete
    // must either both succeed or both fail. Previously a crash between
    // the two would leave registrations whose team rows had been removed,
    // silently corrupting bracket seedings.
    const teamNames = Array.from(new Set(existing.map((r) => r.teamName)));
    await db.transaction(async (tx) => {
      if (teamNames.length > 0) {
        await tx
          .delete(tournamentTeams)
          .where(
            and(
              eq(tournamentTeams.tournamentId, existing[0].tournamentId),
              inArray(tournamentTeams.teamName, teamNames)
            )
          );
      }
      await tx
        .delete(tournamentRegistrations)
        .where(inArray(tournamentRegistrations.id, targetIds));
    });

    // Audit each deletion individually so the log stays useful for lookups.
    for (const row of existing) {
      await recordAudit({
        session,
        request,
        action: "registration.deleted",
        entityType: "tournament_registration",
        entityId: row.id,
        before: {
          teamName: row.teamName,
          coachEmail: row.coachEmail,
          status: row.status,
          paymentStatus: row.paymentStatus,
        },
        after: null,
      });
    }

    revalidatePath(`/admin/tournaments/${id}`);

    // Preserve legacy single-id response shape when the caller went that path.
    if (targetIds.length === 1 && bodyIds.length === 0) {
      return NextResponse.json({ ok: true, id: targetIds[0] });
    }
    return NextResponse.json({ ok: true, deleted: existing.length, ids: existing.map((r) => r.id) });
  } catch (err) {
    logger.error("Failed to delete registration", { error: String(err) });
    return NextResponse.json({ error: "Failed to delete registration" }, { status: 500 });
  }
}

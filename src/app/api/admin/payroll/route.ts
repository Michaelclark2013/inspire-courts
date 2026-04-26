import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { payPeriods } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import {
  payPeriodCreateSchema,
  payPeriodUpdateSchema,
} from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";
import {
  computePayrollRollup,
  rollupToGenericCsv,
  rollupToGustoCsv,
  rollupToQuickBooksCsv,
} from "@/lib/payroll";

// GET /api/admin/payroll — list pay periods + (if ?id=) the per-period
// rollup. ?id=X returns lines; no id returns just the period list.
// ?format=csv|gusto|quickbooks on a single period streams the CSV.
export const GET = withTiming("admin.payroll", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "payroll")) {
    return apiError("Unauthorized", 401);
  }

  const sp = request.nextUrl.searchParams;
  const idRaw = sp.get("id");
  const format = sp.get("format");

  try {
    if (!idRaw) {
      const rows = await db
        .select()
        .from(payPeriods)
        .orderBy(desc(payPeriods.startsAt));
      return NextResponse.json(
        { data: rows, total: rows.length },
        { headers: { "Cache-Control": "private, max-age=10" } }
      );
    }

    const id = Number(idRaw);
    if (!Number.isInteger(id) || id <= 0) return apiError("Invalid id", 400);

    const [period] = await db
      .select()
      .from(payPeriods)
      .where(eq(payPeriods.id, id))
      .limit(1);
    if (!period) return apiNotFound("Pay period not found");

    const lines = await computePayrollRollup(period.startsAt, period.endsAt);
    const total = lines.reduce((sum, l) => sum + l.grossCents, 0);

    // CSV exports stream out as attachments. Filename embeds the period
    // label so downloads stay organized.
    if (format === "csv" || format === "gusto" || format === "quickbooks") {
      const body =
        format === "gusto"
          ? rollupToGustoCsv(lines)
          : format === "quickbooks"
            ? rollupToQuickBooksCsv(lines)
            : rollupToGenericCsv(lines);
      const safeLabel = period.label.replace(/[^a-zA-Z0-9_-]+/g, "-");
      return new NextResponse(body, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="payroll-${safeLabel}-${format}.csv"`,
          "Cache-Control": "no-store",
          Vary: "Accept-Encoding",
        },
      });
    }

    return NextResponse.json(
      { period, lines, totalCents: total },
      { headers: { "Cache-Control": "private, max-age=5" } }
    );
  } catch (err) {
    logger.error("Failed to load payroll", { error: String(err) });
    return apiError("Failed to load payroll", 500);
  }
});

export const POST = withTiming("admin.payroll.create", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "payroll")) {
    return apiError("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, payPeriodCreateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    const [created] = await db
      .insert(payPeriods)
      .values({
        label: body.label,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        status: "open",
        notes: body.notes ?? null,
      })
      .returning();

    await recordAudit({
      session,
      request,
      action: "pay_period.created",
      entityType: "pay_period",
      entityId: created.id,
      before: null,
      after: { label: created.label, startsAt: created.startsAt, endsAt: created.endsAt },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("Failed to create pay period", { error: String(err) });
    return apiError("Failed to create pay period", 500);
  }
});

// PUT — label / dates / notes edits for open periods, AND the
// open → locked → paid status transitions. Lock timestamps/actor are
// set automatically on the locked transition; paid timestamp on paid.
export const PUT = withTiming("admin.payroll.update", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "payroll")) {
    return apiError("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, payPeriodUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  try {
    const [before] = await db
      .select()
      .from(payPeriods)
      .where(eq(payPeriods.id, body.id))
      .limit(1);
    if (!before) return apiNotFound("Pay period not found");

    // Refuse date/label edits once the period is locked — the whole
    // point of locking is that the window + math is frozen.
    if (
      before.status !== "open" &&
      (body.label !== undefined ||
        body.startsAt !== undefined ||
        body.endsAt !== undefined)
    ) {
      return apiError(
        "Cannot edit label/dates after locking — unlock first (not currently permitted)",
        409
      );
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (body.label !== undefined) updates.label = body.label;
    if (body.startsAt !== undefined) updates.startsAt = body.startsAt;
    if (body.endsAt !== undefined) updates.endsAt = body.endsAt;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.status !== undefined) {
      updates.status = body.status;
      const actorId = session.user.id ? Number(session.user.id) : null;
      if (body.status === "locked" && before.status !== "locked") {
        updates.lockedAt = new Date().toISOString();
        updates.lockedBy = actorId && !isNaN(actorId) ? actorId : null;
      }
      if (body.status === "paid" && before.status !== "paid") {
        updates.paidAt = new Date().toISOString();
      }
    }

    const [updated] = await db
      .update(payPeriods)
      .set(updates)
      .where(eq(payPeriods.id, body.id))
      .returning();

    const statusChanged = body.status !== undefined && body.status !== before.status;
    await recordAudit({
      session,
      request,
      action: statusChanged ? `pay_period.${body.status}` : "pay_period.updated",
      entityType: "pay_period",
      entityId: body.id,
      before: {
        status: before.status,
        label: before.label,
        startsAt: before.startsAt,
        endsAt: before.endsAt,
      },
      after: updates,
    });

    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Failed to update pay period", { error: String(err) });
    return apiError("Failed to update pay period", 500);
  }
});

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { members, membershipPlans } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import { memberImportSchema } from "@/lib/schemas";
import { parseJsonBody, apiError } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// POST /api/admin/members/import
// Body: { rows: MemberRow[], dryRun?: boolean }
//
// Bulk-import members from a CSV-parsed payload. Runs in a DB
// transaction so a validation failure on row N rolls back rows 0..N-1.
// dryRun=true validates + resolves plan names → ids but doesn't
// write anything — returns the "would-insert" preview so the admin
// can eyeball the first few rows before committing.
//
// Caps at 1000 rows per call. Larger migrations should be chunked.
export const POST = withTiming("admin.members.import", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "members")) {
    return apiError("Unauthorized", 401);
  }
  const parsed = await parseJsonBody(request, memberImportSchema);
  if (!parsed.ok) return parsed.response;
  const { rows, dryRun } = parsed.data;

  try {
    // Resolve plan names → ids ONCE up front (case-insensitive
    // match). Rows can supply either membershipPlanId directly or
    // a planName; planName wins if both are provided.
    const planRows = await db.select({ id: membershipPlans.id, name: membershipPlans.name }).from(membershipPlans);
    const nameToId = new Map(planRows.map((p) => [p.name.toLowerCase(), p.id]));

    const created: typeof members.$inferSelect[] = [];
    const errors: Array<{ rowIndex: number; error: string }> = [];
    const createdBy = session.user.id ? Number(session.user.id) : null;

    // Validate all rows first so we can bail before writing anything.
    const resolvedRows: Array<Record<string, unknown>> = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      let planId: number | null = r.membershipPlanId ?? null;
      if (!planId && r.planName) {
        planId = nameToId.get(r.planName.toLowerCase()) ?? null;
        if (!planId) {
          errors.push({ rowIndex: i, error: `Unknown plan name: "${r.planName}"` });
          continue;
        }
      }
      resolvedRows.push({
        firstName: r.firstName.trim(),
        lastName: r.lastName.trim(),
        email: r.email ? r.email.trim().toLowerCase() : null,
        phone: r.phone ?? null,
        birthDate: r.birthDate ?? null,
        membershipPlanId: planId,
        status: r.status ?? "active",
        source: r.source ?? "walk_in",
        joinedAt: r.joinedAt,
        nextRenewalAt: r.nextRenewalAt ?? null,
        autoRenew: r.autoRenew ?? true,
        notes: r.notes ?? null,
        createdBy: createdBy && !isNaN(createdBy) ? createdBy : null,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { ok: false, errors, createdCount: 0, previewCount: resolvedRows.length, dryRun: !!dryRun },
        { status: 422 }
      );
    }

    if (dryRun) {
      return NextResponse.json({
        ok: true, dryRun: true,
        previewCount: resolvedRows.length,
        firstPreview: resolvedRows.slice(0, 5),
        errors: [],
      });
    }

    // All-or-nothing insert. If any row fails the DB layer, the whole
    // batch rolls back — no half-imports.
    await db.transaction(async (tx) => {
      for (const row of resolvedRows) {
        const [inserted] = await tx
          .insert(members)
          .values(row as typeof members.$inferInsert)
          .returning();
        created.push(inserted);
      }
    });

    await recordAudit({
      session, request, action: "member.bulk_imported",
      entityType: "member", entityId: null, before: null,
      after: { count: created.length, firstId: created[0]?.id, lastId: created[created.length - 1]?.id },
    });

    return NextResponse.json({ ok: true, createdCount: created.length, errors: [] }, { status: 201 });
  } catch (err) {
    logger.error("Member import failed", { error: String(err) });
    return apiError("Import failed — all rows rolled back", 500);
  }
});

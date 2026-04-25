import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tournaments, resetTokens, auditLog } from "@/lib/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { requireCronSecret } from "@/lib/api-helpers";

// POST /api/admin/cron/maintenance
//
// Scheduled housekeeping. Intended to be called by a Vercel Cron schedule
// (e.g. hourly) or manually by an admin. Not user-session-gated — it uses
// a shared-secret header so Vercel Cron can call it unauthenticated.
//
// Sweeps run:
//   1. Tournaments past registrationDeadline → set registrationOpen=false
//   2. Tournaments with endDate in the past and status=active → status=completed
//   3. Reset-password tokens expired more than 24h ago → deleted
//   4. Audit-log rows older than AUDIT_LOG_RETENTION_DAYS (default 365) → deleted.
//      The audit table is append-only but must have some retention so it
//      doesn't grow forever. Set env to Infinity to keep everything.
//
// Returns per-sweep counts so an ops dashboard can confirm what happened.
export async function POST(request: NextRequest) {
  const fail = requireCronSecret(request);
  if (fail) return fail;

  const now = new Date();
  const nowIso = now.toISOString();
  const todayDate = nowIso.slice(0, 10); // YYYY-MM-DD for date-only columns
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Close registration on tournaments past their deadline.
    //    Only touch rows still flagged open so we don't spam updatedAt.
    const closed = await db
      .update(tournaments)
      .set({ registrationOpen: false, updatedAt: nowIso })
      .where(
        and(
          eq(tournaments.registrationOpen, true),
          lt(tournaments.registrationDeadline, todayDate)
        )
      )
      .returning({ id: tournaments.id });

    // 2. Complete tournaments whose endDate has passed and are still "active".
    const completed = await db
      .update(tournaments)
      .set({ status: "completed", updatedAt: nowIso })
      .where(
        and(
          eq(tournaments.status, "active"),
          lt(tournaments.endDate, todayDate)
        )
      )
      .returning({ id: tournaments.id });

    // 3. Purge reset tokens expired over 24h (grace window for debugging).
    const prunedTokens = await db
      .delete(resetTokens)
      .where(lt(resetTokens.expiresAt, yesterday))
      .returning({ id: resetTokens.id });

    // 4. Audit-log GC. Default 365d retention keeps a year of admin
    // changes for compliance; configurable via AUDIT_LOG_RETENTION_DAYS.
    // Setting the env var to "0" or a negative number disables the sweep.
    const retentionDays = Number(process.env.AUDIT_LOG_RETENTION_DAYS ?? "365");
    let prunedAuditRows: { id: number }[] = [];
    if (Number.isFinite(retentionDays) && retentionDays > 0) {
      const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
      prunedAuditRows = await db
        .delete(auditLog)
        .where(lt(auditLog.createdAt, cutoff))
        .returning({ id: auditLog.id });
    }

    // Revalidate public tournaments listing if anything changed so users
    // see the new status/registration state immediately.
    if (closed.length > 0 || completed.length > 0) {
      revalidatePath("/tournaments");
      revalidatePath("/admin/tournaments");
    }

    return NextResponse.json({
      ok: true,
      ranAt: nowIso,
      closedRegistrations: closed.length,
      completedTournaments: completed.length,
      prunedResetTokens: prunedTokens.length,
      prunedAuditRows: prunedAuditRows.length,
      auditRetentionDays: retentionDays > 0 ? retentionDays : null,
    });
  } catch (err) {
    logger.error("Maintenance cron failed", { error: String(err) });
    return NextResponse.json({ error: "Maintenance cron failed" }, { status: 500 });
  }
}

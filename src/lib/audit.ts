import type { Session } from "next-auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

/**
 * Record an admin-level mutation in the audit log.
 *
 * Fire-and-forget: the write is awaited but never throws — failures only log
 * a warning. We never want audit-log pressure to block the actual mutation.
 *
 * Call sites should pass the session of the acting admin so the log captures
 * who performed the change. Pass before/after objects (any serializable
 * shape) and they'll be stringified.
 */
export async function recordAudit(opts: {
  session: Session | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  before?: unknown;
  after?: unknown;
}) {
  const { session, action, entityType, entityId } = opts;
  try {
    const actorUserId = session?.user?.id ? Number(session.user.id) : null;
    await db.insert(auditLog).values({
      actorUserId: actorUserId && !isNaN(actorUserId) ? actorUserId : null,
      actorEmail: session?.user?.email ?? null,
      actorRole: session?.user?.role ?? null,
      action,
      entityType,
      entityId: entityId == null ? null : String(entityId),
      beforeJson: opts.before === undefined ? null : JSON.stringify(opts.before),
      afterJson: opts.after === undefined ? null : JSON.stringify(opts.after),
    });
  } catch (err) {
    logger.warn("audit log write failed", {
      action,
      entityType,
      entityId: entityId == null ? null : String(entityId),
      error: String(err),
    });
  }
}

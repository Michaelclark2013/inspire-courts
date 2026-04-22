import type { Session } from "next-auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { getClientIp } from "@/lib/rate-limit";

/**
 * Record an admin-level mutation in the audit log.
 *
 * Fire-and-forget: the write is awaited but never throws — failures only log
 * a warning. We never want audit-log pressure to block the actual mutation.
 *
 * Call sites should pass the session of the acting admin so the log captures
 * who performed the change. Pass before/after objects (any serializable
 * shape) and they'll be stringified.
 *
 * Optionally pass the Request so the log captures IP + User-Agent for
 * security investigations. Not required — routes that don't have a request
 * handy (e.g. background tasks) can omit it.
 */
export async function recordAudit(opts: {
  session: Session | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  before?: unknown;
  after?: unknown;
  request?: Request | null;
}) {
  const { session, action, entityType, entityId, request } = opts;
  try {
    const actorUserId = session?.user?.id ? Number(session.user.id) : null;

    // Capture IP + User-Agent + X-Request-Id for security investigations
    // and log correlation. Length-cap UA + requestId so a pathological
    // header can't bloat the audit table.
    let actorIp: string | null = null;
    let actorUserAgent: string | null = null;
    let requestId: string | null = null;
    if (request) {
      try {
        actorIp = getClientIp(request) || null;
      } catch {
        actorIp = null;
      }
      const ua = request.headers.get("user-agent");
      actorUserAgent = ua ? ua.slice(0, 500) : null;
      const rid = request.headers.get("x-request-id");
      requestId = rid ? rid.slice(0, 100) : null;
    }

    await db.insert(auditLog).values({
      actorUserId: actorUserId && !isNaN(actorUserId) ? actorUserId : null,
      actorEmail: session?.user?.email ?? null,
      actorRole: session?.user?.role ?? null,
      action,
      entityType,
      entityId: entityId == null ? null : String(entityId),
      beforeJson: opts.before === undefined ? null : JSON.stringify(opts.before),
      afterJson: opts.after === undefined ? null : JSON.stringify(opts.after),
      actorIp,
      actorUserAgent,
      requestId,
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

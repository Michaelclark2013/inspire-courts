import type { Session } from "next-auth";

/**
 * Safely coerce `session.user.id` (which is typed as string) to a positive
 * integer. Returns null if missing, non-numeric, or <= 0.
 *
 * Use this at the top of any route that needs `userId: number` to avoid
 * passing NaN into a DB query (which can silently match no rows — or worse,
 * depending on the driver).
 */
export function getSessionUserId(session: Session | null | undefined): number | null {
  const raw = session?.user?.id;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

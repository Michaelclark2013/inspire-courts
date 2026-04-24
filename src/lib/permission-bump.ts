import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

// Stamp `permissions_updated_at` on the affected users so lib/auth's
// JWT callback knows to re-hydrate their cached overrides on the
// next request. Call after any user_permissions mutation.
export async function bumpPermissionsUpdated(userIds: number | number[]): Promise<void> {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  if (ids.length === 0) return;
  const nowIso = new Date().toISOString();
  await db
    .update(users)
    .set({ permissionsUpdatedAt: nowIso, updatedAt: nowIso })
    .where(ids.length === 1 ? eq(users.id, ids[0]) : inArray(users.id, ids));
}

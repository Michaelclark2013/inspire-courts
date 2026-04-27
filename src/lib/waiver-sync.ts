import { db } from "@/lib/db";
import { players } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// After a waiver is signed, flip players.waiver_on_file = true for
// any roster row whose name matches case-insensitively. Best-effort,
// fire-and-forget — never throws so the waiver write itself isn't
// blocked.
//
// Why: coaches were seeing "no waiver" chips on their roster page
// even after parents had signed, because we only set waiverOnFile
// at player-add time (which checks the existing waivers table once)
// and never on subsequent waiver inserts.
export async function syncWaiverToPlayers(playerName: string): Promise<{ updated: number }> {
  const name = (playerName || "").trim().toLowerCase();
  if (!name || name.length < 2) return { updated: 0 };
  try {
    const updated = await db
      .update(players)
      .set({ waiverOnFile: true })
      .where(sql`lower(${players.name}) = ${name}`)
      .returning({ id: players.id });
    return { updated: updated.length };
  } catch (err) {
    logger.warn("waiver sync to players failed", { err: String(err), name });
    return { updated: 0 };
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { equipment } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";

// Default inventory items every gym should have tracked. Idempotent:
// looks up by name before inserting so repeated calls don't duplicate.
const DEFAULTS = [
  { name: "Basketballs (size 7)", category: "sports", onHand: 20, minQuantity: 12, unitCostCents: 2999, supplier: "Amazon" },
  { name: "Basketballs (size 6)", category: "sports", onHand: 10, minQuantity: 6, unitCostCents: 2499, supplier: "Amazon" },
  { name: "Basketballs (size 5)", category: "sports", onHand: 10, minQuantity: 6, unitCostCents: 1999, supplier: "Amazon" },
  { name: "Cones (orange)", category: "sports", onHand: 40, minQuantity: 20, unitCostCents: 199, supplier: "Amazon" },
  { name: "Pinnies (set of 10)", category: "sports", onHand: 6, minQuantity: 3, unitCostCents: 3499, supplier: "Amazon" },
  { name: "Whistles", category: "sports", onHand: 20, minQuantity: 10, unitCostCents: 399, supplier: "Amazon" },

  { name: "Scoreboard batteries (9V)", category: "av", onHand: 24, minQuantity: 12, unitCostCents: 499, supplier: "Costco" },
  { name: "Game clock (shot clock)", category: "av", onHand: 2, minQuantity: 1, unitCostCents: 29999, supplier: "Gared Sports" },
  { name: "Scorer's table horns", category: "av", onHand: 3, minQuantity: 2, unitCostCents: 4999, supplier: "Amazon" },

  { name: "Toilet paper (12-pack)", category: "janitorial", onHand: 12, minQuantity: 4, unitCostCents: 1999, supplier: "Costco" },
  { name: "Paper towels (12-pack)", category: "janitorial", onHand: 8, minQuantity: 3, unitCostCents: 2499, supplier: "Costco" },
  { name: "Hand soap (gallon)", category: "janitorial", onHand: 6, minQuantity: 2, unitCostCents: 1499, supplier: "Costco" },
  { name: "Disinfecting wipes (4-pack)", category: "janitorial", onHand: 5, minQuantity: 2, unitCostCents: 1999, supplier: "Costco" },
  { name: "Trash bags (100ct)", category: "janitorial", onHand: 4, minQuantity: 2, unitCostCents: 1499, supplier: "Costco" },
  { name: "Floor cleaner", category: "janitorial", onHand: 3, minQuantity: 1, unitCostCents: 1299, supplier: "Home Depot" },

  { name: "First aid kit", category: "safety", onHand: 4, minQuantity: 2, unitCostCents: 3499, supplier: "Amazon" },
  { name: "Ice packs", category: "safety", onHand: 20, minQuantity: 10, unitCostCents: 299, supplier: "Amazon" },
  { name: "AED pads (adult)", category: "safety", onHand: 2, minQuantity: 1, unitCostCents: 4999, supplier: "Medline" },
  { name: "Band-aids (box)", category: "safety", onHand: 8, minQuantity: 4, unitCostCents: 799, supplier: "Costco" },
  { name: "Athletic tape (roll)", category: "safety", onHand: 12, minQuantity: 6, unitCostCents: 699, supplier: "Amazon" },

  { name: "Water bottles (case)", category: "concessions", onHand: 6, minQuantity: 2, unitCostCents: 1999, supplier: "Costco" },
  { name: "Gatorade (24-pack)", category: "concessions", onHand: 4, minQuantity: 2, unitCostCents: 2499, supplier: "Costco" },
  { name: "Granola bars (box)", category: "concessions", onHand: 8, minQuantity: 4, unitCostCents: 1499, supplier: "Costco" },
  { name: "Chips (variety pack)", category: "concessions", onHand: 4, minQuantity: 2, unitCostCents: 1999, supplier: "Costco" },

  { name: "Printer paper (ream)", category: "office", onHand: 10, minQuantity: 4, unitCostCents: 999, supplier: "Amazon" },
  { name: "Ballpoint pens (12-pack)", category: "office", onHand: 8, minQuantity: 3, unitCostCents: 799, supplier: "Amazon" },
  { name: "Sharpies (12-pack)", category: "office", onHand: 4, minQuantity: 2, unitCostCents: 1299, supplier: "Amazon" },
  { name: "Printer toner (black)", category: "office", onHand: 3, minQuantity: 1, unitCostCents: 7999, supplier: "Amazon" },
  { name: "Name tag stickers (roll)", category: "office", onHand: 10, minQuantity: 4, unitCostCents: 499, supplier: "Amazon" },
] as const;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    let inserted = 0;
    let skipped = 0;
    for (const d of DEFAULTS) {
      const [existing] = await db
        .select()
        .from(equipment)
        .where(eq(equipment.name, d.name))
        .limit(1);
      if (existing) { skipped++; continue; }
      await db.insert(equipment).values({
        name: d.name,
        category: d.category as (typeof equipment.$inferInsert)["category"],
        onHand: d.onHand,
        minQuantity: d.minQuantity,
        unitCostCents: d.unitCostCents,
        supplier: d.supplier,
      });
      inserted++;
    }
    await recordAudit({
      session,
      request,
      action: "seed.inventory",
      entityType: "equipment",
      entityId: 0,
      before: null,
      after: { inserted, skipped, total: DEFAULTS.length },
    });
    return NextResponse.json({ ok: true, inserted, skipped, total: DEFAULTS.length });
  } catch (err) {
    logger.error("seed inventory failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

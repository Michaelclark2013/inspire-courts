import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { membershipPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";

// Default membership tiers a training facility typically offers.
// Prices are placeholders the admin can edit after seeding.
const DEFAULTS = [
  {
    name: "Day Pass",
    type: "day_pass",
    description: "Single visit — open gym, open court, or drop-in class.",
    priceOnceCents: 2000,
    priceMonthlyCents: null,
    priceAnnualCents: null,
    includes: "open gym, open court, locker room",
    maxVisitsPerMonth: 1,
    maxVisitsPerWeek: 1,
  },
  {
    name: "10-Visit Pack",
    type: "class_pack",
    description: "10 visits, valid for 6 months — great for part-time athletes.",
    priceOnceCents: 15000,
    priceMonthlyCents: null,
    priceAnnualCents: null,
    includes: "open gym, open court, locker room, 20% off pro shop",
    maxVisitsPerMonth: null,
    maxVisitsPerWeek: null,
  },
  {
    name: "Monthly Unlimited",
    type: "unlimited",
    description: "Unlimited access — the core gym membership.",
    priceOnceCents: null,
    priceMonthlyCents: 9900,
    priceAnnualCents: 99900,
    includes: "open gym, open court, locker room, guest pass (1/mo), classes",
    maxVisitsPerMonth: null,
    maxVisitsPerWeek: null,
  },
  {
    name: "Family (up to 4)",
    type: "family",
    description: "Monthly access for up to 4 household members.",
    priceOnceCents: null,
    priceMonthlyCents: 19900,
    priceAnnualCents: 199900,
    includes: "open gym, open court, locker room, family guest passes",
    maxVisitsPerMonth: null,
    maxVisitsPerWeek: null,
  },
  {
    name: "Youth Training",
    type: "unlimited",
    description: "Under-18 athletes — includes youth clinics and camps discount.",
    priceOnceCents: null,
    priceMonthlyCents: 7900,
    priceAnnualCents: 79900,
    includes: "open gym, open court, youth clinics, 15% off camps",
    maxVisitsPerMonth: null,
    maxVisitsPerWeek: null,
  },
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
        .from(membershipPlans)
        .where(eq(membershipPlans.name, d.name))
        .limit(1);
      if (existing) { skipped++; continue; }
      await db.insert(membershipPlans).values({
        name: d.name,
        type: d.type as (typeof membershipPlans.$inferInsert)["type"],
        description: d.description,
        priceOnceCents: d.priceOnceCents,
        priceMonthlyCents: d.priceMonthlyCents,
        priceAnnualCents: d.priceAnnualCents,
        includes: d.includes,
        maxVisitsPerMonth: d.maxVisitsPerMonth,
        maxVisitsPerWeek: d.maxVisitsPerWeek,
      });
      inserted++;
    }
    await recordAudit({
      session,
      request,
      action: "seed.membership_plans",
      entityType: "membership_plan",
      entityId: 0,
      before: null,
      after: { inserted, skipped, total: DEFAULTS.length },
    });
    return NextResponse.json({ ok: true, inserted, skipped, total: DEFAULTS.length });
  } catch (err) {
    logger.error("seed membership plans failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

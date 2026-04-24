import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  resources,
  resourceBookings,
  resourceMaintenance,
  resourceDamage,
} from "@/lib/db/schema";
import { and, eq, desc, gte } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/fleet/[id] — full vehicle dossier: vehicle row, all
// bookings past+future, maintenance log, open damage reports.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const [vehicle] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, id))
      .limit(1);
    if (!vehicle) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const [bookings, maintenance, damage] = await Promise.all([
      db
        .select()
        .from(resourceBookings)
        .where(eq(resourceBookings.resourceId, id))
        .orderBy(desc(resourceBookings.startAt))
        .limit(50),
      db
        .select()
        .from(resourceMaintenance)
        .where(eq(resourceMaintenance.resourceId, id))
        .orderBy(desc(resourceMaintenance.performedAt))
        .limit(30),
      db
        .select()
        .from(resourceDamage)
        .where(eq(resourceDamage.resourceId, id))
        .orderBy(desc(resourceDamage.reportedAt))
        .limit(30),
    ]);

    const upcoming = bookings.filter(
      (b) => b.endAt >= nowIso && b.status !== "cancelled"
    );
    const past = bookings.filter(
      (b) => b.endAt < nowIso || b.status === "cancelled"
    );

    return NextResponse.json(
      { vehicle, upcoming, past, maintenance, damage },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("fleet detail failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to load vehicle" }, { status: 500 });
  }
}

// PATCH /api/admin/fleet/[id] — update vehicle fields.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    // Allow-list the fields that can be patched.
    const ALLOWED = new Set([
      "name", "description", "make", "model", "year", "color", "licensePlate",
      "vin", "seats", "capacity", "transmission", "fuelType", "currentMileage",
      "dailyRateCents", "hourlyRateCents", "weeklyRateCents", "monthlyRateCents",
      "mileageIncludedPerDay", "mileageOverageCentsPerMile",
      "lateFeeCentsPerHour", "securityDepositCents",
      "insuranceProvider", "insurancePolicyNumber", "insuranceExpiry",
      "registrationExpiry", "nextOilChangeMileage", "nextInspectionAt",
      "imageUrl", "vehicleStatus", "active", "notes",
    ]);
    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED.has(k)) update[k] = v;
    }
    update.updatedAt = new Date().toISOString();

    const [updated] = await db
      .update(resources)
      .set(update)
      .where(eq(resources.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("fleet patch failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  resources,
  resourceBookings,
  resourceDamage,
  RESOURCE_KINDS,
} from "@/lib/db/schema";
import { and, asc, eq, gte, lte, inArray, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/fleet
// Rental-car command view. Returns every vehicle with:
//   - live status (available / currently-rented / in-maintenance / out-of-service)
//   - active booking (if any)
//   - next upcoming booking
//   - open damage count
//   - service-due flags (mileage past threshold, expiring registration/insurance)
//   - rolling 30-day revenue
//
// One endpoint feeds the full dashboard so the client doesn't have to
// fan out to N vehicle-specific routes.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const nowIso = new Date().toISOString();
    const thirtyDaysAhead = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const vehicles = await db
      .select()
      .from(resources)
      .where(eq(resources.active, true))
      .orderBy(asc(resources.name));

    const ids = vehicles.map((v) => v.id);

    // Bundle everything per-vehicle in parallel when ids exist.
    const [activeBookings, upcomingBookings, damageCounts, revenue30] = ids.length
      ? await Promise.all([
          // Active = currently in_use or confirmed & straddling now.
          db
            .select()
            .from(resourceBookings)
            .where(
              and(
                inArray(resourceBookings.resourceId, ids),
                inArray(resourceBookings.status, ["in_use", "confirmed"]),
                lte(resourceBookings.startAt, nowIso),
                gte(resourceBookings.endAt, nowIso)
              )
            ),
          // Upcoming = future start, next 30 days, not cancelled.
          db
            .select()
            .from(resourceBookings)
            .where(
              and(
                inArray(resourceBookings.resourceId, ids),
                gte(resourceBookings.startAt, nowIso),
                lte(resourceBookings.startAt, thirtyDaysAhead),
                inArray(resourceBookings.status, [
                  "tentative",
                  "confirmed",
                  "in_use",
                ])
              )
            )
            .orderBy(asc(resourceBookings.startAt)),
          // Open damage incidents count.
          db
            .select({
              resourceId: resourceDamage.resourceId,
              count: sql<number>`count(*)`,
            })
            .from(resourceDamage)
            .where(
              and(
                inArray(resourceDamage.resourceId, ids),
                eq(resourceDamage.repaired, false)
              )
            )
            .groupBy(resourceDamage.resourceId),
          // Revenue last 30 days — sum of returned bookings' totals.
          db
            .select({
              resourceId: resourceBookings.resourceId,
              sum: sql<number>`coalesce(sum(${resourceBookings.totalCents}), 0)`,
            })
            .from(resourceBookings)
            .where(
              and(
                inArray(resourceBookings.resourceId, ids),
                eq(resourceBookings.status, "returned"),
                gte(resourceBookings.checkinAt, thirtyDaysAgo)
              )
            )
            .groupBy(resourceBookings.resourceId),
        ])
      : [[], [], [], []];

    const activeByVehicle = new Map(
      activeBookings.map((b) => [b.resourceId, b])
    );
    const nextByVehicle = new Map<number, typeof upcomingBookings[number]>();
    for (const b of upcomingBookings) {
      if (!nextByVehicle.has(b.resourceId)) nextByVehicle.set(b.resourceId, b);
    }
    const damageByVehicle = Object.fromEntries(
      damageCounts.map((r) => [r.resourceId, Number(r.count) || 0])
    );
    const revenueByVehicle = Object.fromEntries(
      revenue30.map((r) => [r.resourceId, Number(r.sum) || 0])
    );

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const enriched = vehicles.map((v) => {
      const active = activeByVehicle.get(v.id) ?? null;
      const next = nextByVehicle.get(v.id) ?? null;

      // Derive a single display status from the lifecycle flag + active booking.
      let displayStatus: string = v.vehicleStatus;
      if (v.vehicleStatus === "available" && active) displayStatus = "rented";
      if (v.vehicleStatus === "available" && !active && next) {
        const until = new Date(next.startAt).getTime() - now;
        if (until <= 24 * 60 * 60 * 1000) displayStatus = "reserved";
      }

      // Alerts — expiries + service-due.
      const alerts: string[] = [];
      if (v.insuranceExpiry) {
        const ms = new Date(v.insuranceExpiry).getTime() - now;
        if (ms < 0) alerts.push("insurance_expired");
        else if (ms < THIRTY_DAYS_MS) alerts.push("insurance_expiring");
      }
      if (v.registrationExpiry) {
        const ms = new Date(v.registrationExpiry).getTime() - now;
        if (ms < 0) alerts.push("registration_expired");
        else if (ms < THIRTY_DAYS_MS) alerts.push("registration_expiring");
      }
      if (
        typeof v.currentMileage === "number" &&
        typeof v.nextOilChangeMileage === "number" &&
        v.currentMileage >= v.nextOilChangeMileage
      ) {
        alerts.push("service_due");
      }
      if (v.nextInspectionAt) {
        const ms = new Date(v.nextInspectionAt).getTime() - now;
        if (ms < 0) alerts.push("inspection_overdue");
        else if (ms < THIRTY_DAYS_MS) alerts.push("inspection_soon");
      }

      return {
        ...v,
        displayStatus,
        activeBooking: active,
        nextBooking: next,
        openDamageCount: damageByVehicle[v.id] ?? 0,
        revenue30Cents: revenueByVehicle[v.id] ?? 0,
        alerts,
      };
    });

    // Fleet-wide rollup.
    const totals = {
      vehicles: enriched.length,
      available: enriched.filter((v) => v.displayStatus === "available").length,
      rented: enriched.filter((v) => v.displayStatus === "rented").length,
      reserved: enriched.filter((v) => v.displayStatus === "reserved").length,
      maintenance: enriched.filter((v) => v.displayStatus === "maintenance").length,
      outOfService: enriched.filter((v) => v.displayStatus === "out_of_service").length,
      revenue30Cents: enriched.reduce((s, v) => s + v.revenue30Cents, 0),
      alertCount: enriched.reduce((s, v) => s + v.alerts.length, 0),
      openDamage: enriched.reduce((s, v) => s + v.openDamageCount, 0),
      upcomingBookings: upcomingBookings.length,
    };

    return NextResponse.json(
      { vehicles: enriched, totals, asOf: nowIso },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("fleet overview failed", { error: String(err) });
    return NextResponse.json(
      { error: "Failed to load fleet" },
      { status: 500 }
    );
  }
}

// POST /api/admin/fleet — create a new vehicle.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const numOrNull = (v: unknown): number | null => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const str = (v: unknown): string | null =>
      typeof v === "string" && v.trim() ? v.trim() : null;

    const requestedKind = typeof body?.kind === "string" ? body.kind : "vehicle";
    const kind = (RESOURCE_KINDS as readonly string[]).includes(requestedKind)
      ? (requestedKind as (typeof RESOURCE_KINDS)[number])
      : "vehicle";

    const [created] = await db
      .insert(resources)
      .values({
        name,
        kind,
        description: str(body?.description),
        licensePlate: str(body?.licensePlate),
        vin: str(body?.vin),
        make: str(body?.make),
        model: str(body?.model),
        year: numOrNull(body?.year),
        color: str(body?.color),
        transmission: str(body?.transmission),
        fuelType: str(body?.fuelType),
        seats: numOrNull(body?.seats),
        capacity: numOrNull(body?.capacity),
        currentMileage: numOrNull(body?.currentMileage),
        dailyRateCents: numOrNull(body?.dailyRateCents),
        hourlyRateCents: numOrNull(body?.hourlyRateCents),
        weeklyRateCents: numOrNull(body?.weeklyRateCents),
        monthlyRateCents: numOrNull(body?.monthlyRateCents),
        mileageIncludedPerDay: numOrNull(body?.mileageIncludedPerDay),
        mileageOverageCentsPerMile: numOrNull(body?.mileageOverageCentsPerMile),
        lateFeeCentsPerHour: numOrNull(body?.lateFeeCentsPerHour),
        securityDepositCents: numOrNull(body?.securityDepositCents),
        registrationExpiry: str(body?.registrationExpiry),
        insuranceProvider: str(body?.insuranceProvider),
        insurancePolicyNumber: str(body?.insurancePolicyNumber),
        insuranceExpiry: str(body?.insuranceExpiry),
        imageUrl: str(body?.imageUrl),
        notes: str(body?.notes),
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("fleet create failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
  }
}

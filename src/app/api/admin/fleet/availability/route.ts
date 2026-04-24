import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceBookings } from "@/lib/db/schema";
import { and, eq, gte, lte, ne, inArray, or, lt, gt } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/fleet/availability?start=ISO&end=ISO[&excludeBookingId=N]
// Returns every active vehicle with a boolean `available` flag against
// the requested window. Used by the rental-create form to pick a van
// that isn't already booked.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const excludeId = Number(searchParams.get("excludeBookingId") || 0);
    if (!start || !end) {
      return NextResponse.json(
        { error: "start and end required (ISO)" },
        { status: 400 }
      );
    }
    if (new Date(end).getTime() <= new Date(start).getTime()) {
      return NextResponse.json(
        { error: "end must be after start" },
        { status: 400 }
      );
    }

    const vehicles = await db
      .select()
      .from(resources)
      .where(eq(resources.active, true));

    // Overlap rule: existing.start < requested.end AND existing.end > requested.start.
    // Cancelled/no_show/returned don't block the resource.
    const conflicts = await db
      .select()
      .from(resourceBookings)
      .where(
        and(
          inArray(resourceBookings.status, ["tentative", "confirmed", "in_use"]),
          lt(resourceBookings.startAt, end),
          gt(resourceBookings.endAt, start),
          excludeId > 0 ? ne(resourceBookings.id, excludeId) : undefined
        )
      );

    const conflictByVehicle = new Map<number, typeof conflicts>();
    for (const c of conflicts) {
      const list = conflictByVehicle.get(c.resourceId) || [];
      list.push(c);
      conflictByVehicle.set(c.resourceId, list);
    }

    const result = vehicles.map((v) => {
      const cs = conflictByVehicle.get(v.id) || [];
      const blockedByStatus =
        v.vehicleStatus === "maintenance" || v.vehicleStatus === "out_of_service";
      return {
        id: v.id,
        name: v.name,
        make: v.make,
        model: v.model,
        year: v.year,
        licensePlate: v.licensePlate,
        seats: v.seats,
        vehicleStatus: v.vehicleStatus,
        dailyRateCents: v.dailyRateCents,
        available: cs.length === 0 && !blockedByStatus,
        blockedByStatus,
        conflicts: cs.map((c) => ({
          id: c.id,
          startAt: c.startAt,
          endAt: c.endAt,
          status: c.status,
          renterName: c.renterName,
        })),
      };
    });

    return NextResponse.json(
      { window: { start, end }, vehicles: result },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    logger.error("fleet availability failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { resourceBookings, resources, RESOURCE_BOOKING_STATUS } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

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
  const [row] = await db
    .select({ booking: resourceBookings, vehicle: resources })
    .from(resourceBookings)
    .leftJoin(resources, eq(resources.id, resourceBookings.resourceId))
    .where(eq(resourceBookings.id, id))
    .limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

// PATCH /api/admin/rentals/[id] — generic update (status, notes, paid flag,
// odometer/fuel captures, deposit release). Recomputes totalCents when
// checkin fields are present.
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
    const [before] = await db.select().from(resourceBookings).where(eq(resourceBookings.id, id)).limit(1);
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const [vehicle] = await db.select().from(resources).where(eq(resources.id, before.resourceId)).limit(1);

    const ALLOWED = new Set([
      "status", "notes", "paid", "paymentMethod",
      "odometerStart", "odometerEnd", "fuelStart", "fuelEnd",
      "checkoutAt", "checkinAt", "signatureUrl",
      "renterLicenseNumber", "renterLicenseState", "renterLicenseExpiry",
      "renterLicensePhotoUrl",
      "renterInsuranceProvider", "renterInsurancePolicyNumber",
      "renterInsuranceExpiry", "renterInsurancePhotoUrl",
      "renterRegistrationNumber", "renterRegistrationState", "renterRegistrationExpiry",
      "declinedCollisionWaiver",
      "additionalDriverName", "additionalDriverLicense",
      "depositReleased", "depositReleasedAt",
      "damageChargeCents", "fuelChargeCents", "lateFeeCents",
    ]);
    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED.has(k)) update[k] = v;
    }

    // Guard status enum
    if (typeof update.status === "string" &&
        !(RESOURCE_BOOKING_STATUS as readonly string[]).includes(update.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // If checking in (odometerEnd set or status moving to "returned"),
    // compute mileage overage + late fee + total.
    const finishing =
      update.status === "returned" ||
      typeof update.odometerEnd === "number" ||
      typeof update.checkinAt === "string";

    if (finishing && vehicle) {
      const odoStart =
        (typeof update.odometerStart === "number"
          ? (update.odometerStart as number)
          : before.odometerStart) ?? null;
      const odoEnd =
        (typeof update.odometerEnd === "number"
          ? (update.odometerEnd as number)
          : before.odometerEnd) ?? null;
      const mileageDriven =
        odoStart !== null && odoEnd !== null ? Math.max(0, odoEnd - odoStart) : null;

      // Mileage overage.
      let mileageOverageCents = 0;
      if (
        mileageDriven !== null &&
        vehicle.mileageIncludedPerDay &&
        vehicle.mileageOverageCentsPerMile
      ) {
        const hours = Math.max(
          1,
          (new Date(before.endAt).getTime() - new Date(before.startAt).getTime()) /
            (1000 * 60 * 60)
        );
        const days = Math.max(1, Math.ceil(hours / 24));
        const allowed = vehicle.mileageIncludedPerDay * days;
        const overMiles = Math.max(0, mileageDriven - allowed);
        mileageOverageCents = overMiles * vehicle.mileageOverageCentsPerMile;
      }

      // Late fee.
      let lateFeeCents = Number(update.lateFeeCents ?? before.lateFeeCents ?? 0);
      const effectiveCheckin =
        (typeof update.checkinAt === "string" ? update.checkinAt : null) ||
        new Date().toISOString();
      if (vehicle.lateFeeCentsPerHour) {
        const lateMs = new Date(effectiveCheckin).getTime() - new Date(before.endAt).getTime();
        if (lateMs > 0) {
          const hoursLate = Math.ceil(lateMs / (1000 * 60 * 60));
          lateFeeCents = hoursLate * vehicle.lateFeeCentsPerHour;
        }
      }

      const fuelCharge = Number(update.fuelChargeCents ?? before.fuelChargeCents ?? 0);
      const damageCharge = Number(update.damageChargeCents ?? before.damageChargeCents ?? 0);

      const totalCents =
        (before.amountCents ?? 0) +
        (mileageOverageCents || 0) +
        (lateFeeCents || 0) +
        (fuelCharge || 0) +
        (damageCharge || 0);

      update.mileageDriven = mileageDriven;
      update.mileageOverageCents = mileageOverageCents;
      update.lateFeeCents = lateFeeCents;
      update.totalCents = totalCents;
      if (!update.checkinAt) update.checkinAt = effectiveCheckin;
      if (!update.status) update.status = "returned";

      // Sync vehicle current mileage.
      if (odoEnd !== null) {
        await db
          .update(resources)
          .set({ currentMileage: odoEnd, updatedAt: new Date().toISOString() })
          .where(eq(resources.id, before.resourceId));
      }
    }

    update.updatedAt = new Date().toISOString();

    const [updated] = await db
      .update(resourceBookings)
      .set(update)
      .where(eq(resourceBookings.id, id))
      .returning();
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("rental patch failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to update rental" }, { status: 500 });
  }
}

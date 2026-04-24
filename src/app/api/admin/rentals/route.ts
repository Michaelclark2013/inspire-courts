import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  resourceBookings,
  resources,
  RESOURCE_BOOKING_STATUS,
} from "@/lib/db/schema";
import { and, desc, eq, gt, inArray, lt } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/admin/rentals?status=...
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const where =
      status && (RESOURCE_BOOKING_STATUS as readonly string[]).includes(status)
        ? eq(resourceBookings.status, status as (typeof RESOURCE_BOOKING_STATUS)[number])
        : undefined;

    const rows = await db
      .select({
        booking: resourceBookings,
        vehicleName: resources.name,
        vehiclePlate: resources.licensePlate,
      })
      .from(resourceBookings)
      .leftJoin(resources, eq(resources.id, resourceBookings.resourceId))
      .where(where)
      .orderBy(desc(resourceBookings.startAt))
      .limit(200);

    return NextResponse.json(rows, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    logger.error("rentals list failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// POST /api/admin/rentals — create a rental with conflict check + auto-price.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const resourceId = Number(body?.resourceId);
    const startAt = typeof body?.startAt === "string" ? body.startAt : "";
    const endAt = typeof body?.endAt === "string" ? body.endAt : "";
    const renterName = typeof body?.renterName === "string" ? body.renterName.trim() : "";
    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      return NextResponse.json({ error: "Vehicle required" }, { status: 400 });
    }
    if (!startAt || !endAt) {
      return NextResponse.json({ error: "Start/end required" }, { status: 400 });
    }
    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      return NextResponse.json({ error: "End must be after start" }, { status: 400 });
    }
    if (!renterName && !body?.renterUserId) {
      return NextResponse.json({ error: "Renter name or user required" }, { status: 400 });
    }

    // Conflict check.
    const conflicts = await db
      .select({ id: resourceBookings.id })
      .from(resourceBookings)
      .where(
        and(
          eq(resourceBookings.resourceId, resourceId),
          inArray(resourceBookings.status, ["tentative", "confirmed", "in_use"]),
          lt(resourceBookings.startAt, endAt),
          gt(resourceBookings.endAt, startAt)
        )
      );
    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: "This window overlaps an existing rental", conflictIds: conflicts.map((c) => c.id) },
        { status: 409 }
      );
    }

    // Auto-price based on the vehicle rate card + duration.
    const [v] = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
    if (!v) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

    const hours = Math.max(
      1,
      (new Date(endAt).getTime() - new Date(startAt).getTime()) / (1000 * 60 * 60)
    );
    const days = Math.max(1, Math.ceil(hours / 24));
    const weeks = Math.ceil(days / 7);

    let amountCents = 0;
    // Use the most favorable rate for the duration.
    if (days >= 28 && v.monthlyRateCents) {
      amountCents = v.monthlyRateCents * Math.ceil(days / 28);
    } else if (days >= 7 && v.weeklyRateCents) {
      amountCents = v.weeklyRateCents * weeks;
    } else if (v.dailyRateCents) {
      amountCents = v.dailyRateCents * days;
    } else if (v.hourlyRateCents) {
      amountCents = Math.round(v.hourlyRateCents * hours);
    }

    const contractNumber = `RENT-${Date.now().toString(36).toUpperCase()}`;

    const [created] = await db
      .insert(resourceBookings)
      .values({
        resourceId,
        renterUserId: body?.renterUserId ? Number(body.renterUserId) : null,
        renterName: renterName || null,
        renterEmail: typeof body?.renterEmail === "string" ? body.renterEmail.trim() || null : null,
        renterPhone: typeof body?.renterPhone === "string" ? body.renterPhone.trim() || null : null,
        renterLicenseNumber: typeof body?.renterLicenseNumber === "string"
          ? body.renterLicenseNumber.trim() || null : null,
        renterLicenseState: typeof body?.renterLicenseState === "string"
          ? body.renterLicenseState.trim() || null : null,
        renterLicenseExpiry: typeof body?.renterLicenseExpiry === "string"
          ? body.renterLicenseExpiry.trim() || null : null,
        startAt,
        endAt,
        status: (RESOURCE_BOOKING_STATUS as readonly string[]).includes(body?.status)
          ? body.status
          : "confirmed",
        amountCents,
        securityDepositCents: v.securityDepositCents ?? 0,
        contractNumber,
        purpose: typeof body?.purpose === "string" ? body.purpose.trim() || null : null,
        notes: typeof body?.notes === "string" ? body.notes.trim() || null : null,
        createdBy: Number(session.user.id),
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    logger.error("rental create failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to create rental" }, { status: 500 });
  }
}

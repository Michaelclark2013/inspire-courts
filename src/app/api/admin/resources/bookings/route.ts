import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources, resourceBookings, users } from "@/lib/db/schema";
import {
  and,
  asc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  ne,
  or,
  type SQL} from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { canAccess } from "@/lib/permissions";
import {
  resourceBookingCreateSchema,
  resourceBookingUpdateSchema} from "@/lib/schemas";
import { parseJsonBody, apiError, apiNotFound } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// Rate-based amount calc. Prefer dailyRateCents when duration ≥ 20h
// so a full-day rental doesn't get priced as 24h × hourly; otherwise
// round up to the next hour against hourlyRateCents.
function computeAmountCents(
  durationMs: number,
  dailyCents: number | null,
  hourlyCents: number | null
): number {
  const hours = durationMs / (1000 * 60 * 60);
  if (hours >= 20 && dailyCents != null) {
    const days = Math.ceil(hours / 24);
    return days * dailyCents;
  }
  if (hourlyCents != null) {
    return Math.ceil(hours) * hourlyCents;
  }
  if (dailyCents != null) {
    return Math.max(1, Math.ceil(hours / 24)) * dailyCents;
  }
  return 0;
}

// Detect overlap: a new booking overlaps an existing one when
// new.startAt < existing.endAt AND existing.startAt < new.endAt,
// excluding cancelled/no_show. Optionally skip a specific booking id
// (when editing an existing booking).
async function findOverlaps(
  resourceId: number,
  startAt: string,
  endAt: string,
  ignoreId?: number
) {
  const filters: SQL[] = [
    eq(resourceBookings.resourceId, resourceId),
    inArray(resourceBookings.status, [
      "tentative",
      "confirmed",
      "in_use",
    ]),
    lt(resourceBookings.startAt, endAt),
    gt(resourceBookings.endAt, startAt),
  ];
  if (ignoreId != null) filters.push(ne(resourceBookings.id, ignoreId));
  return db
    .select({
      id: resourceBookings.id,
      startAt: resourceBookings.startAt,
      endAt: resourceBookings.endAt,
      status: resourceBookings.status,
      renterName: resourceBookings.renterName,
    })
    .from(resourceBookings)
    .where(and(...filters));
}

// GET /api/admin/resources/bookings — list bookings for a calendar view.
//   ?resourceId=123        filter to one resource
//   ?from=ISO&to=ISO       default: today - 14d → today + 60d
//   ?status=               narrow to a single status bucket
export const GET = withTiming(
  "admin.resources.bookings.list",
  async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
      return apiError("Unauthorized", 401);
    }

    const sp = request.nextUrl.searchParams;
    const resourceIdRaw = sp.get("resourceId");
    const statusFilter = sp.get("status");
    const from =
      sp.get("from") ||
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const to =
      sp.get("to") ||
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const filters: SQL[] = [
      // Overlap with the window (start < window-end AND end > window-start)
      or(
        and(gte(resourceBookings.startAt, from), lt(resourceBookings.startAt, to)),
        and(gt(resourceBookings.endAt, from), lt(resourceBookings.endAt, to)),
        and(lt(resourceBookings.startAt, from), gt(resourceBookings.endAt, to))
      )!,
    ];
    const resourceId = Number(resourceIdRaw);
    if (resourceIdRaw && Number.isInteger(resourceId) && resourceId > 0) {
      filters.push(eq(resourceBookings.resourceId, resourceId));
    }
    if (
      statusFilter &&
      ["tentative", "confirmed", "in_use", "returned", "cancelled", "no_show"].includes(
        statusFilter
      )
    ) {
      filters.push(
        eq(
          resourceBookings.status,
          statusFilter as
            | "tentative"
            | "confirmed"
            | "in_use"
            | "returned"
            | "cancelled"
            | "no_show"
        )
      );
    }

    try {
      const rows = await db
        .select({
          id: resourceBookings.id,
          resourceId: resourceBookings.resourceId,
          resourceName: resources.name,
          resourceKind: resources.kind,
          renterUserId: resourceBookings.renterUserId,
          renterUserName: users.name,
          renterName: resourceBookings.renterName,
          renterEmail: resourceBookings.renterEmail,
          renterPhone: resourceBookings.renterPhone,
          startAt: resourceBookings.startAt,
          endAt: resourceBookings.endAt,
          status: resourceBookings.status,
          amountCents: resourceBookings.amountCents,
          paid: resourceBookings.paid,
          purpose: resourceBookings.purpose,
          odometerStart: resourceBookings.odometerStart,
          odometerEnd: resourceBookings.odometerEnd,
          notes: resourceBookings.notes,
        })
        .from(resourceBookings)
        .leftJoin(resources, eq(resources.id, resourceBookings.resourceId))
        .leftJoin(users, eq(users.id, resourceBookings.renterUserId))
        .where(and(...filters))
        .orderBy(asc(resourceBookings.startAt));

      return NextResponse.json(
        { data: rows, total: rows.length, from, to },
        { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } }
      );
    } catch (err) {
      logger.error("Failed to fetch bookings", { error: String(err) });
      return apiError("Failed to fetch bookings", 500);
    }
  }
);

// POST /api/admin/resources/bookings — create a booking.
// Detects overlaps and rejects with 409 unless ?force=true is set.
// Computes amountCents from the resource's rate if not provided.
export const POST = withTiming(
  "admin.resources.bookings.create",
  async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
      return apiError("Unauthorized", 401);
    }

    const force = request.nextUrl.searchParams.get("force") === "true";

    const parsed = await parseJsonBody(request, resourceBookingCreateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    try {
      const [resource] = await db
        .select()
        .from(resources)
        .where(eq(resources.id, body.resourceId))
        .limit(1);
      if (!resource) return apiNotFound("Resource not found");
      if (!resource.active) {
        return apiError("Resource is archived — reactivate before booking", 409);
      }

      if (!force) {
        const overlaps = await findOverlaps(body.resourceId, body.startAt, body.endAt);
        if (overlaps.length > 0) {
          return apiError("Booking window overlaps existing bookings", 409, {
            extras: { overlaps },
          });
        }
      }

      const durationMs = Date.parse(body.endAt) - Date.parse(body.startAt);
      const amount =
        body.amountCents ??
        computeAmountCents(
          durationMs,
          resource.dailyRateCents,
          resource.hourlyRateCents
        );

      const userId = session.user.id ? Number(session.user.id) : null;
      const [created] = await db
        .insert(resourceBookings)
        .values({
          resourceId: body.resourceId,
          renterUserId: body.renterUserId ?? null,
          renterName: body.renterName ?? null,
          renterEmail: body.renterEmail ?? null,
          renterPhone: body.renterPhone ?? null,
          startAt: body.startAt,
          endAt: body.endAt,
          status: body.status ?? "tentative",
          amountCents: amount,
          paid: body.paid ?? false,
          paymentMethod: body.paymentMethod ?? null,
          odometerStart: body.odometerStart ?? null,
          fuelStart: body.fuelStart ?? null,
          purpose: body.purpose ?? null,
          notes: body.notes ?? null,
          createdBy: userId && !isNaN(userId) ? userId : null,
        })
        .returning();

      await recordAudit({
        session,
        request,
        action: "resource_booking.created",
        entityType: "resource_booking",
        entityId: created.id,
        before: null,
        after: {
          resourceId: created.resourceId,
          resourceName: resource.name,
          renter: created.renterName ?? created.renterUserId,
          startAt: created.startAt,
          endAt: created.endAt,
          amountCents: created.amountCents,
          forced: force,
        },
      });

      return NextResponse.json(created, { status: 201 });
    } catch (err) {
      logger.error("Failed to create booking", { error: String(err) });
      return apiError("Failed to create booking", 500);
    }
  }
);

export const PUT = withTiming(
  "admin.resources.bookings.update",
  async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
      return apiError("Unauthorized", 401);
    }

    const force = request.nextUrl.searchParams.get("force") === "true";

    const parsed = await parseJsonBody(request, resourceBookingUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    try {
      const [before] = await db
        .select()
        .from(resourceBookings)
        .where(eq(resourceBookings.id, body.id))
        .limit(1);
      if (!before) return apiNotFound("Booking not found");

      const nextStart = body.startAt ?? before.startAt;
      const nextEnd = body.endAt ?? before.endAt;

      // Only re-check overlap if the window actually moved.
      if (
        !force &&
        (body.startAt !== undefined || body.endAt !== undefined)
      ) {
        const overlaps = await findOverlaps(
          before.resourceId,
          nextStart,
          nextEnd,
          before.id
        );
        if (overlaps.length > 0) {
          return apiError("Booking window overlaps existing bookings", 409, {
            extras: { overlaps },
          });
        }
      }

      const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (body.renterUserId !== undefined) updates.renterUserId = body.renterUserId;
      if (body.renterName !== undefined) updates.renterName = body.renterName;
      if (body.renterEmail !== undefined) updates.renterEmail = body.renterEmail;
      if (body.renterPhone !== undefined) updates.renterPhone = body.renterPhone;
      if (body.startAt !== undefined) updates.startAt = body.startAt;
      if (body.endAt !== undefined) updates.endAt = body.endAt;
      if (body.status !== undefined) updates.status = body.status;
      if (body.amountCents !== undefined) updates.amountCents = body.amountCents;
      if (body.paid !== undefined) updates.paid = body.paid;
      if (body.paymentMethod !== undefined) updates.paymentMethod = body.paymentMethod;
      if (body.odometerStart !== undefined) updates.odometerStart = body.odometerStart;
      if (body.odometerEnd !== undefined) updates.odometerEnd = body.odometerEnd;
      if (body.fuelStart !== undefined) updates.fuelStart = body.fuelStart;
      if (body.fuelEnd !== undefined) updates.fuelEnd = body.fuelEnd;
      if (body.purpose !== undefined) updates.purpose = body.purpose;
      if (body.notes !== undefined) updates.notes = body.notes;

      const [updated] = await db
        .update(resourceBookings)
        .set(updates)
        .where(eq(resourceBookings.id, body.id))
        .returning();

      const statusChanged = body.status !== undefined && body.status !== before.status;
      await recordAudit({
        session,
        request,
        action: statusChanged
          ? `resource_booking.${body.status}`
          : "resource_booking.updated",
        entityType: "resource_booking",
        entityId: body.id,
        before: {
          startAt: before.startAt,
          endAt: before.endAt,
          status: before.status,
          amountCents: before.amountCents,
          paid: before.paid,
        },
        after: updates,
      });

      return NextResponse.json(updated);
    } catch (err) {
      logger.error("Failed to update booking", { error: String(err) });
      return apiError("Failed to update booking", 500);
    }
  }
);

export const DELETE = withTiming(
  "admin.resources.bookings.delete",
  async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
      return apiError("Unauthorized", 401);
    }

    const idRaw = request.nextUrl.searchParams.get("id");
    const id = Number(idRaw);
    if (!idRaw || !Number.isInteger(id) || id <= 0) return apiError("Valid id required", 400);

    try {
      const [before] = await db
        .select()
        .from(resourceBookings)
        .where(eq(resourceBookings.id, id))
        .limit(1);
      if (!before) return apiNotFound("Booking not found");

      // Soft-cancel rather than hard-delete so we never lose rental
      // history (important for vehicle liability questions).
      await db
        .update(resourceBookings)
        .set({ status: "cancelled", updatedAt: new Date().toISOString() })
        .where(eq(resourceBookings.id, id));

      await recordAudit({
        session,
        request,
        action: "resource_booking.cancelled",
        entityType: "resource_booking",
        entityId: id,
        before: { status: before.status },
        after: { status: "cancelled" },
      });

      return NextResponse.json({ ok: true });
    } catch (err) {
      logger.error("Failed to cancel booking", { error: String(err) });
      return apiError("Failed to cancel booking", 500);
    }
  }
);

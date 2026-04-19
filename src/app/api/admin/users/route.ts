import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql, asc, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

// Whitelist of safe sortable columns. Never let clients inject arbitrary
// column names into an ORDER BY clause.
const USER_SORT_COLUMNS = {
  name: users.name,
  email: users.email,
  role: users.role,
  createdAt: users.createdAt,
} as const;

// GET /api/admin/users — list users with total count and optional sort.
//   ?sort=name|email|role|createdAt   (default: createdAt)
//   ?dir=asc|desc                     (default: desc for createdAt, asc otherwise)
// Response: { data: User[], total }
// Note: non-paginated today (user counts are small) but the response shape
// is pagination-ready so adding ?page+?limit later is non-breaking.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const sortKey = (sp.get("sort") || "createdAt") as keyof typeof USER_SORT_COLUMNS;
  const sortCol = USER_SORT_COLUMNS[sortKey] || users.createdAt;
  const dir = sp.get("dir") === "asc" ? asc : sp.get("dir") === "desc" ? desc : null;
  // Default direction: createdAt is newest-first; text columns sort A-Z.
  const orderBy = dir ? dir(sortCol) : sortKey === "createdAt" ? desc(sortCol) : asc(sortCol);

  try {
    const [allUsers, [{ total }]] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          phone: users.phone,
          memberSince: users.memberSince,
          approved: users.approved,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(orderBy),
      db.select({ total: sql<number>`count(*)` }).from(users),
    ]);

    return NextResponse.json(
      { data: allUsers, total: Number(total) || 0 },
      { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" } }
    );
  } catch (err) {
    logger.error("Failed to fetch users", { error: String(err) });
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/admin/users — create a user
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit per-IP: bcrypt.hash(password, 12) is a deliberate CPU bottleneck;
  // a compromised admin session could otherwise flood this endpoint and
  // self-DoS the API. 20 new users per minute per IP is far above legitimate use.
  const ip = getClientIp(request);
  if (isRateLimited(`admin-create-user:${ip}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many user-create requests. Slow down and try again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const body = await request.json();
    const { email, name, password, role, phone, memberSince } = body;

    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields: email, name, password, role" },
        { status: 400 }
      );
    }

    // Type + length validation. Bcrypt silently truncates passwords at
    // 72 bytes so two different long passwords can collide — reject
    // anything over 72 chars outright rather than accept a silent
    // truncation that the user doesn't know about.
    if (typeof email !== "string" || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email (max 255 chars)" }, { status: 400 });
    }
    if (typeof name !== "string" || name.length === 0 || name.length > 200) {
      return NextResponse.json({ error: "Name must be 1–200 characters" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { error: "Password must be 8–72 characters (bcrypt truncates at 72 bytes)" },
        { status: 400 }
      );
    }
    if (phone !== undefined && phone !== null && (typeof phone !== "string" || phone.length > 30)) {
      return NextResponse.json({ error: "Phone must be 30 characters or less" }, { status: 400 });
    }

    if (!["admin", "staff", "ref", "front_desk", "coach", "parent"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const safeEmail = email.trim().toLowerCase().slice(0, 255);
    const safeName = name.trim().slice(0, 200);
    const safePhone = phone ? String(phone).trim().slice(0, 30) : null;

    // Check if email already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, safeEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        email: safeEmail,
        name: safeName,
        passwordHash,
        role,
        phone: safePhone,
        memberSince: memberSince ? String(memberSince).slice(0, 10) : null,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      });

    return NextResponse.json(newUser, { status: 201 });
  } catch (err) {
    logger.error("Failed to create user", { error: String(err) });
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// PUT /api/admin/users — update a user's role, name, phone
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, role, name, phone } = body;

    const numericId = Number(id);
    if (!id || !Number.isFinite(numericId) || numericId <= 0) {
      return NextResponse.json({ error: "Missing or invalid user id" }, { status: 400 });
    }

    const validRoles = ["admin", "staff", "ref", "front_desk", "coach", "parent"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Mirror POST's type/length validation — previously name/phone were
    // inserted unchecked on PUT, so an admin session could store an
    // arbitrarily long or non-string value via PUT that POST would reject.
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0 || name.length > 200) {
        return NextResponse.json({ error: "Name must be 1–200 characters" }, { status: 400 });
      }
    }
    if (phone !== undefined && phone !== null && (typeof phone !== "string" || phone.length > 30)) {
      return NextResponse.json({ error: "Phone must be a string ≤30 chars" }, { status: 400 });
    }

    // Fetch the before-snapshot so the audit log can capture the change.
    const [before] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        phone: users.phone,
        approved: users.approved,
      })
      .from(users)
      .where(eq(users.id, numericId))
      .limit(1);

    if (!before) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (role) updates.role = role;
    if (name) updates.name = name.trim().slice(0, 200);
    if (phone !== undefined) updates.phone = phone ? String(phone).trim().slice(0, 30) : null;
    if (body.approved !== undefined) updates.approved = body.approved;

    // .returning() the safe fields so the client can sync state without
    // an additional GET /api/admin/users call.
    const [updatedRow] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, numericId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        phone: users.phone,
        approved: users.approved,
        memberSince: users.memberSince,
        createdAt: users.createdAt,
      });

    // Only audit if something actually changed (excluding updatedAt).
    const changed =
      (role && role !== before.role) ||
      (name && name !== before.name) ||
      (phone !== undefined && (phone || null) !== before.phone) ||
      (body.approved !== undefined && body.approved !== before.approved);
    if (changed) {
      await recordAudit({
        session,
        action: role && role !== before.role ? "user.role_changed" : "user.updated",
        entityType: "user",
        entityId: numericId,
        before,
        after: updatedRow,
      });
    }

    return NextResponse.json({ success: true, user: updatedRow });
  } catch (err) {
    logger.error("Failed to update user", { error: String(err) });
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/admin/users — delete a user
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const numId = Number(id);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (String(numId) === String(session.user.id)) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Prevent deleting the last admin; also fetch full before-snapshot for audit.
    const [target] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        phone: users.phone,
        approved: users.approved,
      })
      .from(users)
      .where(eq(users.id, numId))
      .limit(1);

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "admin") {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, "admin"));
      if (count <= 1) {
        return NextResponse.json({ error: "Cannot delete the last admin user" }, { status: 400 });
      }
    }

    await db.delete(users).where(eq(users.id, numId));

    await recordAudit({
      session,
      action: "user.deleted",
      entityType: "user",
      entityId: numId,
      before: target,
      after: null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Failed to delete user", { error: String(err) });
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

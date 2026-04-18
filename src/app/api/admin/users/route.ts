import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

// GET /api/admin/users — list all users
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allUsers = await db
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
      .from(users);

    return NextResponse.json(allUsers, {
      headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" },
    });
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

  try {
    const body = await request.json();
    const { email, name, password, role, phone, memberSince } = body;

    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields: email, name, password, role" },
        { status: 400 }
      );
    }

    if (!["admin", "staff", "ref", "front_desk", "coach", "parent"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if email already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
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
        email,
        name,
        passwordHash,
        role,
        phone: phone || null,
        memberSince: memberSince || null,
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

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (role) updates.role = role;
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone || null;
    if (body.approved !== undefined) updates.approved = body.approved;

    await db.update(users).set(updates).where(eq(users.id, numericId));

    return NextResponse.json({ success: true });
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
    const { searchParams } = new URL(request.url);
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

    // Prevent deleting the last admin
    const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, numId)).limit(1);
    if (target?.role === "admin") {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, "admin"));
      if (count <= 1) {
        return NextResponse.json({ error: "Cannot delete the last admin user" }, { status: 400 });
      }
    }

    await db.delete(users).where(eq(users.id, numId));

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Failed to delete user", { error: String(err) });
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

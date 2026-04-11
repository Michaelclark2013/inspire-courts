import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// GET /api/admin/users — list all users
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      phone: users.phone,
      memberSince: users.memberSince,
      createdAt: users.createdAt,
    })
    .from(users);

  return NextResponse.json(allUsers);
}

// POST /api/admin/users — create a user
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
}

// DELETE /api/admin/users — delete a user
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  await db.delete(users).where(eq(users.id, numId));

  return NextResponse.json({ success: true });
}

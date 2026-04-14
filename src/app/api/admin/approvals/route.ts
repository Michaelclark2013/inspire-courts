import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return null;
  }
  return session;
}

// GET — list all pending (unapproved) users
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pending = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phone: users.phone,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.approved, false));

    return NextResponse.json({ users: pending });
  } catch (error) {
    console.error("Failed to fetch pending approvals:", error);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}

// PATCH — approve or reject a user
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, action } = await request.json();

    if (!userId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "userId and action (approve|reject) are required" },
        { status: 400 }
      );
    }

    // Verify user exists and is pending
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.approved) {
      return NextResponse.json({ error: "User is already approved" }, { status: 400 });
    }

    if (action === "approve") {
      await db
        .update(users)
        .set({ approved: true, updatedAt: new Date().toISOString() })
        .where(eq(users.id, userId));

      return NextResponse.json({ success: true, message: `${user.name} approved` });
    } else {
      // Reject = delete the user
      await db.delete(users).where(eq(users.id, userId));

      return NextResponse.json({ success: true, message: `${user.name} rejected and removed` });
    }
  } catch (error) {
    console.error("Approval action failed:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

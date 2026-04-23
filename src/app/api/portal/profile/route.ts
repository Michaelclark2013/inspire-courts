import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, teams, players, gameScores, checkins, announcements, tournaments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// GET /api/portal/profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        phone: users.phone,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only return safe fields — never expose passwordHash
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      isOAuth: user.passwordHash === "google-oauth",
    }, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

// PUT /api/portal/profile — update own profile
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  /** Strip HTML special characters to prevent XSS in stored profile data. */
  function sanitize(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const updates: Record<string, string> = {};

  if (body.name) updates.name = sanitize(String(body.name).slice(0, 100));
  if (body.phone !== undefined) updates.phone = sanitize(String(body.phone).slice(0, 20));
  if (body.newPassword) {
    if (!body.currentPassword) {
      return NextResponse.json(
        { error: "Current password is required to change password" },
        { status: 400 }
      );
    }
    // Verify current password. Always run a bcrypt.compare (against a dummy
    // hash for OAuth accounts that have no real password) so response-time
    // can't be used to distinguish OAuth from credentials accounts.
    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const isOAuth = !user || user.passwordHash === "google-oauth";
    // dummyHash is a valid bcrypt-formatted hash that will never match;
    // using a real one keeps compare() timing consistent with the real path.
    const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8.KnLq6/pNSfvWRTQNZc5J.u8M6E4S";
    const hashToCompare = isOAuth ? DUMMY_HASH : user.passwordHash;
    const valid = await bcrypt.compare(String(body.currentPassword), hashToCompare);
    if (isOAuth) {
      return NextResponse.json(
        { error: "This account uses Google sign-in; set a password via your Google account" },
        { status: 400 }
      );
    }
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }
    if (String(body.newPassword).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    updates.passwordHash = await bcrypt.hash(String(body.newPassword), 12);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}

// DELETE /api/portal/profile — delete own account
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Prevent env-based admin from deleting themselves
  if (session.user.id === "admin-env") {
    return NextResponse.json(
      { error: "This account cannot be deleted" },
      { status: 403 }
    );
  }

  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  const body = await request.json();

  // Fetch user to check auth method and role
  const [user] = await db
    .select({ passwordHash: users.passwordHash, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Don't allow admin to delete via portal self-service
  if (user.role === "admin") {
    return NextResponse.json(
      { error: "Admin accounts cannot be deleted through the portal" },
      { status: 403 }
    );
  }

  const isOAuthUser = user.passwordHash === "google-oauth";

  // OAuth users: skip password check (they never set one)
  // Credentials users: require and verify password
  if (!isOAuthUser) {
    if (!body.password) {
      return NextResponse.json(
        { error: "Password is required to delete your account" },
        { status: 400 }
      );
    }
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
    }
  }

  try {
    // Nullify foreign key references (don't delete other records, just unlink)
    await db.update(teams).set({ coachUserId: null }).where(eq(teams.coachUserId, userId));
    await db.update(players).set({ parentUserId: null }).where(eq(players.parentUserId, userId));
    await db.update(gameScores).set({ updatedBy: null }).where(eq(gameScores.updatedBy, userId));
    await db.update(checkins).set({ checkedInBy: null }).where(eq(checkins.checkedInBy, userId));
    await db.update(announcements).set({ createdBy: null }).where(eq(announcements.createdBy, userId));
    await db.update(tournaments).set({ createdBy: null }).where(eq(tournaments.createdBy, userId));

    // Delete the user
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true, deleted: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete account. Please try again." }, { status: 500 });
  }
}

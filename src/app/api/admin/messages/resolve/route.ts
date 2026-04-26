import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { apiError } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/admin/messages/resolve?email=foo@bar.com
// Used by Message buttons on rows that only have an email (e.g.
// tournament team coach contacts) — resolves to a user id so the
// caller can navigate to /admin/messages?to=USER_ID.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "messages")) {
    return apiError("Unauthorized", 401);
  }
  const sp = req.nextUrl.searchParams;
  const email = (sp.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return apiError("email required", 400);
  }
  const [row] = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    // Email is unique on users, but not lower-cased there; do an exact
    // match — most coaches sign up with the same email they're listed
    // under.
    .where(eq(users.email, email))
    .limit(1);
  if (!row) return apiError("No portal account for that email", 404);
  return NextResponse.json({ user: row });
}

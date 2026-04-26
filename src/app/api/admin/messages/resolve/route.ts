import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { apiError } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

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
    // Case-insensitive lookup — users.email isn't normalized at
    // signup, and the contact email on a tournament registration
    // might be "Sarah@x.com" while the user signed up as
    // "sarah@x.com". An exact eq() match silently 404'd in that
    // case and the button fell through to mailto, surprising the
    // admin who'd just messaged the same user successfully from
    // a different page.
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);
  if (!row) return apiError("No portal account for that email", 404);
  return NextResponse.json({ user: row });
}

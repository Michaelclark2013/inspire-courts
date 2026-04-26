import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { apiError } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, asc, like, ne, or, sql } from "drizzle-orm";

// GET /api/admin/messages/recipients?q=foo&scope=staff|all
//
// Returns a roster of users this caller is allowed to message. Roles
// honored:
//   - admin: can message anyone (staff + portal users — coaches, parents)
//   - staff/ref/front_desk: can message other admin-side users only
//
// scope=staff (default) only ever returns admin-side roles.
// scope=all (admin only) widens to include coaches + parents.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "messages")) {
    return apiError("Unauthorized", 401);
  }
  const meId = Number(session.user.id);
  if (!Number.isFinite(meId)) return apiError("Bad session", 400);

  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim().slice(0, 100);
  const requestedScope = sp.get("scope") || "staff";
  const scope = requestedScope === "all" && session.user.role === "admin" ? "all" : "staff";

  const adminRoles = ["admin", "staff", "ref", "front_desk"] as const;
  const allRoles = [...adminRoles, "coach", "parent"] as const;
  const allowedRoles = scope === "all" ? allRoles : adminRoles;

  const filters = [
    ne(users.id, meId),
    sql`${users.role} IN (${sql.join(allowedRoles.map((r) => sql`${r}`), sql`, `)})`,
  ];
  if (q.length >= 2) {
    const needle = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    const search = or(like(users.name, needle), like(users.email, needle));
    if (search) filters.push(search);
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(and(...filters))
    .orderBy(asc(users.name))
    .limit(50);

  return NextResponse.json({ recipients: rows, scope });
}

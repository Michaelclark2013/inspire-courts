import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { desc, or, eq, sql } from "drizzle-orm";

// GET /api/portal/announcements — get active announcements for current user's role
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role || "parent";
  const now = new Date().toISOString();

  // Get announcements where:
  // - audience is "all" OR matches user's role category
  // - not expired
  const all = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt));

  const filtered = all.filter((a) => {
    // Check expiry
    if (a.expiresAt && a.expiresAt < now) return false;
    // Check audience
    if (a.audience === "all") return true;
    if (a.audience === "coaches" && role === "coach") return true;
    if (a.audience === "parents" && role === "parent") return true;
    // Division-specific audiences pass through for now
    return true;
  });

  return NextResponse.json(filtered);
}

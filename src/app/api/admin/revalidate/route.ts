import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { canAccess } from "@/lib/permissions";

// Strict path allowlist. revalidatePath() accepts any string, so an
// unrestricted endpoint would let an admin (or a compromised admin session)
// trigger ISR cache invalidation for arbitrary paths — not catastrophic but
// a useful footgun to avoid. Explicitly enumerate the public + admin surfaces
// we expect admins to flush manually.
const ALLOWED_PATHS = new Set([
  "/",
  "/tournaments",
  "/schedule",
  "/scores",
  "/camps",
  "/events",
  "/training",
  "/teams",
  "/facility",
  "/about",
  "/gameday",
  "/media",
  "/prep",
  "/gallery",
  "/book",
  "/faq",
  "/contact",
  "/register",
  "/portal",
  "/admin",
  "/admin/tournaments",
  "/admin/scores",
  "/admin/announcements",
  "/admin/users",
  "/admin/approvals",
]);

// Dynamic path patterns (prefix match + numeric id). Add paths here sparingly
// — each one lets admins revalidate a family of routes.
const ALLOWED_DYNAMIC_PREFIXES = [
  /^\/tournaments\/\d+$/,
  /^\/admin\/tournaments\/\d+$/,
];

function isPathAllowed(path: string): boolean {
  if (ALLOWED_PATHS.has(path)) return true;
  return ALLOWED_DYNAMIC_PREFIXES.some((rx) => rx.test(path));
}

// POST /api/admin/revalidate
// Body: { path: string } — must be in ALLOWED_PATHS or match an allowed
// dynamic prefix. Lets admins force-flush an ISR cache from the UI without
// making a dummy mutation. Emits an admin.revalidate audit entry.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // Coupled to the admin "tournaments" page access because that's the
  // broadest set of admin roles who already manage cache-driven content.
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Modest rate limit — this is a cheap op but there's no reason for
  // an admin to hammer it either.
  const ip = getClientIp(request);
  if (isRateLimited(`admin-revalidate:${ip}`, 60, 60_000)) {
    return NextResponse.json(
      { error: "Too many revalidate requests. Slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let body: { path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path.trim() : "";
  if (!path) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }
  if (!isPathAllowed(path)) {
    return NextResponse.json(
      { error: "path is not in the revalidate allowlist", path },
      { status: 400 }
    );
  }

  try {
    revalidatePath(path);
    await recordAudit({
      session,
      action: "admin.revalidate",
      entityType: "cache",
      entityId: path,
      before: null,
      after: { path },
    });
    return NextResponse.json({ ok: true, path });
  } catch (err) {
    logger.error("revalidatePath failed", { path, error: String(err) });
    return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 });
  }
}

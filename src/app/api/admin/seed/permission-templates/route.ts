import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { permissionTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";

// POST /api/admin/seed/permission-templates
// Idempotent seeder — creates the 5 default permission bundles that
// the bulk dialog ships with, saved as editable templates.
const DEFAULTS: Array<{ name: string; description: string; defaultDurationDays: number | null; pages: Array<{ page: string; granted: boolean }> }> = [
  {
    name: "Tournament Scorekeeper",
    description: "Scorekeepers get access to enter scores + see their own schedule. Scoped to tournament weekends.",
    defaultDurationDays: 3,
    pages: [
      { page: "score_entry", granted: true },
      { page: "scores", granted: true },
      { page: "my_schedule", granted: true },
    ],
  },
  {
    name: "Front Desk+",
    description: "Front-desk staff with expanded access for events — check-in, members, programs, players.",
    defaultDurationDays: null,
    pages: [
      { page: "checkin", granted: true },
      { page: "members", granted: true },
      { page: "programs", granted: true },
      { page: "scores", granted: true },
      { page: "players", granted: true },
    ],
  },
  {
    name: "Read-only Admin",
    description: "Observe the facility without mutation — for trustees, investors, board members.",
    defaultDurationDays: null,
    pages: [
      { page: "overview", granted: true },
      { page: "scores", granted: true },
      { page: "tournaments", granted: true },
      { page: "teams", granted: true },
      { page: "players", granted: true },
    ],
  },
  {
    name: "Tournament Director",
    description: "Everything event-shaped: tournaments, teams, players, scores, check-in, announcements.",
    defaultDurationDays: 7,
    pages: [
      { page: "tournaments", granted: true },
      { page: "teams", granted: true },
      { page: "players", granted: true },
      { page: "scores", granted: true },
      { page: "score_entry", granted: true },
      { page: "checkin", granted: true },
      { page: "announcements", granted: true },
    ],
  },
  {
    name: "Revenue View",
    description: "Read access to money-related pages — revenue, leads, prospects.",
    defaultDurationDays: null,
    pages: [
      { page: "revenue", granted: true },
      { page: "leads", granted: true },
      { page: "prospects", granted: true },
    ],
  },
];

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const actorId = Number(session.user.id);
    let inserted = 0;
    let skipped = 0;
    for (const t of DEFAULTS) {
      const [existing] = await db
        .select()
        .from(permissionTemplates)
        .where(eq(permissionTemplates.name, t.name))
        .limit(1);
      if (existing) { skipped++; continue; }
      await db.insert(permissionTemplates).values({
        name: t.name,
        description: t.description,
        pagesJson: JSON.stringify(t.pages),
        defaultDurationDays: t.defaultDurationDays,
        createdBy: actorId,
      });
      inserted++;
    }
    await recordAudit({
      session,
      request,
      action: "seed.permission_templates",
      entityType: "permission_template",
      entityId: 0,
      before: null,
      after: { inserted, skipped },
    });
    return NextResponse.json({ ok: true, inserted, skipped });
  } catch (err) {
    logger.error("seed permission templates failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

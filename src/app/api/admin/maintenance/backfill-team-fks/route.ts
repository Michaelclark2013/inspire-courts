import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { backfillRegistrationTeamIds } from "@/lib/team-resolver";
import { recordAudit } from "@/lib/audit";
import { apiError } from "@/lib/api-helpers";

// POST /api/admin/maintenance/backfill-team-fks
// One-shot — walks every tournament_registrations row that doesn't
// yet have team_id stamped and applies the resolver. Idempotent.
// Admin-only.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return apiError("Admin only", 401);
  }
  const result = await backfillRegistrationTeamIds();
  await recordAudit({
    session,
    request: req,
    action: "maintenance.backfill_team_fks",
    entityType: "tournament_registrations",
    after: result,
  });
  return NextResponse.json(result);
}

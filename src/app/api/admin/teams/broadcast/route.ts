import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { players, users, teams, tournamentRegistrations } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { sendBroadcastEmail } from "@/lib/notify";

// POST /api/admin/teams/broadcast
// Body: {
//   teamId?: number,              // DB team
//   teamName?: string,            // or a raw team name (registration-only teams)
//   subject: string,
//   html: string,
// }
// Sends a broadcast email to every parent email linked to players
// on the given team, plus the coach email on any tournament
// registration matching the team.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const html = typeof body?.html === "string" ? body.html : "";
    if (!subject) return NextResponse.json({ error: "Subject required" }, { status: 400 });
    if (!html) return NextResponse.json({ error: "Body required" }, { status: 400 });

    const teamId = Number(body?.teamId);
    const teamName = typeof body?.teamName === "string" ? body.teamName.trim() : "";

    const recipients = new Set<string>();

    // Resolve team by id or name.
    let resolvedName: string | null = null;
    if (Number.isInteger(teamId) && teamId > 0) {
      const [t] = await db.select({ name: teams.name }).from(teams).where(eq(teams.id, teamId)).limit(1);
      if (!t) return NextResponse.json({ error: "Team not found" }, { status: 404 });
      resolvedName = t.name;

      // Collect parent emails from players linked to this team.
      const parentIds = await db
        .select({ parentUserId: players.parentUserId })
        .from(players)
        .where(eq(players.teamId, teamId));
      const ids = parentIds
        .map((r) => r.parentUserId)
        .filter((n): n is number => typeof n === "number");
      if (ids.length > 0) {
        const parents = await db
          .select({ email: users.email })
          .from(users)
          .where(inArray(users.id, ids));
        parents.forEach((p) => p.email && recipients.add(p.email.toLowerCase()));
      }
    }
    if (teamName) resolvedName = resolvedName || teamName;

    // Collect coach emails from any registrations where teamName matches.
    if (resolvedName) {
      const regs = await db
        .select({ email: tournamentRegistrations.coachEmail })
        .from(tournamentRegistrations)
        .where(eq(tournamentRegistrations.teamName, resolvedName));
      regs.forEach((r) => r.email && recipients.add(r.email.toLowerCase()));
    }

    if (recipients.size === 0) {
      return NextResponse.json({ error: "No recipients found for this team" }, { status: 400 });
    }

    const result = await sendBroadcastEmail({
      recipients: Array.from(recipients),
      subject,
      html,
    });

    await recordAudit({
      session,
      request,
      action: "team.broadcast_sent",
      entityType: "team",
      entityId: teamId || 0,
      before: null,
      after: {
        teamName: resolvedName,
        recipients: recipients.size,
        sent: result.sent,
        subject,
      },
    });

    return NextResponse.json({ ok: true, recipients: recipients.size, sent: result.sent });
  } catch (err) {
    logger.error("team broadcast failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

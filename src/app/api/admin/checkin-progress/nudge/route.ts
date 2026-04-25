import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournamentRegistrations, tournaments, checkins } from "@/lib/db/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { sendBroadcastEmail } from "@/lib/notify";
import { escapeHtml } from "@/lib/utils";

// POST /api/admin/checkin-progress/nudge
// Body: { tournamentId?: number, teamIds?: number[] }
// Emails the coach of every team that hasn't completed check-in. If
// teamIds is provided, only those; otherwise every incomplete team
// in the (active or explicit) tournament.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const requestedId = Number(body?.tournamentId);
    const onlyIds: number[] = Array.isArray(body?.teamIds)
      ? body.teamIds.map(Number).filter((n: number) => Number.isInteger(n) && n > 0)
      : [];

    // Resolve tournament.
    let tournament: { id: number; name: string; startDate: string } | null = null;
    if (Number.isInteger(requestedId) && requestedId > 0) {
      const [t] = await db
        .select({ id: tournaments.id, name: tournaments.name, startDate: tournaments.startDate })
        .from(tournaments)
        .where(eq(tournaments.id, requestedId))
        .limit(1);
      tournament = t ?? null;
    }
    if (!tournament) {
      const [t] = await db
        .select({ id: tournaments.id, name: tournaments.name, startDate: tournaments.startDate })
        .from(tournaments)
        .where(eq(tournaments.status, "active"))
        .orderBy(asc(tournaments.startDate))
        .limit(1);
      tournament = t ?? null;
    }
    if (!tournament) {
      return NextResponse.json({ error: "No active tournament" }, { status: 400 });
    }

    // Narrow to fields actually read by the nudge logic + email body.
    // If the caller passes onlyIds, push it into SQL too instead of
    // pulling every registration and filtering in JS.
    const regsQuery = db
      .select({
        id: tournamentRegistrations.id,
        teamName: tournamentRegistrations.teamName,
        coachName: tournamentRegistrations.coachName,
        coachEmail: tournamentRegistrations.coachEmail,
        playerCount: tournamentRegistrations.playerCount,
        rosterSubmitted: tournamentRegistrations.rosterSubmitted,
        waiversSigned: tournamentRegistrations.waiversSigned,
        paymentStatus: tournamentRegistrations.paymentStatus,
      })
      .from(tournamentRegistrations);
    const filtered = onlyIds.length > 0
      ? await regsQuery.where(
          and(
            eq(tournamentRegistrations.tournamentId, tournament.id),
            inArray(tournamentRegistrations.id, onlyIds)
          )
        )
      : await regsQuery.where(eq(tournamentRegistrations.tournamentId, tournament.id));

    // Pull current check-in counts
    const teamNames = filtered.map((r) => r.teamName);
    const counts: Record<string, number> = {};
    if (teamNames.length > 0) {
      const rows = await db
        .select({
          teamName: checkins.teamName,
          c: sql<number>`count(*)`,
        })
        .from(checkins)
        .where(and(eq(checkins.type, "checkin"), inArray(checkins.teamName, teamNames)))
        .groupBy(checkins.teamName);
      for (const r of rows) counts[r.teamName] = Number(r.c) || 0;
    }

    const incomplete = filtered.filter((r) => {
      const checkedIn = counts[r.teamName] || 0;
      const target = r.playerCount || 5;
      const complete =
        r.rosterSubmitted === true &&
        r.waiversSigned === true &&
        r.paymentStatus !== "pending" &&
        checkedIn >= target;
      return !complete;
    });

    let sent = 0;
    const missing: Array<{ teamName: string; email: string; gaps: string[] }> = [];
    for (const r of incomplete) {
      const checkedIn = counts[r.teamName] || 0;
      const gaps: string[] = [];
      if (!r.rosterSubmitted) gaps.push("Roster not submitted");
      if (!r.waiversSigned) gaps.push("Waivers not signed");
      if (r.paymentStatus === "pending") gaps.push("Payment pending");
      if (checkedIn < (r.playerCount || 5)) gaps.push(`Only ${checkedIn} of ${r.playerCount || 5} players checked in`);

      missing.push({ teamName: r.teamName, email: r.coachEmail, gaps });

      // Fire-and-forget email. Ignore errors so one bad address doesn't
      // block the batch; admin sees sent vs missing count. Coach name +
      // team name + tournament name are escaped before interpolation
      // so a name like `<img onerror>` can't render in the recipient's
      // mail client.
      try {
        const result = await sendBroadcastEmail({
          recipients: [r.coachEmail],
          subject: `Action needed: ${tournament.name} check-in (${r.teamName})`,
          html: `
            <p>Hi ${escapeHtml(r.coachName || "Coach")},</p>
            <p>Our records show ${escapeHtml(r.teamName)} hasn't completed the check-in process for <strong>${escapeHtml(tournament.name)}</strong>. Outstanding items:</p>
            <ul>${gaps.map((g) => `<li>${escapeHtml(g)}</li>`).join("")}</ul>
            <p>Please sign into the coach portal to finish check-in, or reply to this email if you need help.</p>
            <p>Thanks,<br/>Inspire Courts</p>
          `,
        });
        if (result.sent > 0) sent++;
      } catch (err) {
        logger.warn("check-in nudge email failed", { error: String(err), to: r.coachEmail });
      }
    }

    await recordAudit({
      session,
      request,
      action: "checkin.nudge_sent",
      entityType: "tournament",
      entityId: tournament.id,
      before: null,
      after: { sent, missing: missing.length, teamCount: filtered.length },
    });

    return NextResponse.json({ ok: true, sent, missing });
  } catch (err) {
    logger.error("checkin nudge failed", {
      error: String(err),
      actorId: session.user.id,
    });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

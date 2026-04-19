import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { db } from "@/lib/db";
import { tournamentRegistrations, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { recordAudit } from "@/lib/audit";
import { sendBroadcastEmail } from "@/lib/notify";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { notifySchema } from "@/lib/schemas";
import { parseJsonBody } from "@/lib/api-helpers";
import { withTiming } from "@/lib/timing";

// POST /api/admin/notify — admin-triggered email broadcast.
//
// Body:
//   {
//     subject: string,             // required, ≤200 chars
//     message: string,              // required, ≤10_000 chars (plain text or simple HTML)
//     audience: "coaches" | "parents" | "all",  // role-based
//     tournamentId?: number,        // optional — if set, only coaches on THIS tournament's registrations
//   }
//
// Uses BCC so recipients don't see each other's addresses. Rate-limited
// aggressively (per-IP) because each broadcast can cost a lot of Gmail API
// quota. Writes a notify.broadcast audit entry capturing recipient count
// and subject so sends are traceable.
export const POST = withTiming("admin.notify", async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canAccess(session.user.role, "tournaments")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`admin-notify:${ip}`, 10, 60 * 60_000)) {
    return NextResponse.json(
      { error: "Too many broadcast attempts. Try again in an hour." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  const parsed = await parseJsonBody(request, notifySchema);
  if (!parsed.ok) return parsed.response;

  const { subject: rawSubject, message: rawMessage, audience, tournamentId: tournamentIdRaw } = parsed.data;
  const subject = rawSubject.trim().slice(0, 200);
  const message = rawMessage.trim().slice(0, 10_000);
  const tournamentId = tournamentIdRaw ?? null;

  // Audience → role set map. Single source of truth for recipient query.
  const AUDIENCE_ROLE_MAP: Record<string, string[]> = {
    coaches: ["coach"],
    parents: ["parent"],
    refs: ["ref"],
    staff: ["staff", "front_desk"],
    all: ["coach", "parent", "ref", "staff", "front_desk"],
  };

  try {
    // Collect recipient emails. If tournamentId is supplied AND audience is
    // coaches/all, pull from tournamentRegistrations (coach-side only —
    // parents/refs/staff don't register teams). Otherwise fall back to the
    // users table filtered by the audience role set.
    let recipients: string[] = [];
    if (tournamentId && (audience === "coaches" || audience === "all")) {
      const regs = await db
        .select({ email: tournamentRegistrations.coachEmail })
        .from(tournamentRegistrations)
        .where(eq(tournamentRegistrations.tournamentId, tournamentId));
      recipients = regs.map((r) => r.email).filter((e): e is string => !!e);
    } else {
      const roleFilter = AUDIENCE_ROLE_MAP[audience];
      const rows = await db
        .select({ email: users.email })
        .from(users)
        .where(inArray(users.role, roleFilter as never[]));
      recipients = rows.map((r) => r.email).filter((e): e is string => !!e);
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients matched the selected audience" },
        { status: 400 }
      );
    }

    // Wrap the message in minimal HTML so admins can paste plain text
    // without worrying about markup.
    const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#0B1D3A;">${message.replace(/\n/g, "<br>")}</div>`;
    const result = await sendBroadcastEmail({ recipients, subject, html, text: message });

    await recordAudit({
      session,
      request,
      action: "notify.broadcast",
      entityType: "broadcast",
      entityId: tournamentId ?? null,
      before: null,
      after: {
        subject,
        audience,
        tournamentId,
        attempted: result.attempted,
        sent: result.sent,
      },
    });

    return NextResponse.json({
      ok: true,
      attempted: result.attempted,
      sent: result.sent,
    });
  } catch (err) {
    logger.error("Admin notify broadcast failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to send broadcast" }, { status: 500 });
  }
});

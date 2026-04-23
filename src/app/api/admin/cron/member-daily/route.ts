import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members, membershipPlans } from "@/lib/db/schema";
import { and, eq, gte, isNull, isNotNull, lt, lte, or } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { sendBroadcastEmail } from "@/lib/notify";

// GET/POST /api/admin/cron/member-daily
//
// Daily member-maintenance cron. Two jobs bundled into one call so
// Vercel doesn't burn two schedules on low-frequency work:
//   1. Email members whose next_renewal_at is 5-9 days out and
//      who haven't already been reminded this cycle. Moves
//      renewal_reminder_sent_at forward so we don't re-send.
//   2. Auto-unpause any members whose paused_until has passed —
//      flips status back to active and clears the field.
//
// Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET>.
// Returns 503 if CRON_SECRET isn't configured so misfires show up
// in logs instead of silently running.
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "member-daily cron disabled (CRON_SECRET not configured)" },
      { status: 503 }
    );
  }
  const authHeader = request.headers.get("authorization") || "";
  const provided = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const fiveDaysOut = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const nineDaysOut = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const results = {
    remindersSent: 0,
    remindersSkipped: 0,
    reminderFailures: 0,
    unpaused: 0,
  };

  // ── Job 1: renewal reminders ────────────────────────────────────
  try {
    const candidates = await db
      .select({
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        email: members.email,
        nextRenewalAt: members.nextRenewalAt,
        planName: membershipPlans.name,
        priceMonthlyCents: membershipPlans.priceMonthlyCents,
        priceAnnualCents: membershipPlans.priceAnnualCents,
      })
      .from(members)
      .leftJoin(membershipPlans, eq(membershipPlans.id, members.membershipPlanId))
      .where(
        and(
          eq(members.status, "active"),
          eq(members.autoRenew, true),
          isNotNull(members.email),
          gte(members.nextRenewalAt, fiveDaysOut),
          lt(members.nextRenewalAt, nineDaysOut),
          // Skip if we've already reminded in the last 30 days for
          // this cycle (captures edge cases where next_renewal_at
          // wasn't moved forward after a prior renewal payment).
          or(
            isNull(members.renewalReminderSentAt),
            lt(members.renewalReminderSentAt, thirtyDaysAgo)
          )!
        )
      )
      .limit(500);

    for (const m of candidates) {
      if (!m.email) {
        results.remindersSkipped++;
        continue;
      }
      try {
        const renewalDate = m.nextRenewalAt
          ? new Date(m.nextRenewalAt).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            })
          : "soon";
        const priceLine = m.priceMonthlyCents
          ? `Your ${m.planName} plan will auto-renew at $${(m.priceMonthlyCents / 100).toFixed(2)}/month.`
          : m.priceAnnualCents
            ? `Your ${m.planName} plan will auto-renew at $${(m.priceAnnualCents / 100).toFixed(2)}/year.`
            : `Your ${m.planName ?? "membership"} will auto-renew.`;

        const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#0B1D3A;">
          <p>Hi ${m.firstName},</p>
          <p>Quick heads-up — your Inspire Courts membership renews on <strong>${renewalDate}</strong>.</p>
          <p>${priceLine}</p>
          <p>No action needed if everything's good. If you need to update your card or pause your membership, reply to this email or stop by the front desk.</p>
          <p>— Inspire Courts AZ</p>
        </div>`;
        const text = `Hi ${m.firstName},\n\nYour Inspire Courts membership renews on ${renewalDate}. ${priceLine}\n\nReply or stop by the front desk if anything needs updating.\n\n— Inspire Courts AZ`;

        const result = await sendBroadcastEmail({
          recipients: [m.email],
          subject: `Your membership renews ${renewalDate}`,
          html, text,
        });
        if (result.sent > 0) {
          await db.update(members)
            .set({ renewalReminderSentAt: nowIso, updatedAt: nowIso })
            .where(eq(members.id, m.id));
          results.remindersSent++;
        } else {
          results.reminderFailures++;
        }
      } catch (err) {
        logger.warn("Renewal reminder send failed", { memberId: m.id, error: String(err) });
        results.reminderFailures++;
      }
    }
  } catch (err) {
    logger.error("Renewal reminder job failed", { error: String(err) });
  }

  // ── Job 2: auto-unpause ─────────────────────────────────────────
  try {
    const toUnpause = await db
      .select({ id: members.id, firstName: members.firstName })
      .from(members)
      .where(
        and(
          eq(members.status, "paused"),
          isNotNull(members.pausedUntil),
          lte(members.pausedUntil, nowIso)
        )
      )
      .limit(500);
    for (const m of toUnpause) {
      await db.update(members)
        .set({ status: "active", pausedUntil: null, updatedAt: nowIso })
        .where(eq(members.id, m.id));
      results.unpaused++;
    }
  } catch (err) {
    logger.error("Auto-unpause job failed", { error: String(err) });
  }

  return NextResponse.json({ ok: true, asOf: nowIso, results });
}

export const GET = handle;
export const POST = handle;

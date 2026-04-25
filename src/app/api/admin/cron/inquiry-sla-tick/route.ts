import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inquiries, inquiryNotes } from "@/lib/db/schema";
import { and, eq, isNull, lt, notInArray, sql } from "drizzle-orm";
import { sendBroadcastEmail } from "@/lib/notify";
import { logger } from "@/lib/logger";
import { requireCronSecret } from "@/lib/api-helpers";

// POST /api/admin/cron/inquiry-sla-tick
// Runs every 5 min. Finds inquiries that:
//   1. Are still status='new'
//   2. Have slaDueAt < now (past 30-min SLA)
//   3. Haven't already had an sla_alert_sent note
// Posts a single alert email per breach, then drops a note row so
// we don't spam the same inquiry every 5 min.
export async function POST(request: NextRequest) {
  const fail = requireCronSecret(request);
  if (fail) return fail;

  const now = new Date().toISOString();

  try {
    // Subquery: ids that already have an sla_alert_sent note.
    const alertedIdsSql = sql<number>`(SELECT DISTINCT ${inquiryNotes.inquiryId} FROM ${inquiryNotes} WHERE ${inquiryNotes.kind} = 'sla_alert_sent')`;

    const due = await db
      .select({
        id: inquiries.id,
        kind: inquiries.kind,
        name: inquiries.name,
        email: inquiries.email,
        phone: inquiries.phone,
        message: inquiries.message,
        slaDueAt: inquiries.slaDueAt,
      })
      .from(inquiries)
      .where(
        and(
          eq(inquiries.status, "new"),
          isNull(inquiries.firstTouchAt),
          lt(inquiries.slaDueAt, now),
          notInArray(inquiries.id, alertedIdsSql)
        )
      )
      .limit(50);

    if (due.length === 0) {
      return NextResponse.json({ ok: true, breached: 0 });
    }

    const adminEmail = process.env.INQUIRY_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || "mikeyclark.240@gmail.com";

    for (const inq of due) {
      const subject = `🚨 SLA BREACH — ${inq.name} inquiry past 30 min`;
      const html = `
        <h2>SLA breach</h2>
        <p>An inquiry has been sitting in <b>new</b> for over 30 minutes with no first touch.</p>
        <p><b>${inq.name}</b><br/>
        ${inq.phone ? `Phone: ${inq.phone}<br/>` : ""}
        ${inq.email ? `Email: ${inq.email}<br/>` : ""}
        Kind: ${inq.kind}<br/>
        SLA due: ${inq.slaDueAt}</p>
        ${inq.message ? `<p>Message: ${inq.message}</p>` : ""}
        <p><a href="${process.env.NEXTAUTH_URL || "https://inspirecourtsaz.com"}/admin/inquiries">Open in admin</a></p>
      `;
      try {
        await sendBroadcastEmail({ recipients: [adminEmail], subject, html, text: subject });
      } catch (err) {
        logger.warn("sla alert email failed", { id: inq.id, error: String(err) });
      }
      // If the note insert fails the row never marks the alert as sent,
      // so the next tick re-fires the email — surface the failure so it
      // can be investigated rather than silently spamming on-call.
      await db
        .insert(inquiryNotes)
        .values({
          inquiryId: inq.id,
          body: "SLA breach — alert email sent to on-call",
          kind: "sla_alert_sent",
        })
        .catch((err) => {
          logger.warn("sla alert note insert failed (will re-fire)", { id: inq.id, error: String(err) });
        });
    }

    logger.info("inquiry SLA tick", { breached: due.length });
    return NextResponse.json({ ok: true, breached: due.length });
  } catch (err) {
    logger.error("inquiry SLA tick failed", { error: String(err) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

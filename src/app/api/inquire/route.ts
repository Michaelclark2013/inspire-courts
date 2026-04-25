import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inquiries, inquiryNotes, INQUIRY_KINDS } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { sendSms } from "@/lib/sms";
import { sendBroadcastEmail } from "@/lib/notify";
import { fireWebhookEvent } from "@/lib/api-auth";
import { getInquiryConfigByKind, INQUIRY_CONFIGS } from "@/lib/inquiry-forms";

// POST /api/inquire — public endpoint; no auth.
// Rate limited per IP. Sends auto-SMS reply if phone present, emails
// the on-call rep, and fires the inquiry.created webhook so a Zapier
// hook (or anything else subscribed) can react.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`inquire:${ip}`, 8, 60_000)) {
    return NextResponse.json(
      { error: "Too many inquiries from this IP. Try again in a minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const body = await request.json();
    const kindRaw = String(body?.kind || "general");
    const validKind = (INQUIRY_KINDS as readonly string[]).includes(kindRaw)
      ? (kindRaw as (typeof INQUIRY_KINDS)[number])
      : ("general" as const);

    const name = String(body?.name || "").trim().slice(0, 100);
    const email = body?.email ? String(body.email).trim().slice(0, 200) : null;
    const phone = body?.phone ? String(body.phone).trim().slice(0, 30) : null;
    const message = body?.message ? String(body.message).slice(0, 2000) : null;
    const sports = body?.sports ? (Array.isArray(body.sports) ? body.sports.join(",") : String(body.sports)).slice(0, 200) : null;
    const source = body?.source ? String(body.source).slice(0, 80) : null;
    const pageUrl = body?.pageUrl ? String(body.pageUrl).slice(0, 500) : null;
    const details = body?.details && typeof body.details === "object" ? body.details : null;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
    }

    const slaDueAt = new Date(Date.now() + 30 * 60_000).toISOString();
    const userAgent = request.headers.get("user-agent")?.slice(0, 400) || null;

    const [row] = await db
      .insert(inquiries)
      .values({
        kind: validKind,
        status: "new",
        name,
        email,
        phone,
        message,
        sports,
        source,
        pageUrl,
        detailsJson: details ? JSON.stringify(details) : null,
        slaDueAt,
        submittedIp: ip,
        submittedUa: userAgent,
      })
      .returning({ id: inquiries.id });

    // Auto SMS reply (best effort).
    if (phone) {
      const config = getInquiryConfigByKind(validKind);
      const firstName = name.split(/\s+/)[0] || "there";
      const smsBody = (config?.smsReply || "Got it — we'll be in touch within 30 minutes. — Inspire Courts AZ").replace(/\{firstName\}/g, firstName);
      sendSms({ to: phone, body: smsBody, threadKey: `inquiry-${row.id}` })
        .then((r) => {
          if (r.ok) {
            db.insert(inquiryNotes)
              .values({ inquiryId: row.id, body: "Auto SMS reply sent", kind: "sms_sent" })
              .catch(() => {});
          }
        })
        .catch((err) => logger.warn("inquiry SMS failed", { error: String(err) }));
    }

    // Notify the rep on call.
    const adminEmail = process.env.INQUIRY_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || "mikeyclark.240@gmail.com";
    if (adminEmail) {
      const config = getInquiryConfigByKind(validKind);
      const subject = `🆕 New ${config?.title || "general"} inquiry — ${name}`;
      const html = `
        <h2>New inquiry: ${config?.title || "General"}</h2>
        <p><b>${name}</b><br/>
        ${email ? `Email: <a href="mailto:${email}">${email}</a><br/>` : ""}
        ${phone ? `Phone: ${phone}<br/>` : ""}
        ${sports ? `Sports: ${sports}<br/>` : ""}
        ${source ? `Source: ${source}<br/>` : ""}
        ${pageUrl ? `Page: ${pageUrl}<br/>` : ""}
        </p>
        ${details ? `<h3>Details</h3><pre>${JSON.stringify(details, null, 2)}</pre>` : ""}
        ${message ? `<h3>Message</h3><p>${message}</p>` : ""}
        <p><b>SLA — respond by ${new Date(slaDueAt).toLocaleString()}</b></p>
        <p><a href="${process.env.NEXTAUTH_URL || "https://inspirecourtsaz.com"}/admin/inquiries">Open in admin</a></p>
      `;
      sendBroadcastEmail({ recipients: [adminEmail], subject, html, text: `New ${config?.title} inquiry from ${name}` }).catch(() => {});
    }

    // Fire webhook so external integrations get notified.
    fireWebhookEvent("inquiry.created", { id: row.id, kind: validKind, name, email, phone, sports }).catch(() => {});

    return NextResponse.json({ ok: true, id: row.id });
  } catch (err) {
    logger.error("inquiry submit failed", { error: String(err) });
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }
}

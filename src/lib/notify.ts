import nodemailer from "nodemailer";
import { Resend } from "resend";
import { logger } from "@/lib/logger";
import { timestampAZ } from "@/lib/utils";
import { FACILITY_EMAIL, SITE_URL } from "@/lib/constants";

export interface LeadData {
  name?: string;
  email?: string;
  phone?: string;
  interest?: string;
  urgency?: string;
  summary?: string;
  transcript?: string;
  source?: string;
}

// ── Transport layer ───────────────────────────────────────────────────
// We prefer Resend (higher deliverability, 3,000/day free, domain auth
// via DKIM). Gmail SMTP stays as a dev/local fallback so a box without
// RESEND_API_KEY still sends during local work. If neither is configured
// we log + skip silently — same behavior the app already assumed.

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const gmailTransporter =
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      })
    : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || `Inspire Courts AZ <noreply@inspirecourtsaz.com>`;

type SendArgs = {
  from?: string;
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
};

// Centralized send. Returns true on success, false when no transport is
// configured or the send failed. Callers that care about per-recipient
// counts should use sendBroadcastEmail which wraps this.
async function send(args: SendArgs): Promise<boolean> {
  if (resend) {
    try {
      const toList = Array.isArray(args.to) ? args.to : [args.to];
      const bccList = args.bcc ? (Array.isArray(args.bcc) ? args.bcc : [args.bcc]) : undefined;
      const { error } = await resend.emails.send({
        from: args.from || FROM_EMAIL,
        to: toList,
        bcc: bccList,
        subject: args.subject,
        html: args.html,
        text: args.text,
      });
      if (error) {
        logger.error("Resend send failed", { error: String(error) });
        return false;
      }
      return true;
    } catch (err) {
      logger.error("Resend send threw", { error: String(err) });
      return false;
    }
  }
  if (gmailTransporter) {
    try {
      await gmailTransporter.sendMail({
        from: args.from || `"Inspire Courts AZ" <${process.env.GMAIL_USER}>`,
        to: args.to,
        bcc: args.bcc,
        subject: args.subject,
        html: args.html,
        text: args.text,
      });
      return true;
    } catch (err) {
      logger.error("Gmail send failed", { error: String(err) });
      return false;
    }
  }
  logger.warn("No email transport configured (set RESEND_API_KEY or GMAIL_USER+GMAIL_APP_PASSWORD)");
  return false;
}

export async function sendLeadEmail(lead: LeadData): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER || "mikeyclark.240@gmail.com";
  if (!adminEmail) return;

  const urgencyEmoji =
    lead.urgency === "Hot" ? "🔥" : lead.urgency === "Warm" ? "🟡" : "🔵";
  const subject = `${urgencyEmoji} New ${lead.urgency || "Unknown"} Lead: ${lead.interest || "General"} — ${lead.name || "Unknown Visitor"}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">🏀 Inspire Courts — New Lead</h2>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">via ${lead.source || "Chat Widget"}</p>
      </div>
      <div style="border: 1px solid #e0e0e0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #666; width: 100px;">Name</td><td style="padding: 8px 0;">${lead.name || "Not provided"}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #666;">Email</td><td style="padding: 8px 0;">${lead.email ? `<a href="mailto:${lead.email}">${lead.email}</a>` : "Not provided"}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #666;">Phone</td><td style="padding: 8px 0;">${lead.phone || "Not provided"}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #666;">Interest</td><td style="padding: 8px 0;"><span style="background: #e8f0fe; color: #1a73e8; padding: 2px 8px; border-radius: 12px; font-size: 13px;">${lead.interest || "General"}</span></td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #666;">Urgency</td><td style="padding: 8px 0;">${urgencyEmoji} ${lead.urgency || "Unknown"}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #666;">Summary</td><td style="padding: 8px 0;">${lead.summary || "No summary"}</td></tr>
        </table>
        ${lead.transcript ? `
        <div style="margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #1a73e8;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #666; font-size: 13px;">Recent Chat:</p>
          <pre style="margin: 0; white-space: pre-wrap; font-size: 13px; line-height: 1.5; font-family: inherit;">${lead.transcript}</pre>
        </div>` : ""}
        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999;">
          Sent by Inspire Courts Bot &bull; ${timestampAZ()}
        </div>
      </div>
    </div>
  `;

  await send({ to: adminEmail, subject, html });
}

/**
 * Send a broadcast email. Uses BCC so recipients don't see each other.
 * Returns per-recipient counts so the caller can surface them in the UI.
 */
export async function sendBroadcastEmail(opts: {
  recipients: string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: number; attempted: number }> {
  const recipients = [...new Set(opts.recipients.filter((r) => typeof r === "string" && r.includes("@")))];
  if (recipients.length === 0) return { sent: 0, attempted: 0 };

  // Resend caps recipients per call at 50 — batch to stay safe.
  const BATCH = 45;
  let sent = 0;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const chunk = recipients.slice(i, i + BATCH);
    // Primary "to" is the from address so recipient field has a value;
    // real recipients go in BCC for privacy.
    const ok = await send({
      to: FROM_EMAIL,
      bcc: chunk,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (ok) sent += chunk.length;
  }
  return { sent, attempted: recipients.length };
}

// ── Email verification ────────────────────────────────────────────────
// Sends the confirm-email link to a new user. Caller is responsible for
// generating the token + updating users.email_verify_* columns first.

interface VerificationEmailOpts {
  to: string;
  name: string; // used in greeting — falls back gracefully
  verifyUrl: string;
}

export async function sendVerificationEmail(
  opts: VerificationEmailOpts
): Promise<{ sent: boolean }> {
  const greeting = opts.name && opts.name.trim().length > 0 ? opts.name : "there";
  const subject = "Confirm your email — Inspire Courts AZ";
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: #0B1D3A; padding: 32px 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <img src="${SITE_URL}/images/inspire-athletics-logo.png" alt="Inspire Courts" style="width: 72px; height: 72px; object-fit: contain; display: block; margin: 0 auto 12px;" />
        <h2 style="color: white; margin: 0; font-size: 16px; letter-spacing: 2px;">INSPIRE COURTS</h2>
      </div>
      <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 14px; line-height: 1.6;">Hey ${greeting},</p>
        <p style="color: #333; font-size: 14px; line-height: 1.6;">
          Thanks for signing up. Tap the button below to confirm your
          email address and finish setting up your account.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${opts.verifyUrl}" style="background: #CC0000; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #999; font-size: 12px; line-height: 1.5;">
          This link expires in 24 hours. If you didn't sign up for an
          Inspire Courts account, ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
        <p style="color: #bbb; font-size: 11px; text-align: center;">
          Inspire Courts AZ &bull; Gilbert, Arizona &bull;
          <a href="mailto:${FACILITY_EMAIL}" style="color: #bbb;">${FACILITY_EMAIL}</a>
        </p>
      </div>
    </div>
  `;
  const text = `Welcome to Inspire Courts. Confirm your email by opening this link within 24 hours: ${opts.verifyUrl}`;

  const ok = await send({ to: opts.to, subject, html, text });
  return { sent: ok };
}

// Surfaced for /admin/launch-status + launch-readiness UIs that want to
// show which transport is actually wired up.
export function emailTransportStatus(): { provider: "resend" | "gmail" | "none"; from: string } {
  if (resend) return { provider: "resend", from: FROM_EMAIL };
  if (gmailTransporter) return { provider: "gmail", from: process.env.GMAIL_USER || "" };
  return { provider: "none", from: "" };
}

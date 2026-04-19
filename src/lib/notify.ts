import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";
import { timestampAZ } from "@/lib/utils";

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

const transporter =
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })
    : null;

export async function sendLeadEmail(lead: LeadData): Promise<void> {
  if (!transporter) {
    logger.warn("Gmail not configured, skipping notification email");
    return;
  }

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
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666; width: 100px;">Name</td>
            <td style="padding: 8px 0;">${lead.name || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666;">Email</td>
            <td style="padding: 8px 0;">${lead.email ? `<a href="mailto:${lead.email}">${lead.email}</a>` : "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666;">Phone</td>
            <td style="padding: 8px 0;">${lead.phone || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666;">Interest</td>
            <td style="padding: 8px 0;"><span style="background: #e8f0fe; color: #1a73e8; padding: 2px 8px; border-radius: 12px; font-size: 13px;">${lead.interest || "General"}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666;">Urgency</td>
            <td style="padding: 8px 0;">${urgencyEmoji} ${lead.urgency || "Unknown"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666;">Summary</td>
            <td style="padding: 8px 0;">${lead.summary || "No summary"}</td>
          </tr>
        </table>
        ${
          lead.transcript
            ? `
        <div style="margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #1a73e8;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #666; font-size: 13px;">Recent Chat:</p>
          <pre style="margin: 0; white-space: pre-wrap; font-size: 13px; line-height: 1.5; font-family: inherit;">${lead.transcript}</pre>
        </div>`
            : ""
        }
        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999;">
          Sent by Inspire Courts Bot &bull; ${timestampAZ()}
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Inspire Courts Bot" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject,
      html,
    });
    // Email sent successfully
  } catch (error) {
    logger.error("Failed to send lead notification email", { error: String(error) });
  }
}

/**
 * Send a broadcast email via Gmail BCC. Admin-facing utility.
 * Returns the number of recipients attempted so callers can surface it.
 * Silently returns 0 when the transporter is unconfigured.
 */
export async function sendBroadcastEmail(opts: {
  recipients: string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: number; attempted: number }> {
  const recipients = [...new Set(opts.recipients.filter((r) => typeof r === "string" && r.includes("@")))];
  if (!transporter || recipients.length === 0) {
    if (!transporter) logger.warn("Gmail not configured, skipping broadcast email");
    return { sent: 0, attempted: recipients.length };
  }
  try {
    // Use BCC so recipients don't see each other's addresses. The primary
    // `to` is the sender account itself — Gmail requires a To field.
    await transporter.sendMail({
      from: `"Inspire Courts AZ" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      bcc: recipients.join(","),
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return { sent: recipients.length, attempted: recipients.length };
  } catch (error) {
    logger.error("Failed to send broadcast email", { error: String(error) });
    return { sent: 0, attempted: recipients.length };
  }
}

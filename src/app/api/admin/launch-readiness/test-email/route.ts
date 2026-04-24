import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendBroadcastEmail } from "@/lib/notify";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

// POST /api/admin/launch-readiness/test-email
//
// Sends a short diagnostic email to ADMIN_EMAIL so the admin can verify
// Gmail SMTP is correctly configured without needing to submit the
// public /contact form. Rate limited to 3/min to prevent accidental
// spam during env-var tuning. Admin-only.

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`launch-test-email:${ip}`, 3, 60_000)) {
    return NextResponse.json(
      { error: "Too many test sends. Wait a minute." },
      { status: 429 }
    );
  }

  const to = process.env.ADMIN_EMAIL;
  if (!to) {
    return NextResponse.json(
      {
        ok: false,
        error: "ADMIN_EMAIL env var is not set.",
      },
      { status: 400 }
    );
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "GMAIL_USER / GMAIL_APP_PASSWORD not configured. Email delivery will not work until these are set in Vercel.",
      },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const subject = "Inspire Courts — Launch Readiness Test Email";
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: #0B1D3A; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="color: white; margin: 0; font-size: 16px; letter-spacing: 2px;">INSPIRE COURTS</h2>
      </div>
      <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 14px;">
          <strong>✅ Gmail SMTP is working.</strong>
        </p>
        <p style="color: #666; font-size: 13px; line-height: 1.6;">
          This is a diagnostic test from the admin Launch Readiness dashboard
          confirming that the Gmail transporter can send email from the
          production environment.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Sent at ${now}<br/>
          Triggered by: ${session.user.email ?? "unknown admin"}
        </p>
      </div>
    </div>
  `;
  const text = `Gmail SMTP is working. Launch-readiness test email sent at ${now}.`;

  const result = await sendBroadcastEmail({
    recipients: [to],
    subject,
    html,
    text,
  });

  if (result.sent === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Email attempt failed — check Vercel runtime logs for the SMTP error (likely auth or firewall).",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    sentTo: to,
    sentAt: now,
  });
}

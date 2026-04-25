import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { handleInboundSms } from "@/lib/sms";
import { logger } from "@/lib/logger";

// POST /api/webhooks/twilio — Twilio inbound SMS webhook.
// Twilio sends application/x-www-form-urlencoded with From/Body/MessageSid.
// We:
//   1. Verify the X-Twilio-Signature header against TWILIO_AUTH_TOKEN.
//      Without this an attacker could spoof STOP keywords to opt-out
//      arbitrary users or halt journey enrollments by faking replies.
//   2. Respond 200 with empty TwiML so Twilio doesn't retry.
const ok = () => new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } });

export async function POST(request: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    logger.error("twilio webhook hit without TWILIO_AUTH_TOKEN configured");
    // Don't process unsigned traffic. 401 also tells Twilio not to keep retrying.
    return new NextResponse("Twilio not configured", { status: 401 });
  }

  try {
    // Read body as raw text first so we can use it for both signature
    // verification AND form parsing (formData() consumes the stream).
    const rawBody = await request.text();
    const form = new URLSearchParams(rawBody);
    const params: Record<string, string> = {};
    for (const [k, v] of form.entries()) params[k] = v;

    const signature = request.headers.get("x-twilio-signature") || "";
    // Twilio expects the FULL public URL of the webhook for signature calc.
    // x-forwarded-proto + host preferred (Vercel); fall back to request URL.
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "";
    const fullUrl = host
      ? `${proto}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`
      : request.url;

    const valid = twilio.validateRequest(authToken, signature, fullUrl, params);
    if (!valid) {
      logger.warn("twilio signature invalid", { from: params.From });
      return new NextResponse("Invalid signature", { status: 403 });
    }

    const from = params.From || "";
    const body = params.Body || "";
    const sid = params.MessageSid || "";
    if (!from || !body) return ok();

    const r = await handleInboundSms({ from, body, twilioSid: sid });
    if (r.optOut) {
      logger.info("SMS opt-out recorded", { from });
    }
    return ok();
  } catch (err) {
    logger.error("twilio webhook failed", { error: String(err) });
    return ok();
  }
}

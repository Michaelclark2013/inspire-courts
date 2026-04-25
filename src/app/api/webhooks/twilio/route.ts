import { NextRequest, NextResponse } from "next/server";
import { handleInboundSms } from "@/lib/sms";
import { logger } from "@/lib/logger";

// POST /api/webhooks/twilio — Twilio inbound SMS webhook.
// Twilio sends application/x-www-form-urlencoded with From/Body/MessageSid.
// We respond 200 with empty TwiML so Twilio doesn't retry.
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const from = String(form.get("From") || "");
    const body = String(form.get("Body") || "");
    const sid = String(form.get("MessageSid") || "");
    if (!from || !body) {
      return new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }
    const r = await handleInboundSms({ from, body, twilioSid: sid });
    // If they texted STOP, Twilio handles the actual message blocking;
    // we just record the opt-out for our own outbound logic.
    if (r.optOut) {
      logger.info("SMS opt-out recorded", { from });
    }
    return new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } });
  } catch (err) {
    logger.error("twilio webhook failed", { error: String(err) });
    return new NextResponse("<Response/>", { headers: { "Content-Type": "text/xml" } });
  }
}

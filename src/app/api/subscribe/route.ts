import { NextRequest, NextResponse } from "next/server";
import { subscribeSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { appendSheetRow, sanitizeSheetRow, SHEETS } from "@/lib/google-sheets";
import { timestampAZ } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(`subscribe:${ip}`, 5, 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const result = subscribeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const cleanEmail = result.data.email.trim().toLowerCase();

    // Save to prospect pipeline sheet (fire-and-forget)
    const timestamp = timestampAZ();
    appendSheetRow(SHEETS.prospectPipeline, "Sheet1!A:G", [
      sanitizeSheetRow([timestamp, "", cleanEmail, "", "General", "Newsletter Subscribe", "Warm"]),
    ]).catch((err) => logger.error("Failed to save subscriber to sheet", { error: String(err) }));

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const listId = process.env.MAILCHIMP_LIST_ID;

    if (apiKey && listId) {
      // Mailchimp keys are always `<key>-<datacenter>`. If the key is
      // malformed there's no useful URL to call — return success-noop
      // so the user still sees the friendly confirmation, and log so
      // we can fix the env var.
      const dc = apiKey.split("-").pop();
      if (!dc || dc === apiKey) {
        logger.warn("subscribe: MAILCHIMP_API_KEY is missing the -<dc> suffix; skipping send");
      } else {
      const res = await fetch(
        `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`,
        {
          method: "POST",
          headers: {
            Authorization: `apikey ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address: cleanEmail,
            status: "subscribed",
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();

        // Mailchimp returns "Member Exists" if already subscribed
        if (data.title === "Member Exists") {
          return NextResponse.json({ success: true });
        }

        logger.error("Mailchimp subscription failed", { title: data.title });
        return NextResponse.json(
          { success: false, error: "Subscription failed. Please try again." },
          { status: 500 }
        );
      }
      }
    } else {
      // Don't log the email itself — it's PII and we never use the
      // log to recover the address. Log just enough to show the path
      // is being hit so ops can confirm config issues.
      logger.info("Mailchimp not configured — newsletter signup captured (no env vars set)");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Subscribe handler failed", { error: String(err) });
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
